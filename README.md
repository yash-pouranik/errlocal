# errlocal

An interactive CLI tool that wraps commands, analyzes errors with AI, and provides localized hints using Lingo.dev.

## Features

- **Command Wrapping**: Runs any command (e.g., `node test.js`, `npm start`) and captures its exit code and stderr.
- **Error Detection**: Detects non-zero exit codes or stderr output.
- **AI Analysis**: Uses Groq (`llama3-70b`) to analyze errors and provide progressive hints.
- **Localization**: Localizes hints into your preferred language using Lingo.dev.

## Prerequisites

Before installation, ensure you have:
1.  **Node.js** (v18 or higher)
2.  **Groq API Key**: [Get it here](https://console.groq.com/keys) (Fast & Free tier available)
3.  **Lingo.dev API Key**: [Get it here](https://lingo.dev/) (For localization)
4.  **Urbackend API Key**: [Get it here](https://urbackend.bitbros.in/) (Optional: For syncing logs)

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

## Configuration

You can configure `errlocal` in two ways:

1.  **Project-specific** (Recommended for sharing):
    Create a `.env` file in your project root.

2.  **Global** (Recommended for personal use):
    Create a `.env` file in your home directory: `~/.errlocal/.env` (Linux/Mac) or `%USERPROFILE%\.errlocal\.env` (Windows).
    This way, you don't need to create a `.env` file for every project.

## Usage

1.  **Setup**:
    Create a `.env` file in your current directory with your API keys:
    ```env
    GROQ_API_KEY=your_groq_key
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

4.  **Sync to Cloud**:
    To save the error log to your Urbackend dashboard:
    ```bash
    errlocal sync
    ```
    (Requires `URBACKEND_API_KEY` in `.env`)

    **Important**: Create a collection named `error_logs` in Urbackend with these columns:
    - `command` (String)
    - `error` (String)
    - `hints` (String)
    - `finalExplanation` (String)
    - `timestamp` (String)

## License

ISC
