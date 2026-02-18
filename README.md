# errlocal

An interactive CLI tool that wraps commands, analyzes errors with AI, and provides localized hints using Lingo.dev.

## Features

- **Command Wrapping**: Runs any command (e.g., `node test.js`, `npm start`) and captures its exit code and stderr.
- **Error Detection**: Detects non-zero exit codes or stderr output.
- **AI Analysis**: Uses Groq (`llama3-70b`) to analyze errors and provide progressive hints.
- **Smart Insights**: Instantly detects **Error Type** and **Confidence Level**.
- **Localization**: Localizes hints into your preferred language using Lingo.dev.
- **Cloud Sync**: Syncs error logs to Urbackend for backup and history.

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

### 1. Setup
Create a `.env` file in your current directory (or globally at `~/.errlocal/.env`) with your API keys:
```env
GROQ_API_KEY=your_groq_key
LINGO_API_KEY=your_lingo_key
URBACKEND_API_KEY=your_urbackend_key
```

### 2. Command Reference

| Command | Description | Example |
| :--- | :--- | :--- |
| **`errlocal run <cmd> --lang=<code>`** | Runs a command, captures errors, analyzes & localizes hints. | `errlocal run node app.js --lang=hi`|
| **`errlocal next`** | Shows the next progressive hint for the last error. | `errlocal next` |
| **`errlocal sync`** | Syncs the last error log to Urbackend cloud. | `errlocal sync` |
| **`errlocal history`** | Fetches the last 5 error logs from Urbackend. | `errlocal history` |
| **`errlocal solved "<note>"`** | Marks the last synced error as SOLVED in the cloud. | `errlocal solved "Fixed type error"` |

### 3. Workflow Example

1.  **Run & Fail**:
    ```bash
    errlocal run node app.js --lang=es
    ```
    *Output*: Shows "Analysis" (Type/Confidence) and "Hint 1" in Spanish.

2.  **Get More Help**:
    ```bash
    errlocal next
    ```
    *Output*: Shows "Hint 2".

3.  **Sync to Cloud**:
    ```bash
    errlocal sync
    ```
    *Output*: `✅ Synced successfully! Log ID: ...`

4.  **Fix & Mark Solved**:
    (You fix the bug in your code)
    ```bash
    errlocal solved "Added missing import"
    ```
    *Output*: `✅ Error marked as SOLVED in cloud!`

## Urbackend Configuration (For Cloud Sync)

To enable `sync`, `history`, and `solved` commands, you must configure your Urbackend project.

1.  **Create a Project**: Go to [Urbackend Dashboard](https://urbackend.bitbros.in/) and create a project.
2.  **Get API Key**: Copy the API Key and add it to your `.env` as `URBACKEND_API_KEY`.
3.  **Create Table**: Create a collection named **`error_logs`** with the following schema:

| Column Name        | Type   | Purpose                                      |
| ------------------ | ------ | -------------------------------------------- |
| `command`          | String | The command that was executed                |
| `error`            | String | The raw error output                         |
| `hints`            | String | JSON string of progressive hints             |
| `finalExplanation` | String | JSON string of the full explanation          |
| `timestamp`        | String | ISO timestamp of when the error occurred     |
| `status`           | String | Status of the error (e.g., "SOLVED", "OPEN") |
| `solution`         | String | User's note on how it was fixed              |

> **Note**: All fields must be of type **String** because Urbackend requires flattened payloads for this integration.

## License

MIT
