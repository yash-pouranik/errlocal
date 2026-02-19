#!/usr/bin/env node

import { program } from 'commander';
import { execa } from 'execa';
import chalk from 'chalk';
import dotenv from 'dotenv';
import path from 'path';
import os from 'os';

import fs from 'fs/promises';
import { select, confirm } from '@inquirer/prompts';

// Import modules
import { loadState, saveState } from '../src/state.js';
import { analyzeError } from '../src/ai.js';
import { getErrorContext } from '../src/context.js';
import { applyFix } from '../src/fs-utils.js';
import { localizeContent } from '../src/lingo.js';
import { syncLog, fetchHistory, markSolved } from '../src/api.js';

// load project config
dotenv.config();

// load global config
const globalConfigPath = path.join(os.homedir(), '.errlocal', '.env');
dotenv.config({ path: globalConfigPath });

// --- CLI Logic ---

const pkg = JSON.parse(await fs.readFile(new URL('../package.json', import.meta.url)));

program
    .version(pkg.version, '-v, -V, --version')
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
                // analyze error
                const codeContext = await getErrorContext(stderrOutput);
                if (codeContext) {
                    console.log(chalk.gray(`\n   📄 Found context: ${path.basename(codeContext.filePath)}:${codeContext.lineNumber}`));
                }

                const analysis = await analyzeError(stderrOutput, `${command} ${args.join(' ')}`, codeContext);
                
                // save initial state
                let state = {
                    command: `${command} ${args.join(' ')}`,
                    error: stderrOutput,
                    analysis: analysis, // Store the full analysis object
                    step: 0,
                    timestamp: new Date().toISOString()
                };
                await saveState(state);

                // Initial Output
                console.log(chalk.bold.red(`\n❌ Error Detected: ${analysis.errorType}`));
                console.log(chalk.dim(analysis.likelyCause));
                
                if (analysis.fixAction) {
                    console.log(chalk.green(`\n💡 Fix Available: ${analysis.fixAction.description || 'Auto-fix ready'}`));
                }

                while (true) {
                    const action = await select({
                        message: 'What would you like to do?',
                        choices: [
                            {
                                name: '💡 Explain Error',
                                value: 'explain',
                                description: 'Show detailed explanation and hints'
                            },
                            {
                                name: '🔧 Auto-Fix',
                                value: 'fix',
                                disabled: !analysis.fixAction ? '(No auto-fix available)' : false,
                                description: 'Apply the suggested fix automatically'
                            },
                            {
                                name: '🌍 Translate',
                                value: 'translate',
                                description: 'Translate explanation to another language'
                            },
                            {
                                name: '☁️ Sync to Cloud',
                                value: 'sync',
                                description: 'Sync error log to dashboard'
                            },
                            {
                                name: '🚪 Exit',
                                value: 'exit'
                            }
                        ]
                    });

                    if (action === 'exit') {
                        break;
                    }

                    if (action === 'explain') {
                        console.log(chalk.bold.magenta(`\n🧠 Analysis:`));
                        console.log(`${chalk.bold("Type:")} ${analysis.errorType}`);
                        console.log(`${chalk.bold("Confidence:")} ${analysis.confidence}`);
                        
                        // Progressive Hint Loop
                        let hintIndex = 0;
                        const hints = analysis.hints || [];
                        
                        while(true) {
                            // Show current hint key
                            if (hintIndex < hints.length) {
                                console.log(chalk.bold.cyan(`\n🔍 Hint ${hintIndex + 1}:`));
                                console.log(hints[hintIndex]);
                            } else {
                                console.log(chalk.bold.green("\n✅ Full Explanation:"));
                                console.log(analysis.finalExplanation || "No detailed explanation available.");
                                break; // End of explanation
                            }

                            const nextAction = await select({
                                message: 'Next step?',
                                choices: [
                                    {
                                        name: hintIndex < hints.length - 1 ? '👉 Next Hint' : '✅ Show Full Explanation',
                                        value: 'next'
                                    },
                                    {
                                        name: '🔙 Back to Menu',
                                        value: 'back'
                                    }
                                ]
                            });

                            if (nextAction === 'back') {
                                break;
                            }

                            hintIndex++;
                        }
                        console.log(''); // newline
                    }

                    if (action === 'fix') {
                         if (!analysis.fixAction) {
                             console.log(chalk.yellow("No auto-fix available for this error."));
                             continue;
                         }

                         console.log(chalk.bold.cyan("\nProposed Change:"));
                         console.log(`${chalk.gray(analysis.fixAction.filePath)}:${chalk.yellow(analysis.fixAction.lineNumber)}`);
                         console.log(chalk.red("- (Old Code) [Need to read file to show old code, or rely on user trust]")); 
                         // Note: In a real diff we'd show old code. For now showing new.
                         console.log(chalk.green(`+ ${analysis.fixAction.code}`));

                         const confirmed = await confirm({ message: 'Apply this fix now?' });
                         
                         if (confirmed) {
                             const success = await applyFix(analysis.fixAction);
                             if (success) {
                                 console.log(chalk.bold.green("🚀 Fix applied! Try running the command again."));
                                 break; // Exit after fixing
                             }
                         }
                    }

                    if (action === 'translate') {
                        const lang = await select({
                            message: 'Select Language:',
                            choices: [
                                { name: 'Hindi (hi)', value: 'hi' },
                                { name: 'Spanish (es)', value: 'es' },
                                { name: 'French (fr)', value: 'fr' },
                                { name: 'German (de)', value: 'de' }
                            ]
                        });

                        try {
                            console.log(chalk.blue(`Translating to ${lang}...`));
                            const localized = await localizeContent(state.analysis, lang);
                            // Update state with localized version for display
                            analysis.likelyCause = localized.likelyCause;
                            analysis.finalExplanation = localized.finalExplanation;
                            analysis.hints = localized.hints;
                            console.log(chalk.green("✅ Translated!"));
                            
                            // Show the translation immediately
                            console.log(chalk.bold.magenta(`\n🧠 Analysis (${lang}):`));
                            console.log(analysis.likelyCause);
                            console.log(analysis.finalExplanation);

                        } catch (err) {
                            console.error(chalk.red("Translation failed:"), err.message);
                        }
                    }

                    if (action === 'sync') {
                         // Call existing sync logic (refactored or invoked)
                         // For now, let's keep it simple and just run the sync logic here or call a helper
                         // accessing program commands is tricky from here. 
                         // better to just call the API function directly if possible.
                         // But for now, let's just use the existing syncLog function
                         try {
                              const note = await select({
                                  message: "Syncing...",
                                  choices: [{name: "Continue", value: "go"}]
                              });
                              // We need to import syncLog. It was imported.
                              const logId = await syncLog({ ...state, analysis }); 
                              console.log(chalk.green(`✅ Synced! Log ID: ${logId}`));
                         } catch (err) {
                             console.log(chalk.red("Sync failed"));
                         }
                    }
                }

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
    // If command not recognized, logic to handle or warn can go here
}

program.parse(process.argv);
