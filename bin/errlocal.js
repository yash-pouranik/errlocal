#!/usr/bin/env node

import { program } from 'commander';
import { execa } from 'execa';
import chalk from 'chalk';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { Groq } from 'groq-sdk';
import { LingoDotDevEngine  } from 'lingo.dev/sdk';
import os from 'os';

const Lingo = LingoDotDevEngine;

// 1. Try loading from current directory (Project specific)
dotenv.config();

// 2. Try loading from home directory (Global config)
// ~/.errlocal/.env
const globalConfigPath = path.join(os.homedir(), '.errlocal', '.env');
dotenv.config({ path: globalConfigPath });

const STATE_FILE = path.join(process.cwd(), '.errlocal-state.json');

// --- Helper Functions ---

async function saveState(data) {
    await fs.writeFile(STATE_FILE, JSON.stringify(data, null, 2));
}

async function loadState() {
    try {
        const data = await fs.readFile(STATE_FILE, 'utf-8');
        return JSON.parse(data);
    } catch {
        return null; // No state exists
    }
}

async function analyzeError(errorOutput, command) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        throw new Error("GROQ_API_KEY not found in environment variables.");
    }

    const groq = new Groq({ apiKey });

    const prompt = `
    You are an expert developer assistant.
    Analyze the following error output from the command "${command}".
    
    Provide your response in strict JSON format with the following structure:
    {
        "hints": [
            "Hint 1: A brief, high-level pointer (e.g., check assumptions).",
            "Hint 2: A more specific pointer (e.g., check async/await).",
            "Hint 3: A very specific clue about the code logic."
        ],
        "finalExplanation": "A detailed explanation of the error and how to fix it."
    }

    Error Output:
    ${errorOutput}
    `;

    const completion = await groq.chat.completions.create({
        messages: [
            {
                role: "system",
                content: "You are a helpful assistant that outputs JSON."
            },
            {
                role: "user",
                content: prompt
            }
        ],
        model: "openai/gpt-oss-120b",
        response_format: { type: "json_object" }
    });

    const content = completion.choices[0]?.message?.content || "{}";
    return JSON.parse(content);
}

// --- CLI Logic ---

program
  .version('0.0.1')
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
                        const lingo = new Lingo({ apiKey: process.env.LINGO_API_KEY });
                        
                        // Use localizeObject to translate the entire structure
                        localized = await lingo.localizeObject(analysis, {
                            sourceLocale: 'en',
                            targetLocale: options.lang
                        });

                    } catch (lingoError) {
                        console.error(chalk.red("Localization failed:"), lingoError.message);
                        console.log(chalk.gray("Falling back to English."));
                    }
                }

                // 3. Save State
                const state = {
                    command: `${command} ${args.join(' ')}`,
                    error: stderrOutput,
                    step: 0,
                    hints: localized.hints,
                    finalExplanation: localized.finalExplanation,
                    timestamp: new Date().toISOString()
                };
                await saveState(state);

                // 4. Show First Hint
                console.log(chalk.bold.cyan("🔍 Hint 1:"));
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

      const apiKey = process.env.URBACKEND_API_KEY;
      if (!apiKey) {
          console.log(chalk.red("Missing URBACKEND_API_KEY in .env"));
          console.log(chalk.yellow("Get your key from your Urbackend dashboard to sync logs."));
          return;
      }

      try {
          console.log(chalk.blue("Syncing error log to Urbackend..."));
          
          const response = await fetch('https://api.urbackend.bitbros.in/api/data/error_logs', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': apiKey
              },
              body: JSON.stringify({
                  command: state.command,
                  error: state.error,
                  hints: JSON.stringify(state.hints), 
                  finalExplanation: state.finalExplanation,
                  timestamp: state.timestamp
              })
          });

          if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`API Error (${response.status}): ${errorText}`);
          }

          const data = await response.json();
          const logId = data._id;
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
      const apiKey = process.env.URBACKEND_API_KEY;
      if (!apiKey) {
          console.log(chalk.red("Missing URBACKEND_API_KEY in .env"));
          return;
      }

      try {
          // Fetch all items from 'error_logs' collection
          const response = await fetch('https://api.urbackend.bitbros.in/api/data/error_logs', {
              headers: { 'x-api-key': apiKey }
          });

          if (!response.ok) {
              throw new Error(`API Error: ${response.statusText}`);
          }

          const data = await response.json();
          // Assuming data is an array of objects
          if (!Array.isArray(data)) {
              console.log(chalk.yellow("No history found or unexpected format."));
              return;
          }

          // Sort by timestamp desc (if not already) and take top 5
          const history = data.slice(-5).reverse(); 

          console.log(chalk.bold.blue("\n📜 Recent Error History (Last 5):"));
          console.log(chalk.gray("------------------------------------------------"));

          history.forEach((item, index) => {
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

      const apiKey = process.env.URBACKEND_API_KEY;
      if (!apiKey) {
          console.log(chalk.red("Missing URBACKEND_API_KEY in .env"));
          return;
      }

      const note = noteParts.join(' ') || "Fixed by user";

      try {
          console.log(chalk.blue(`Marking log ${state.logId} as SOLVED...`));

          // Urbackend PUT /api/data/:collection/:id
          const response = await fetch(`https://api.urbackend.bitbros.in/api/data/error_logs/${state.logId}`, {
              method: 'PUT',
              headers: {
                  'Content-Type': 'application/json',
                  'x-api-key': apiKey
              },
              body: JSON.stringify({
                  status: "SOLVED",
                  solution: note
              })
          });

          if (!response.ok) {
              throw new Error(`API Error: ${response.statusText}`);
          }

          console.log(chalk.green("✅ Error marked as SOLVED in cloud!"));
          
          // Optional: Clear state or just ID?
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
          // Optional: Clear state or keep it?
          // await fs.unlink(STATE_FILE); 
      }
  });

// Handle default command (backward compatibility/easier typing)
if (process.argv.length > 2 && !['run', 'next', '--help', '-h', '--version', '-V'].includes(process.argv[2])) {
    // If the first arg is not a known command, treat it as "run"
    const [node, script, ...args] = process.argv;
    // Reconstruction is tricky with commander, simpler to force user to use 'run' or just parse manually if needed.
    // For now, let's stick to explicit 'run' or adjust arguments.
    // Actually, let's make the catch-all work:
    
    // We can't easily perform the catch-all with standard subcommands setup unless we use a default command.
    // Let's refactor slightly to use a default command for "run".
}

program.parse(process.argv);
