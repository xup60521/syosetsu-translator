# Syosetsu Translator

A sophisticated web novel translator that helps you translate and archive Japanese web novels from platforms like Syosetsu and Kakuyomu directly to your Google Drive using advanced AI models.

## 📂 Project Structure

- `apps/web`: The main web application for user-friendly novel browsing and translation.
- `apps/cli`: A command-line interface for the translator.
- `apps/keep-alive`: A Cloudflare Worker to maintain session persistence.
- `apps/workflow-novel-handler`: Background processes for handling long-running translations.
- `packages/shared`: Shared libraries, models, and platform-specific novel handlers.

## 📖 User Guide

For a complete walkthrough of how to use the web application, please refer to the **[Web App User Guide](./apps/web/USER_GUIDE.md)**.

## 🛠️ Development

This project is managed as a monorepo using **Turbo** and **Bun**.

To install dependencies:
```bash
bun install
```

To run the web app locally:
```bash
turbo run dev --filter=web
```

---
*Powered by OpenAI, Anthropic, and Google AI Studio models.*
