<p align="center">
  <h1 align="center">errlocal 🚀</h1>
  <p align="center">
    <strong>Fix runtime errors in seconds with AI & Localization.</strong>
    <br />
    The CLI tool that speaks your language.
  </p>
</p>

<p align="center">
  <a href="https://github.com/yash-pouranik/errlocal/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License" />
  </a>
  <a href="https://www.npmjs.com/">
    <img src="https://img.shields.io/badge/npm-v0.3.0-red.svg" alt="Version" />
  </a>
  <a href="https://groq.com">
    <img src="https://img.shields.io/badge/Powered%20by-Groq-orange" alt="Groq" />
  </a>
    <a href="https://lingo.dev">
    <img src="https://img.shields.io/badge/Powered%20by-Lingo.dev-purple" alt="Lingo.dev" />
  </a>
</p>

<div align="center">

[Features](#features) • [Quick Start](#quick-start) • [Documentation](#documentation) • [Cloud Sync](#cloud-sync-urbackend)

</div>

---

## ⚡ Features

| Feature | Description |
| :--- | :--- |
| **🎮 Interactive UI** | **NEW!** A beautiful terminal menu to Explain, Fix, Translate, or Sync errors without typing more commands. |
| **🔧 Auto-Fix** | **NEW!** Instantly applies AI-suggested code fixes to your files with a single click. |
| **🤖 AI Analysis** | Instantly detects **Error Type**, **Confidence**, coverage, and likely causes using **Groq (Llama 3)**. |
| **📄 Code Context** | **NEW!** Reads your actual code to understand the bug's origin (file & line context). |
| **🌍 Localization** | Translates technical error hints into your native language (Hindi, Spanish, French, etc.) via **Lingo.dev**. |
| **☁️ Cloud Sync** | Back up your error logs to **Urbackend** for long-term history and analytics. |
| **🧠 Progressive Hints** | Reveals hints one by one to help you learn, instead of spoiling the solution immediately. |

---

## 🏗️ Architecture & Flow

<p align="center">
  <img src="./errlocal_activity_diagram.svg" alt="errlocal Activity Diagram" width="100%">
</p>

---

## 🚀 Quick Start

### 1. Install
From your terminal, install `errlocal` globally:

```bash
npm install -g errlocal
```

### 2. Initialize the Configuration
No need to manually mess with files! Just run the interactive setup:

```bash
errlocal init
```
*This prompts you for your `GROQ_API_KEY`, `LINGO_API_KEY` (optional), and `URBACKEND_API_KEY` (optional).*

### 3. Run
Wrap any command that's giving you trouble:

```bash
errlocal run node app.js
```

**💥 Boom!** If an error occurs, `errlocal` pauses and shows an interactive menu:

```text
? What would you like to do? (Use arrow keys)
❯ 💡 Explain Error
  🔧 Auto-Fix
  🌍 Translate
  ☁️ Sync to Cloud
  🚪 Exit
```

---

## 📚 Documentation

### Interactive Menu
- **Explain Error**: Shows detailed AI analysis with progressive hints (Hint 1 -> Hint 2 -> Solution).
- **Auto-Fix**: If the AI is confident, it suggests a code change. Press `Enter` to apply it to your file instantly!
- **Translate**: Switch the explanation language on the fly.
- **Sync**: Upload the error log to your UrBackend dashboard.

### CLI Commands (Legacy & Automation)

| Command | Usage | Description |
| :--- | :--- | :--- |
| **Run** | `errlocal run <cmd>` | Executes a command and enters Interactive Mode on error. |
| **History** | `errlocal history` | Fetches the last 5 errors from the cloud. |
| **Solved** | `errlocal solved <note>` | Marks the last synced error as "SOLVED". |

### Flags
- `--lang=<code >`: Target language ISO code (e.g., `hi`, `es`, `fr`, `de`) `Available in v0.1 and v0.2, but menu based in v0.3`.

---

## ☁️ Cloud Sync (Urbackend)

To enable **Sync**, **History**, and **Solved** features, configure your Urbackend project.

1.  **Create Project**: Log in to [Urbackend Dashboard](https://urbackend.bitbros.in/).
2.  **Get Key**: Copy your **Public API Key** and paste it during `errlocal init`.
3.  **Zero-Config Schema**: That's it! The first time you sync an error log, `errlocal` automatically provisions the `error_logs` table and schema inside your UrBackend project. You no longer need to configure the schema manually!

| Column | Type | Description |
| :--- | :--- | :--- |
| `command` | String | Executed command |
| `error` | String | Raw stderr output |
| `hints` | String | JSON array of hints |
| `finalExplanation` | String | Full solution JSON |
| `timestamp` | String | ISO Date string |
| `status` | String | "OPEN" or "SOLVED" |
| `solution` | String | User's fix note |

---

## 🤝 Contributing

We welcome contributions! Please fork the repo and submit a PR.
This project is licensed under the **MIT License**.

<p align="center">
  Made with ❤️ by Yash Pouranik during Lingo.dev hackathon
</p>
