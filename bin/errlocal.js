#!/usr/bin/env node

import { program } from 'commander';
import { execa } from 'execa';
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

// Import modules
import { loadState, saveState } from '../src/state.js';
import { analyzeError } from '../src/ai.js';
import { localizeContent } from '../src/lingo.js';
import { syncLog, fetchHistory, markSolved } from '../src/api.js';

// 1. Try loading from current directory (Project specific)
dotenv.config();

// 2. Try loading from home directory (Global config)
const globalConfigPath = path.join(os.homedir(), '.errlocal', '.env');
dotenv.config({ path: globalConfigPath });

// --- CLI Logic ---

program
  .version('0.1.0')
  .description('Run a command and localize its error output using AI & Lingo.dev');

program
  .command('run <command> [args...]')
  .description('Run a command (e.g. errlocal run npm start)')
  .option('--lang <locale>', 'Target language for localization (e.g. hi, es, fr)')
  .action(async (command, args, options) => {
    try {
        console.log(chalk.blue(`Running: ${command} ${args.join(' ')}`));
        
        const subprocess = execa(command, args, {
            stdio: ['inherit', 'inherit', 'pipe'],
            reject: false
        });

        let stderrOutput = '';

        if (subprocess.stderr) {
            subprocess.stderr.on('data', (chunk) => {
                process.stderr.write(chunk);
                stderrOutput += chunk.toString();
            });
        }

        const { exitCode } = await subprocess;

        if (exitCode !== 0 || stderrOutput.trim().length > 0) {
            console.log(chalk.yellow('\n--- ⚠️  Wait! Analyzing error... ---\n'));

            try {
                // 1. Analyze with AI
                const analysis = await analyzeError(stderrOutput, `${command} ${args.join(' ')}`);
                
                let localized = analysis;

                // 2. Localize with Lingo.dev if --lang is present
                if (options.lang) {
                    try {
                        console.log(chalk.blue(`Translating to ${options.lang}...`));
                        localized = await localizeContent(analysis, options.lang);
                    } catch (lingoError) {
                        console.error(chalk.red("Localization failed:"), lingoError.message);
                        console.log(chalk.gray("Falling back to English."));
                    }
                }

                // 3. Save State (Combine enhanced fields for compatibility)
                const enhancedExplanation = `
**Error Type:** ${localized.errorType}
**Confidence:** ${localized.confidence}
**Likely Cause:** ${localized.likelyCause}
**Suggested Fix:** ${localized.suggestedFix}

---
${localized.finalExplanation}
                `.trim();

                const state = {
                    command: `${command} ${args.join(' ')}`,
                    error: stderrOutput,
                    step: 0,
                    hints: localized.hints,
                    finalExplanation: enhancedExplanation,
                    timestamp: new Date().toISOString()
                };
                await saveState(state);

                // 4. Show Analysis & First Hint
                console.log(chalk.bold.magenta(`\n🧠 Analysis:`));
                console.log(`${chalk.bold("Type:")} ${localized.errorType}`);
                console.log(`${chalk.bold("Confidence:")} ${localized.confidence}`);
                
                console.log(chalk.bold.cyan("\n🔍 Hint 1:"));
                console.log(localized.hints[0]);
                console.log(chalk.gray("\n(Run 'errlocal next' for more hints)"));

            } catch (err) {
                console.error(chalk.red("Analysis failed:"), err.message);
            }
        }

        process.exit(exitCode);

    } catch (error) {
        console.error(chalk.red('Failed to run command:'), error.message);
        process.exit(1);
    }
  });

program
  .command('sync')
  .description('Sync the last error to Urbackend cloud')
  .action(async () => {
      const state = await loadState();
      if (!state) {
          console.log(chalk.red("No active error state found. Run a command first."));
          return;
      }

      try {
          console.log(chalk.blue("Syncing error log to Urbackend..."));
          const logId = await syncLog(state);
          console.log(chalk.green(`✅ Synced successfully! Log ID: ${logId || 'Saved'}`));

          if (logId) {
              state.logId = logId;
              await saveState(state);
          }

      } catch (err) {
          console.error(chalk.red("Sync failed:"), err.message);
      }
  });

program
  .command('history')
  .description('Show past error logs from Urbackend')
  .action(async () => {
      try {
          const history = await fetchHistory();
          
          if (history.length === 0) {
              console.log(chalk.yellow("No history found."));
              return;
          }

          // Sort by timestamp desc and take top 5
          const recent = history.slice(-5).reverse(); 

          console.log(chalk.bold.blue("\n📜 Recent Error History (Last 5):"));
          console.log(chalk.gray("------------------------------------------------"));

          recent.forEach((item, index) => {
              const time = item.timestamp ? new Date(item.timestamp).toLocaleString() : 'Unknown Time';
              console.log(`${index + 1}. ${chalk.bold.white(item.command || 'Unknown Command')}`);
              console.log(`   ${chalk.red(item.error ? item.error.split('\n')[0] : 'No error output')}...`); 
              console.log(`   ${chalk.gray(time)}`);
              console.log(chalk.gray("------------------------------------------------"));
          });

      } catch (err) {
          console.error(chalk.red("Failed to fetch history:"), err.message);
      }
  });

program
  .command('solved [note...]')
  .description('Mark the last synced error as SOLVED')
  .action(async (noteParts) => {
      const state = await loadState();
      if (!state || !state.logId) {
          console.log(chalk.red("No active synced error found. Run 'errlocal sync' first."));
          return;
      }

      const note = noteParts.join(' ') || "Fixed by user";

      try {
          console.log(chalk.blue(`Marking log ${state.logId} as SOLVED...`));
          await markSolved(state.logId, note);
          console.log(chalk.green("✅ Error marked as SOLVED in cloud!"));
          
          delete state.logId;
          await saveState(state);

      } catch (err) {
          console.error(chalk.red("Failed to update status:"), err.message);
      }
  });

program
  .command('next')
  .description('Show the next hint for the last error')
  .action(async () => {
      const state = await loadState();
      if (!state) {
          console.log(chalk.red("No active error state found. Run a command first."));
          return;
      }

      state.step++;
      
      if (state.step < state.hints.length) {
          console.log(chalk.bold.cyan(`🔍 Hint ${state.step + 1}:`));
          console.log(state.hints[state.step]);
          await saveState(state);
      } else {
          console.log(chalk.bold.green("✅ Full Explanation:"));
          console.log(state.finalExplanation);
      }
  });

// Handle default command
if (process.argv.length > 2 && !['run', 'next', 'sync', 'history', 'solved', '--help', '-h', '--version', '-V'].includes(process.argv[2])) {
    // If the first arg is not a known command, treat it as "run"
     // Note: This logic is tricky with modules as standard, leaving simple for now
}

program.parse(process.argv);
