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
    <img src="https://img.shields.io/badge/npm-v0.1.2-red.svg" alt="Version" />
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
| **🤖 AI Analysis** | Instantly detects **Error Type**, **Confidence**, coverage, and likely causes using **Groq (Llama 3)**. |
| **📄 Code Context** | **NEW!** Reads your actual code to understand the bug's origin (file & line context). |
| **🌍 Localization** | Translates technical error hints into your native language (Hindi, Spanish, French, etc.) via **Lingo.dev**. |
| **☁️ Cloud Sync** | Back up your error logs to **Urbackend** for long-term history and analytics. |
| **🧠 Smart Hints** | Get progressive hints (`errlocal next`) instead of spoiling the solution immediately. |
| **🛡️ Universal Wrapper** | Works with any command: `node`, `python`, `npm`, `go`, `rust`, etc. |

---

## 🚀 Quick Start

### 1. Install
From your terminal, install `errlocal` globally:

```bash
npm install -g errlocal
```

### 2. Configure
Create a `.env` file (in your project or at `~/.errlocal/.env`) with your keys:

```bash
GROQ_API_KEY=gsk_...
LINGO_API_KEY=ln_...
URBACKEND_API_KEY=...    # Optional: For cloud sync
```

### 3. Run
Wrap any command that's giving you trouble:

```bash
errlocal run node app.js --lang=hi
```

*(Watch it catch the error and explain it in Hindi!)*

---

## 📚 Documentation

### Command Reference

| Command | Usage | Description |
| :--- | :--- | :--- |
| **Run** | `errlocal run <cmd> [flags]` | Executes a command. If it fails, AI analyzes the stderr. |
| **Next Hint** | `errlocal next` | Shows the next hint (1 → 2 → 3 → Solution). |
| **Sync** | `errlocal sync` | Uploads the last error log to Urbackend. |
| **History** | `errlocal history` | Fetches the last 5 errors from the cloud. |
| **Solved** | `errlocal solved "<note>"` | Marks the last synced error as "SOLVED". |

### Flags
- `--lang=<code >`: Target language ISO code (e.g., `hi`, `es`, `fr`, `de`).

---

## ☁️ Cloud Sync (Urbackend)

To enable **Sync**, **History**, and **Solved** features, configure your Urbackend project.

1.  **Create Project**: Log in to [Urbackend Dashboard](https://urbackend.bitbros.in/).
2.  **Get Key**: Copy your **Public API Key** to `.env`.
3.  **Create Table**: Create a collection named **`error_logs`** with this exact schema:

> **⚠️ Important**: All columns must be type **String**.

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
