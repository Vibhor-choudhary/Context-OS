<div align="center">

# ⚡ Context OS

### The missing layer between **you and your AI tools**

**Export · Compress · Transfer · Resume · Save**
Portable AI context for any model, any chat, any workflow.

<br>

[![License: MIT](https://img.shields.io/badge/License-MIT-22d3ee.svg)](https://opensource.org/licenses/MIT)
[![Built with React](https://img.shields.io/badge/Built%20with-React-61dafb.svg)](https://react.dev)
[![AI Powered](https://img.shields.io/badge/AI-Gemini%201.5%20Flash-4ade80.svg)](https://aistudio.google.com)
[![Hosting](https://img.shields.io/badge/Hosting-Free-f97316.svg)](https://vercel.com)

**[Live Demo](https://context-os-jade.vercel.app/)** •
**[Report Bug](https://github.com/Vibhor-choudhary/context-os/issues)** •
**[Request Feature](https://github.com/Vibhor-choudhary/context-os/issues)**

</div>

---

# 🚀 What is Context OS?

When working with AI tools like **ChatGPT, Claude, or Gemini**, your workflow constantly hits limits:

* Conversations get **too long**
* AI **forgets context**
* You **switch models and lose history**
* Projects become **hard to resume**
* Prompt libraries are **just static text files**

**Context OS solves this.**

It is a **browser-based toolkit that makes AI context portable, reusable, and structured.**

Think of it as a **utility layer for AI workflows.**

Instead of losing conversations or rebuilding prompts, you can:

✔ Export context
✔ Compress long chats
✔ Transfer context between AIs
✔ Resume projects instantly
✔ Build a reusable prompt library

<img width="1457" height="731" alt="Screenshot 2026-03-09 at 1 55 35 AM" src="https://github.com/user-attachments/assets/d2d13779-e169-4601-86b0-e6f3b1de7631" />

---

# 🧠 The Problems AI Users Hit

| Problem              | What Happens                        |
| -------------------- | ----------------------------------- |
| Context limits       | AI forgets earlier messages         |
| Switching AI tools   | Conversation history disappears     |
| Restarting projects  | You must explain everything again   |
| Prompt libraries     | Static text files with no structure |
| Long coding sessions | No way to save the full workflow    |

**Context OS removes these frictions.**

<img width="2721" height="1478" alt="NotebookLM Image" src="https://github.com/user-attachments/assets/c5ea6926-3a72-4a89-980e-fb7a3de3d48b" />

---

# 🧰 Core Features

The app is organized into **three main sections**.

<img width="2733" height="1498" alt="NotebookLM Image (1)" src="https://github.com/user-attachments/assets/c3e6cd3c-a4fe-4c11-bfc2-2278c71301c2" />


---

# 📚 Prompt Library

A searchable prompt library built for real workflows.

Features:

* 🔎 Search and filter prompts
* 📂 Category-based organization
* 🧾 Expandable prompt preview
* 📋 One-click copy
* 💾 Save your own custom prompts

Built-in prompts cover **exporting, transferring, resuming, and repairing context**.

---

# 🔧 AI Tools

Powered by **Gemini 1.5 Flash API**.

These tools automate context management.

| Tool               | Purpose                                                 |
| ------------------ | ------------------------------------------------------- |
| Context Compressor | Convert long chats into compressed structured context   |
| State Extractor    | Extract project name, goal, stack, progress, next tasks |
| Cross-AI Formatter | Reformat prompts for specific AI models                 |
| Prompt Variables   | Create reusable templates with dynamic variables        |
| Size Estimator     | Token counter with compatibility across models          |

---

# 🔄 Guided Workflows

Context OS also provides **step-by-step workflows** for common AI tasks.

### 1️⃣ Full AI Transfer

Move a project conversation from one AI platform to another.

### 2️⃣ Continue Long Chat

Resume a conversation that exceeded context limits.

### 3️⃣ Resume a Project

Restart development after days or weeks away.

Each workflow guides the user through **structured prompts and steps**.

---

# 💾 Save Context to Your Library

One of the most powerful features.

You can turn a **raw AI conversation into a reusable prompt card**.

### AI Extraction Mode

Paste a conversation dump and Gemini automatically extracts:

* Project title
* Description
* Category
* Clean prompt template

### Manual Mode

Create prompt cards manually without using the API.

Saved prompts become **searchable cards inside your library**.

---

# 📦 Built-In Prompts

| Prompt                           | Purpose                               |
| -------------------------------- | ------------------------------------- |
| Full Memory Export               | Export stored AI memories             |
| Export Current Conversation      | Snapshot the current chat             |
| Resume Chat in New Session       | Continue a conversation in a new chat |
| Continue Long Conversation       | Handle context limit overflow         |
| Transfer Context to Different AI | Move context between models           |
| Detect Context Drift             | Fix AI forgetting instructions        |

---

# 🧱 Tech Stack

| Layer     | Technology                 |
| --------- | -------------------------- |
| Frontend  | React 18 + Vite            |
| Styling   | Inline CSS + CSS Variables |
| AI Engine | Gemini 1.5 Flash API       |
| Fonts     | JetBrains Mono + Syne      |
| Hosting   | Vercel / GitHub Pages      |
| Storage   | In-memory (no backend)     |

**No backend.
No database.
No authentication required.**

Everything runs **directly in the browser**.

---

# ⚡ Getting Started

## Prerequisites

* Node.js **18+**
* npm **9+**
* Optional: **Gemini API Key**

Get one here:

https://aistudio.google.com/app/apikey

---

## Installation

Clone the repository.

```bash
git clone https://github.com/YOUR_USERNAME/context-os.git
cd context-os
```

Install dependencies.

```bash
npm install
```

Start development server.

```bash
npm run dev
```

Open:

```
http://localhost:5173
```

---

# 🤖 Supported AI Models

The formatter optimizes prompts for:

| Model           | Style                       |
| --------------- | --------------------------- |
| Claude          | XML structured prompts      |
| ChatGPT / GPT-4 | Markdown structured prompts |
| Gemini          | Concise bullet prompts      |
| Llama 3         | Minimal formatting          |
| Mistral         | Balanced markdown structure |

The **Size Estimator** checks token compatibility across models.

---

# 🔐 Privacy

Context OS is built with **privacy-first architecture**.

* No analytics
* No tracking
* No backend storage
* API keys remain in browser memory
* Conversations never leave the user's session

Closing the tab **erases all data**.

---

# 🤝 Contributing

Contributions are welcome.

Steps:

1. Fork repository
2. Create feature branch

```
git checkout -b feature/your-feature
```

3. Commit changes

```
git commit -m "feat: description"
```

4. Push branch

```
git push origin feature/your-feature
```

5. Open Pull Request

---

# 💡 Contribution Ideas

* Dark / light theme
* JSON export for saved prompts
* Prompt import system
* More prompt categories
* Groq API support
* Keyboard shortcuts
* Drag-and-drop prompt sorting

---

# 📜 License

MIT License.

Free to use, modify, and distribute.

---

<div align="center">

### Built to solve a real AI workflow problem.

If you've ever lost a conversation to a **context limit**,
this tool was built for you.

</div>
