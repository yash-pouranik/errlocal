#!/usr/bin/env node

import { program } from 'commander';
import { execa } from 'execa';
import chalk from 'chalk';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
// import { Lingo } from '@lingo.dev/sdk'; // TODO: Fix package name
import { LingoDotDevEngine  } from 'lingo.dev/sdk';
const Lingo = LingoDotDevEngine;
dotenv.config();

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
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error("GEMINI_API_KEY not found in environment variables.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    
    // Clean up markdown code blocks if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
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
