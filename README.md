# errlocal

An interactive CLI tool that wraps commands, analyzes errors with AI, and provides localized hints using Lingo.dev.

## Features

- **Command Wrapping**: Runs any command (e.g., `node test.js`, `npm start`) and captures its exit code and stderr.
- **Error Detection**: Detects non-zero exit codes or stderr output.
- **AI Analysis**: Uses Google Gemini to analyze errors and provide progressive hints.
- **Localization**: Localizes hints into your preferred language using Lingo.dev.

## Installation

### Method 1: Install directly from GitHub (Recommended)

You can install `errlocal` globally directly from the GitHub repository:

```bash
npm install -g github:yash-pouranik/errlocal
```

### Method 2: Clone and Link

1.  Clone the repository:
    ```bash
    git clone https://github.com/yash-pouranik/errlocal.git
    cd errlocal
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Link globally:
    ```bash
    npm link
    ```

## Usage

1.  **Setup**:
    Create a `.env` file in your current directory with your API keys:
    ```env
    GEMINI_API_KEY=your_gemini_key
    LINGO_API_KEY=your_lingo_key
    ```

2.  **Run a command**:
    Wrap your command with `errlocal run`:
    ```bash
    errlocal run <command> [args...] --lang=<locale>
    ```

    Example:
    ```bash
    errlocal run node app.js --lang=hi
    ```
    (This will run `node app.js`, capture any errors, and show hints in Hindi)

3.  **Get more hints**:
    If the first hint isn't enough, run:
    ```bash
    errlocal next
    ```
    This shows the next progressive hint.

## License

ISC
