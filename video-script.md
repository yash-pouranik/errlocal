# The errlocal Demo Script (v0.3.0)

## Video Specs
- Length: 2 to 3 minutes
- Format: Screencast / Screen Recording
- Ratio: 16:9 
- Text: Large Terminal Font Size

---

## Scene 1: The Problem (0:00 - 0:15)
- **Visual**: Open terminal. Run a failing command normally, like `node missing-file.js`. A long stderr output prints. Switch to a browser to show ChatGPT or StackOverflow.
- **Audio/Caption**: *"Debugging is the most frustrating part of coding. Every time we hit an error, we break our flow, switch context to the browser, and blindly paste errors without learning anything."*

## Scene 2: The Solution & Setup (0:15 - 0:35)
- **Visual**: Switch back to Terminal. Run `errlocal init`. The Interactive prompt asks for Keys. Enter Groq, and skip Lingo and UrBackend using Enter. Shows "Setup Complete".
- **Audio/Caption**: *"Enter errlocal. A blazingly fast, context-aware AI debugging companion built right into your CLI. Getting started takes 10 seconds with our zero-config interactive setup."*

## Scene 3: The Magic (Context-Aware) (0:35 - 1:05)
- **Visual**: Run that same failing command wrapped in errlocal: `errlocal run node missing-file.js`. The tool catches the error, says "Analyzing...", and pauses execution to open the Interactive Menu.
- **Audio/Caption**: *"Let's run that same failing command through errlocal. Instead of a messy error log, errlocal intercepts the crash, reads the actual local code file where it happened, and pauses execution to give you control."*

## Scene 4: Progressive Learning (1:05 - 1:30)
- **Visual**: Select **"Explain Error"** from the menu. Watch Hint 1 print. Select "Next Hint" to show Hint 2.
- **Audio/Caption**: *"If you select 'Explain', we don’t just give you the answer. errlocal uses Groq's Llama 3 to generate progressive, bite-sized hints. This guides developers to solve the problem themselves, actually helping them learn rather than just copy-pasting."*

## Scene 5: The WOW Factor 1 (Auto-Fix) (1:30 - 2:00)
- **Visual**: (Prep a syntax error like `conole.log` in a file). Throw the error again. From the menu, select **"Auto-Fix"**. Watch the tool print the AI's code diff. Accept the fix. Rerun the command, showing it now succeeds without an error!
- **Audio/Caption**: *"But what if it's a simple typo? Just select Auto-Fix. errlocal acts as an autonomous agent, rewriting the broken code in your local file instantly, preserving indentation. You literally fix bugs with a single keystroke."*

## Scene 6: The WOW Factor 2 (Localization) (2:00 - 2:20)
- **Visual**: Generate another error. Select **"Translate"** from the menu. Choose Hindi (or any lang). Select **"Explain Error"** again and watch the progressive hints print perfectly in Hindi natively inside the terminal!
- **Audio/Caption**: *"For non-native English speakers, technical jargon is hard. Powered by Lingo.dev, errlocal intelligently translates the entire debugging experience into multiple native languages on the fly."*

## Scene 7: Zero-Config Cloud Sync (2:20 - 2:50)
- **Visual**: Select **"Sync to Cloud"** from the menu. Shows "Synced!". Jump to the browser to UrBackend's dashboard. Refresh to show the `error_logs` table has been magically created with the logged error.
- **Audio/Caption**: *"Finally, we wanted team collaboration to be effortless. Hit 'Sync to Cloud' and your entire error context is saved to UrBackend. No need to even create database schemas manually—errlocal auto-generates the collections natively inside the cloud!."*

## Scene 8: Outro (2:50 - 3:00)
- **Visual**: Pan over your GitHub repository and the new Architecture SVG diagram. Add a massive text overlay: `npm i -g errlocal`.
- **Audio/Caption**: *"errlocal isn't just an AI command-line tool. It's a localized, context-aware debugging experience. Thank you!"*
