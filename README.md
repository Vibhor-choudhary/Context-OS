<div align="center">
◈ Context OS
The missing layer between you and your AI tools.
Export · Compress · Transfer · Resume · Save — any AI, any session, zero friction.
[!License: MIT](https://opensource.org/licenses/MIT)
[!Built with React](https://react.dev)
[!Powered by Gemini](https://aistudio.google.com)
[!Free to Use](https://vercel.com)
Live Demo → &nbsp;·&nbsp; Report a Bug &nbsp;·&nbsp; Request a Feature
</div>
***The Problem This Solves
If you use AI tools daily — Claude, ChatGPT, Gemini, or any LLM — you've hit these walls:
| Pain | What actually happens |
|------|----------------------|
| Chat hits context limit | AI starts forgetting things. Responses get worse. You start over and lose everything. |
| Switching AI tools | Can't move your conversation history. New chat = new AI that knows nothing about you. |
| Restarting a project chat | Spend 10 minutes re-explaining your stack, your goal, what you've already built. |
| Prompt library is just a text file | Static. No variables. No structure. Basically useless. |
| Finished a vibe-coding session | Built something great — but there's nowhere to save the context for next time. |
Context OS solves all of these. It's a browser-based toolkit that makes AI context portable, manageable, and reusable.
***What It Does
Context OS is a 7-feature AI workflow toolkit organized into 3 tabs:
📚 Library Tab
A searchable, filterable prompt library with 6 built-in prompts for every context management scenario — plus the ability to save your own custom prompts with one click.
🔧 Tools Tab (AI-Powered via Gemini)
Five tools that do the heavy lifting:
| Tool | What it does |
|------|-------------|
| Context Compressor | Paste any conversation → get a compressed, structured context ready to paste into a new chat |
| State Extractor | Paste a project conversation → auto-extract PROJECT NAME, GOAL, TECH STACK, PROGRESS, NEXT TASK |
| Cross-AI Formatter | Reformat your context for a specific AI model (Claude, ChatGPT, Gemini, Llama, Mistral) |
| Prompt Variables | Build reusable templates with {{variable}} fields — fill them in, generate the final prompt |
| Size Estimator | Paste any text → see token count + live compatibility bars for every major AI model |
⋮ Workflows Tab
Three guided step-by-step workflows that walk you through complex multi-step tasks:
Full AI Transfer — move everything from one AI to another
Continue Long Chat — pick up a conversation that hit the context limit
Resume a Project — restart a stalled project conversation after a break
⊕ Save to Library
The standout feature. You can save any project context directly into your personal library:
AI mode — paste a raw conversation or vibe-coding session dump → Gemini auto-extracts title, description, category, and a clean reusable prompt
Manual mode — fill in the form yourself with no API needed
Saved cards are visually distinct, searchable, filterable, and deletable
***Built-In Prompts
| Prompt | Category | Purpose |
|--------|----------|---------|
| Full Memory & Context Export | Export | Exports all stored memories from any AI with full structure |
| Export Current Conversation | Export | Snapshots just the current chat with decisions and highlights |
| Resume Chat in New Session | Continue | Loads exported context into a new chat seamlessly |
| Continue Long Conversation | Continue | Handles context window overflow gracefully |
| Transfer Context to Different AI | Transfer | Moves your context across AI providers |
| Detect & Fix Context Drift | Utility | Snaps the AI back when it starts forgetting your style |
***Tech Stack
| Layer | Technology |
|-------|-----------|
| Framework | React 18 (Vite) |
| Styling | Inline CSS + CSS variables (zero dependencies) |
| AI Engine | Google Gemini 1.5 Flash API |
| Fonts | JetBrains Mono + Syne (Google Fonts) |
| Hosting | Vercel / GitHub Pages (free) |
| Storage | In-memory (session) — no backend, no database |
No backend. No database. No auth. No cost to host.
The only external call is to the Gemini API — from the user's browser, using their own API key. You pay nothing to run this for others.
***Getting Started
Prerequisites
Node.js v18 or higher
npm v9 or higher
A free Gemini API key (only needed for AI-powered tools)
Installation
1. Clone the repository
git clone https://github.com/YOUR_USERNAME/context-os.git
cd context-os
2. Install dependencies
npm install
3. Run locally
npm run dev
Open http://localhost:5173 in your browser.
4. Get a free Gemini API key (for AI tools)
Go to aistudio.google.com/app/apikey
Click Create API Key
Copy the key
Paste it into the Tools tab → API key field in the app
Free tier limits: 15 requests/minute · 1,000,000 tokens/day — more than enough for daily use.
***Project Structure
context-os/
├── src/
│   ├── App.jsx          # Entire application (single-file React component)
│   ├── App.css          # Empty (all styles are inline in App.jsx)
│   ├── index.css        # Empty (all styles are inline in App.jsx)
│   └── main.jsx         # React entry point (auto-generated by Vite, don't edit)
├── public/
│   └── vite.svg         # Default Vite favicon (replace with your own)
├── index.html           # HTML shell (auto-generated by Vite)
├── vite.config.js       # Vite config
├── package.json         # Dependencies and scripts
└── README.md            # This file
***Deployment
Option A: Vercel (Recommended — zero config)
Push your code to GitHub
Go to vercel.com and sign in with GitHub
Click Add New Project → select your context-os repo
Leave all settings as default → click Deploy
Done — live at context-os.vercel.app in ~60 seconds
Every git push to main auto-redeploys. No configuration needed.
Option B: GitHub Pages
1. Update vite.config.js:
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  base: '/context-os/',
})
2. Install gh-pages:
npm install --save-dev gh-pages
3. Add to package.json scripts:
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "deploy": "gh-pages -d dist"
  }
}
4. Build and deploy:
npm run build
npm run deploy
5. Go to your GitHub repo → Settings → Pages → set source to gh-pages branch.
Your site will be live at https://YOUR_USERNAME.github.io/context-os/
***How to Use
Using the Prompt Library
Open the Library tab
Browse or search prompts by keyword or filter by category
Click preview prompt to expand and read it
Click ⎘ copy prompt to copy it to clipboard
Paste it into any AI chat
Using the AI Tools
Open the Tools tab
Enter your Gemini API key in the banner (one time per session)
Select a tool from the left sub-nav
Paste your conversation or text into the input panel
Click the run button — output streams in real time
Copy the output or click ⊕ save to save it to your library
Saving a Project to Your Library
Method 1 — AI Extract (fastest):
Click ⊕ Save to Library (top bar or Library tab)
Make sure your Gemini API key is connected
Select ⚡ AI Extract mode
Paste your project conversation, code dump, or vibe-coding session
Click Extract & Fill Card — Gemini fills the entire form
Review the extracted card → click Save to Library
Method 2 — Manual:
Click ⊕ Save to Library
Select ✏ Manual mode
Fill in the title, description, when-to-use, and prompt
Click Save to Library
Your saved cards appear in the Library with a green SAVED badge. Use the My Saved filter to see only your custom prompts.
Running a Workflow
Open the Workflows tab
Select a workflow card (Full AI Transfer / Continue Long Chat / Resume a Project)
Follow the step-by-step instructions — click step numbers to jump between steps
Copy the prompt at each step and execute it in your AI
Use next → to advance, ← back to go back, ↺ restart to run it again
***Supported AI Models
Context OS works with any AI. The Cross-AI Formatter is specifically optimized for:
| Model | Formatting Style |
|-------|-----------------|
| Claude (Anthropic) | XML tags, explicit rules, structured sections |
| ChatGPT / GPT-4o (OpenAI) | Markdown headers, direct instructions |
| Gemini (Google) | Concise, factual, brief bullet points |
| Llama 3 (Meta) | Plain text, minimal formatting, essential only |
| Mistral (Mistral AI) | Standard markdown, balanced density |
The Size Estimator checks token compatibility for all of these plus GPT-3.5 and Gemini 1.0 Pro.
***Privacy
Your API key never leaves your browser. It's stored in React state (memory only) — not in localStorage, not sent to any server, not logged anywhere.
No analytics, no tracking, no backend. The app is 100% static HTML/JS.
Your conversations are not stored. Everything you paste into the tools exists only in your browser tab. Closing the tab erases it.
The only network request is directly from your browser to the Google Gemini API using your own key.
***Contributing
Contributions are welcome. Here's how:
Fork the repository
Create a feature branch: git checkout -b feature/your-feature-name
Make your changes in src/App.jsx
Commit: git commit -m "feat: describe your change"
Push: git push origin feature/your-feature-name
Open a Pull Request
Ideas for contributions
Dark/light theme toggle
Export library to JSON (for backup)
Import library from JSON
More built-in prompt categories (coding, writing, research)
Groq API support as alternative to Gemini
Keyboard shortcuts
Drag-to-reorder saved prompts
***FAQ
Do I need a paid API key?
No. The Gemini 1.5 Flash API has a free tier that's more than sufficient for personal daily use (15 req/min, 1M tokens/day). Get a key at aistudio.google.com — no billing info required.
Does this work without an API key?
Yes — the entire Prompt Library, Workflows tab, Prompt Variables tool, and Size Estimator work with no API key. Only the Compressor, State Extractor, and Cross-AI Formatter require Gemini.
Are my saved prompts permanent?
Currently, saved prompts exist only for the duration of your browser session. Refreshing the page resets them. This is intentional — no backend means no data stored anywhere. A future version may add JSON export/import for persistence.
Can I use this for a team?
Yes — you can deploy a shared instance for your team on Vercel for free. Each user manages their own API key locally.
Why Gemini and not OpenAI/Claude?
Gemini 1.5 Flash has the most generous free tier of any major AI API. The tool is designed for the Gemini API but the compression/extraction logic works the same regardless — you could swap in any API by changing the callGemini function.
***License
MIT License — free to use, modify, and distribute. See LICENSE for details.
***Acknowledgements
Google AI Studio for the free Gemini API
Vite for the build tooling
JetBrains Mono and Syne for the typography
Everyone who's ever lost a conversation to a context window limit — this one's for you
***<div align="center">
Built to solve a real problem. Designed to feel good to use.
⊕ Save your first project →
</div>