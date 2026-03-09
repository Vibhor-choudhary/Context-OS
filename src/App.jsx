import { useState, useEffect, useRef, useCallback } from "react";

// ─── CONSTANTS ─────────────────────────────────────────────────────────────────
const TOKEN_LIMITS = {
  "Claude 3.5":      { limit: 200000,   color: "#f97316" },
  "GPT-4o":          { limit: 128000,   color: "#22d3ee" },
  "GPT-4 Turbo":     { limit: 128000,   color: "#22d3ee" },
  "GPT-3.5":         { limit: 16000,    color: "#64748b" },
  "Gemini 1.5 Pro":  { limit: 1000000,  color: "#4ade80" },
  "Gemini 1.5 Flash":{ limit: 1000000,  color: "#4ade80" },
  "Gemini 1.0 Pro":  { limit: 32000,    color: "#86efac" },
  "Llama 3 70B":     { limit: 8000,     color: "#facc15" },
  "Mistral Large":   { limit: 32000,    color: "#c084fc" },
};

const CATEGORY_ACCENTS = {
  Export:   "#22d3ee",
  Continue: "#f97316",
  Transfer: "#a78bfa",
  Utility:  "#facc15",
  Project:  "#4ade80",
  Custom:   "#f472b6",
};

const BUILT_IN_PROMPTS = [
  {
    id: 1, category: "Export", tag: "EXPORT", accent: "#22d3ee", builtin: true,
    title: "Full Memory & Context Export",
    description: "Exports all stored memories and learned context into a structured, copyable format.",
    useCase: "Run before ending a long session or switching AI tools.",
    prompt: `Export all of my stored memories and any context you've learned about me from past conversations. Preserve my words verbatim where possible, especially for instructions and preferences.\n\n## Categories (output in this order):\n1. **Instructions**: Rules I've explicitly asked you to follow — tone, format, style, "always do X", "never do Y".\n2. **Identity**: Name, age, location, education, family, relationships, languages, personal interests.\n3. **Career**: Current and past roles, companies, and general skill areas.\n4. **Projects**: Projects I meaningfully built or committed to. Include what it does, current status, key decisions.\n5. **Preferences**: Opinions, tastes, and working-style preferences that apply broadly.\n\n## Format:\nUse section headers. List one entry per line, oldest first:\n[YYYY-MM-DD] - Entry content here.\nUse [unknown] if no date is known.\n\n## Output:\nWrap the entire export in a single code block for easy copying.\nAfter the code block, state whether this is complete or if more remain.`
  },
  {
    id: 2, category: "Continue", tag: "CONTINUE", accent: "#f97316", builtin: true,
    title: "Resume Chat in New Session",
    description: "Paste exported context into a new chat so the AI picks up exactly where you left off.",
    useCase: "Paste at the START of a new chat, followed by your exported context.",
    prompt: `I'm continuing a conversation from another session (or a different AI). Below is my exported context — please absorb it fully before responding.\n\nAfter reading:\n1. Confirm you've ingested it by summarizing the 3 most important things you now know about me.\n2. Ask me what we should pick up from or what I need next.\n3. Apply all listed instructions immediately and going forward.\n\nTreat the [Instructions] section as active rules. Do NOT re-ask for information already in the context.\n\n--- PASTE YOUR EXPORTED CONTEXT BELOW THIS LINE ---`
  },
  {
    id: 3, category: "Export", tag: "EXPORT", accent: "#22d3ee", builtin: true,
    title: "Export Current Conversation Only",
    description: "Summarizes just the current chat — key decisions, conclusions, next steps.",
    useCase: "Use mid-session to capture what happened in this specific conversation.",
    prompt: `Summarize this entire conversation as a portable context snapshot:\n\n## Conversation Summary\n**Goal**: Main task or question we worked on.\n**Key Decisions Made**: Bullet list of decisions or conclusions.\n**Work Produced**: Any code, documents, plans created.\n**Open Threads**: Unresolved questions or next steps.\n**My Preferences Revealed**: Preferences or constraints I expressed.\n\n## Raw Transcript Highlights\nList the 5–10 most important exchanges verbatim or near-verbatim.\n\nWrap the entire output in a single code block for easy copying.`
  },
  {
    id: 4, category: "Continue", tag: "CONTINUE", accent: "#f97316", builtin: true,
    title: "Continue Long Conversation",
    description: "Handles context window limits — reconstructs the full picture before continuing.",
    useCase: "When a chat gets too long and responses start degrading.",
    prompt: `My previous conversation exceeded the context limit. Here's a full export. Please reconstruct our working context and continue seamlessly.\n\nInstructions:\n- Read the entire export before responding.\n- Do NOT start over or re-explain things already established.\n- Continue with the same tone, style, and approach.\n- If we were mid-task, pick it back up directly.\n- If anything is ambiguous, make a reasonable assumption and flag it.\n\nAfter loading: "Context loaded. [One sentence on where we left off.] Ready to continue — what's next?"\n\n--- PASTE EXPORTED CONTEXT BELOW ---`
  },
  {
    id: 5, category: "Transfer", tag: "TRANSFER", accent: "#a78bfa", builtin: true,
    title: "Transfer Context to a Different AI",
    description: "Moves your context from one AI provider to another with proper formatting.",
    useCase: "Switching AI tools entirely. Export from old AI, paste this into the new one.",
    prompt: `I'm switching from another AI assistant to you. The export below contains everything the previous AI knew about me.\n\nWhat to do:\n1. Parse the context carefully — it may use a different format.\n2. Map it: treat "Instructions" as rules, "Identity/Career/Projects" as factual knowledge, "Preferences" as style guidance.\n3. If anything is unclear, note it — don't fabricate.\n4. Confirm: "Imported. Here's what I now know about you: [brief summary]."\n5. Then ask: "What would you like to work on?"\n\nUse it as live context for this session.\n\n--- PASTE EXPORTED CONTEXT BELOW ---`
  },
  {
    id: 6, category: "Utility", tag: "UTILITY", accent: "#facc15", builtin: true,
    title: "Detect & Fix Context Drift",
    description: "Snaps the AI back when it starts forgetting your established preferences.",
    useCase: "When the AI gives generic responses or ignores your style.",
    prompt: `You seem to have lost context about me. Please re-read everything from the start of our conversation and reorient.\n\nCheck for:\n- Any instructions I gave about tone, format, or style\n- Facts I shared about myself, my work, or my goals\n- Decisions or conclusions we already reached\n- The specific task we're working on\n\nAfter reviewing: "Re-oriented. [1–2 sentences on what you've re-loaded.] Continuing from where we were..."`
  },
];

const WORKFLOWS = [
  {
    id: "transfer", title: "Full AI Transfer", icon: "⇄", accent: "#a78bfa",
    description: "Move everything from one AI to another — cleanly.",
    steps: [
      { label: "Export from current AI", instruction: "Run this in your CURRENT AI to export all context about you.", prompt: BUILT_IN_PROMPTS[0].prompt },
      { label: "Compress the export", instruction: "Tools tab → Context Compressor. Paste export and compress.", prompt: "→ Use the Context Compressor tool in the Tools tab." },
      { label: "Format for target AI", instruction: "Tools tab → Cross-AI Formatter. Select target and reformat.", prompt: "→ Use the Cross-AI Formatter tool in the Tools tab." },
      { label: "Import in new AI", instruction: "Open new AI. Paste this prompt, then paste the formatted export below.", prompt: BUILT_IN_PROMPTS[4].prompt },
    ]
  },
  {
    id: "continue", title: "Continue Long Chat", icon: "↻", accent: "#f97316",
    description: "Pick up a conversation that hit the context limit.",
    steps: [
      { label: "Export before it breaks", instruction: "Run this in your CURRENT chat while it still has context.", prompt: BUILT_IN_PROMPTS[2].prompt },
      { label: "Compress it", instruction: "Tools → Context Compressor. Paste and compress.", prompt: "→ Use the Context Compressor in the Tools tab." },
      { label: "Start new chat", instruction: "Open fresh chat. Paste this + compressed export.", prompt: BUILT_IN_PROMPTS[3].prompt },
    ]
  },
  {
    id: "project", title: "Resume a Project", icon: "◎", accent: "#4ade80",
    description: "Restart a stalled project conversation after a break.",
    steps: [
      { label: "Extract project state", instruction: "Tools → State Extractor. Paste your last project conversation.", prompt: "→ Use the State Extractor in the Tools tab." },
      { label: "Save to Library", instruction: "After extracting, click 'Save to Library' to store it as a reusable prompt card.", prompt: "→ Use 'Save to Library' button on the extracted output." },
      { label: "Resume in new chat", instruction: "Find your saved card in the Library tab and copy the prompt to resume.", prompt: BUILT_IN_PROMPTS[1].prompt },
    ]
  },
];

// ─── GEMINI API ────────────────────────────────────────────────────────────────
async function callGemini(apiKey, systemPrompt, userMessage, onChunk) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `API error ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let full = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    const lines = decoder.decode(value).split("\n").filter(l => l.startsWith("data: "));
    for (const line of lines) {
      try {
        const json = JSON.parse(line.slice(6));
        const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) { full += text; onChunk(full); }
      } catch {}
    }
  }
  return full;
}

// ─── SHARED UI ─────────────────────────────────────────────────────────────────
const mono = "'JetBrains Mono','Fira Code',monospace";
const display = "'Syne','sans-serif'";

const Tag = ({ label, accent }) => (
  <span style={{ fontSize: "9px", letterSpacing: "2px", color: accent, border: `1px solid ${accent}30`, background: `${accent}10`, padding: "2px 8px", borderRadius: "3px", fontFamily: mono, fontWeight: 500, whiteSpace: "nowrap" }}>{label}</span>
);

const Badge = ({ children, color = "#374151" }) => (
  <span style={{ fontSize: "9px", letterSpacing: "1px", color, border: `1px solid ${color}30`, background: `${color}10`, padding: "2px 8px", borderRadius: "3px", fontFamily: mono }}>{children}</span>
);

const Textarea = ({ value, onChange, placeholder, rows = 7, style = {} }) => (
  <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
    style={{ width: "100%", background: "#07071a", border: "1px solid #16163a", borderRadius: "8px", color: "#a0aec0", fontSize: "12px", fontFamily: mono, padding: "12px 14px", resize: "vertical", lineHeight: 1.75, outline: "none", transition: "border-color 0.2s", ...style }}
    onFocus={e => e.target.style.borderColor = "#2d2d6a"}
    onBlur={e => e.target.style.borderColor = "#16163a"}
  />
);

const Inp = ({ value, onChange, placeholder, style = {} }) => (
  <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
    style={{ width: "100%", background: "#07071a", border: "1px solid #16163a", borderRadius: "7px", color: "#a0aec0", fontSize: "12px", fontFamily: mono, padding: "9px 12px", outline: "none", transition: "border-color 0.2s", ...style }}
    onFocus={e => e.target.style.borderColor = "#2d2d6a"}
    onBlur={e => e.target.style.borderColor = "#16163a"}
  />
);

const RunBtn = ({ onClick, loading, label, accent = "#22d3ee", disabled }) => (
  <button onClick={onClick} disabled={loading || disabled}
    style={{ padding: "9px 18px", background: (loading || disabled) ? "transparent" : `${accent}12`, border: `1px solid ${(loading || disabled) ? "#16163a" : accent}`, borderRadius: "7px", color: (loading || disabled) ? "#374151" : accent, fontSize: "11px", fontFamily: mono, cursor: (loading || disabled) ? "not-allowed" : "pointer", letterSpacing: "0.8px", display: "flex", alignItems: "center", gap: "8px", transition: "all 0.2s", whiteSpace: "nowrap" }}>
    {loading ? <><Spin accent={accent} />&nbsp;Processing…</> : label}
  </button>
);

const Spin = ({ accent = "#22d3ee" }) => (
  <span style={{ width: "11px", height: "11px", border: `1.5px solid ${accent}30`, borderTopColor: accent, borderRadius: "50%", display: "inline-block", animation: "spin .7s linear infinite" }} />
);

const CopyBtn = ({ text, accent = "#22d3ee" }) => {
  const [ok, setOk] = useState(false);
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setOk(true); setTimeout(() => setOk(false), 2000); }}
      style={{ padding: "5px 12px", background: ok ? `${accent}15` : "transparent", border: `1px solid ${ok ? accent : "#16163a"}`, borderRadius: "5px", color: ok ? accent : "#374151", fontSize: "10px", fontFamily: mono, cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.5px" }}>
      {ok ? "✓ copied" : "⎘ copy"}
    </button>
  );
};

const OutputPanel = ({ text, loading, accent = "#22d3ee", minH = 160, actions }) => (
  <div style={{ position: "relative", background: "#050514", border: `1px solid ${text ? accent + "30" : "#16163a"}`, borderRadius: "8px", padding: "14px", minHeight: minH, fontFamily: mono, fontSize: "12px", color: "#718096", lineHeight: 1.8, whiteSpace: "pre-wrap", transition: "border-color .3s", wordBreak: "break-word" }}>
    {loading && !text && <span style={{ color: accent, opacity: .6 }}>Analyzing<DotAnim /></span>}
    {text || (!loading && <span style={{ color: "#1e1e4a" }}>Output will appear here</span>)}
    {text && (
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", gap: "6px" }}>
        {actions}
        <CopyBtn text={text} accent={accent} />
      </div>
    )}
  </div>
);

const DotAnim = () => <span style={{ animation: "dots 1.2s steps(3,end) infinite" }}>...</span>;

const SLabel = ({ children, right }) => (
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
    <span style={{ fontSize: "9px", color: "#2d3748", letterSpacing: "2px", textTransform: "uppercase", fontFamily: mono }}>{children}</span>
    {right}
  </div>
);

const ErrMsg = ({ msg }) => msg ? <div style={{ color: "#f87171", fontSize: "11px", marginTop: "8px", fontFamily: mono }}>{msg}</div> : null;

const ToolHeader = ({ icon, title, accent, desc }) => (
  <div style={{ marginBottom: "20px", paddingBottom: "16px", borderBottom: "1px solid #13133a" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
      <span style={{ fontSize: "18px", color: accent }}>{icon}</span>
      <h3 style={{ margin: 0, fontFamily: display, fontSize: "18px", fontWeight: 700, color: "#e2e8f0" }}>{title}</h3>
    </div>
    <p style={{ margin: 0, color: "#2d3748", fontSize: "11px", fontFamily: mono, paddingLeft: "30px" }}>{desc}</p>
  </div>
);

// ─── API KEY BANNER ────────────────────────────────────────────────────────────
function ApiKeyBanner({ apiKey, setApiKey }) {
  const [editing, setEditing] = useState(!apiKey);
  const [val, setVal] = useState(apiKey);
  const save = () => { if (val.trim()) { setApiKey(val.trim()); setEditing(false); } };

  if (!editing && apiKey) return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 14px", background: "#04100a", border: "1px solid #0a2a16", borderRadius: "8px", marginBottom: "20px" }}>
      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 6px #4ade80", flexShrink: 0 }} />
      <span style={{ fontSize: "11px", color: "#374151", fontFamily: mono, flex: 1 }}>Gemini API connected &nbsp;·&nbsp; <span style={{ color: "#1a3024" }}>{"•".repeat(16)}{apiKey.slice(-4)}</span></span>
      <button onClick={() => setEditing(true)} style={{ background: "none", border: "none", color: "#2d3748", fontSize: "10px", cursor: "pointer", fontFamily: mono }}>change</button>
    </div>
  );

  return (
    <div style={{ padding: "14px 16px", background: "#07070f", border: "1px solid #1a1a3a", borderRadius: "10px", marginBottom: "20px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
        <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#facc15", boxShadow: "0 0 6px #facc15" }} />
        <span style={{ fontSize: "11px", color: "#64748b", fontFamily: mono }}>Gemini API key required for AI-powered tools</span>
        <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ fontSize: "10px", color: "#22d3ee", fontFamily: mono, marginLeft: "auto", textDecoration: "none" }}>Get free key →</a>
      </div>
      <div style={{ display: "flex", gap: "8px" }}>
        <input value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => e.key === "Enter" && save()} placeholder="Paste your Gemini API key here..." type="password"
          style={{ flex: 1, padding: "8px 12px", background: "#050510", border: "1px solid #16163a", borderRadius: "6px", color: "#a0aec0", fontSize: "12px", fontFamily: mono, outline: "none" }} />
        <button onClick={save} style={{ padding: "8px 18px", background: "#22d3ee15", border: "1px solid #22d3ee", borderRadius: "6px", color: "#22d3ee", fontSize: "11px", fontFamily: mono, cursor: "pointer" }}>Connect</button>
      </div>
      <div style={{ fontSize: "10px", color: "#1e2040", fontFamily: mono, marginTop: "8px" }}>Key stays in memory only · gemini-1.5-flash · free tier: 15 req/min</div>
    </div>
  );
}

// ─── SAVE TO LIBRARY MODAL ─────────────────────────────────────────────────────
function SaveModal({ initial, onSave, onClose, apiKey }) {
  const [mode, setMode] = useState(apiKey ? "ai" : "manual"); // "ai" | "manual"
  const [rawInput, setRawInput] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractErr, setExtractErr] = useState("");

  // Editable fields (populated either by AI or manually)
  const [title, setTitle]       = useState(initial?.title || "");
  const [description, setDesc]  = useState(initial?.description || "");
  const [useCase, setUseCase]   = useState(initial?.useCase || "");
  const [prompt, setPromptTxt]  = useState(initial?.prompt || "");
  const [category, setCategory] = useState(initial?.category || "Project");
  const [tag, setTag]           = useState(initial?.tag || "PROJECT");

  const categories = ["Project", "Export", "Continue", "Transfer", "Utility", "Custom"];

  const extractWithAI = async () => {
    if (!rawInput.trim() || !apiKey) return;
    setExtracting(true); setExtractErr("");
    try {
      let result = "";
      await callGemini(apiKey,
        `You are a prompt library assistant. Given a raw AI conversation or project dump, extract a clean, reusable prompt card. Respond ONLY with a valid JSON object — no markdown, no code fences, just raw JSON — with these exact keys:
{
  "title": "short descriptive title (max 6 words)",
  "description": "one sentence describing what this prompt does",
  "useCase": "one sentence on when to use it",
  "category": "one of: Project, Export, Continue, Transfer, Utility, Custom",
  "tag": "short uppercase tag like PROJECT, MVP, VIBE-CODE, EXPORT, etc.",
  "prompt": "the full reusable prompt that someone would paste into an AI to resume or use this context — include all key project details, tech stack, progress, decisions, and a clear instruction for the AI"
}`,
        `Extract a reusable prompt card from this:\n\n${rawInput}`,
        t => { result = t; }
      );
      // Parse JSON from result
      const clean = result.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setTitle(parsed.title || "");
      setDesc(parsed.description || "");
      setUseCase(parsed.useCase || "");
      setCategory(parsed.category || "Project");
      setTag((parsed.tag || "PROJECT").toUpperCase());
      setPromptTxt(parsed.prompt || "");
      setMode("manual"); // switch to edit view to review
    } catch (e) {
      setExtractErr("Extraction failed — " + e.message + ". Try the manual form below.");
      setMode("manual");
    }
    setExtracting(false);
  };

  const canSave = title.trim() && prompt.trim();
  const accent = CATEGORY_ACCENTS[category] || "#f472b6";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(4,4,20,0.92)", zIndex: 999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "#09091f", border: "1px solid #1e1e4a", borderRadius: "14px", width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto", padding: "28px", position: "relative" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "22px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
              <span style={{ fontSize: "18px", color: "#4ade80" }}>⊕</span>
              <h3 style={{ margin: 0, fontFamily: display, fontSize: "18px", fontWeight: 800, color: "#e2e8f0" }}>Save to Library</h3>
            </div>
            <p style={{ margin: 0, fontSize: "11px", color: "#2d3748", fontFamily: mono, paddingLeft: "30px" }}>
              {apiKey ? "Paste your project/conversation → AI extracts a clean prompt card" : "Fill in the form to add a custom prompt to your library"}
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "1px solid #1e1e4a", borderRadius: "6px", color: "#374151", fontSize: "16px", cursor: "pointer", width: "30px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>×</button>
        </div>

        {/* Mode toggle (only if API key present) */}
        {apiKey && (
          <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
            {["ai", "manual"].map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ padding: "7px 16px", borderRadius: "6px", border: mode === m ? "1px solid #4ade80" : "1px solid #16163a", background: mode === m ? "#4ade8012" : "transparent", color: mode === m ? "#4ade80" : "#374151", fontSize: "10px", fontFamily: mono, cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.8px" }}>
                {m === "ai" ? "⚡ AI Extract" : "✏ Manual"}
              </button>
            ))}
          </div>
        )}

        {/* AI Extract Mode */}
        {mode === "ai" && (
          <div style={{ marginBottom: "20px" }}>
            <SLabel>Paste conversation, code, or project dump</SLabel>
            <Textarea value={rawInput} onChange={setRawInput}
              placeholder={`Paste anything here:\n• A full AI conversation about your project\n• Vibe-coding session output\n• Code + comments + decisions\n• Any messy project dump\n\nGemini will extract a clean, reusable prompt card automatically.`}
              rows={10} />
            <div style={{ marginTop: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
              <RunBtn onClick={extractWithAI} loading={extracting} label="⚡  Extract & Fill Card" accent="#4ade80" disabled={!rawInput.trim()} />
              {extracting && <span style={{ fontSize: "10px", color: "#2d3748", fontFamily: mono }}>Analyzing your project…</span>}
            </div>
            <ErrMsg msg={extractErr} />
          </div>
        )}

        {/* Manual / Review Form */}
        {mode === "manual" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Preview badge */}
            {title && (
              <div style={{ padding: "10px 14px", background: `${accent}08`, border: `1px solid ${accent}20`, borderRadius: "8px", display: "flex", alignItems: "center", gap: "10px" }}>
                <Tag label={tag} accent={accent} />
                <span style={{ fontFamily: display, fontSize: "13px", fontWeight: 700, color: "#cbd5e1" }}>{title}</span>
                <Badge color={accent}>{category}</Badge>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <SLabel>Title *</SLabel>
                <Inp value={title} onChange={setTitle} placeholder="e.g. My SaaS MVP Context" />
              </div>
              <div>
                <SLabel>Category</SLabel>
                <select value={category} onChange={e => setCategory(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", background: "#07071a", border: "1px solid #16163a", borderRadius: "7px", color: "#a0aec0", fontSize: "12px", fontFamily: mono, outline: "none", cursor: "pointer" }}>
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <SLabel>Tag (short label)</SLabel>
                <Inp value={tag} onChange={v => setTag(v.toUpperCase())} placeholder="e.g. PROJECT" />
              </div>
              <div>
                <SLabel>Description</SLabel>
                <Inp value={description} onChange={setDesc} placeholder="One sentence about this prompt" />
              </div>
            </div>

            <div>
              <SLabel>When to use</SLabel>
              <Inp value={useCase} onChange={setUseCase} placeholder="e.g. Paste at start of new chat to resume this project" />
            </div>

            <div>
              <SLabel>Prompt Content * <span style={{ color: "#1e2040", letterSpacing: "0" }}>— this is what gets copied</span></SLabel>
              <Textarea value={prompt} onChange={setPromptTxt}
                placeholder="Paste or write the full prompt here. This is what will be copied when someone uses this card."
                rows={8} />
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "22px", paddingTop: "16px", borderTop: "1px solid #13133a" }}>
          <button onClick={onClose} style={{ padding: "9px 18px", background: "transparent", border: "1px solid #16163a", borderRadius: "7px", color: "#374151", fontSize: "11px", fontFamily: mono, cursor: "pointer" }}>Cancel</button>
          {mode === "ai" && rawInput && !extracting && (
            <button onClick={() => setMode("manual")} style={{ padding: "9px 18px", background: "transparent", border: "1px solid #2d2d6a", borderRadius: "7px", color: "#64748b", fontSize: "11px", fontFamily: mono, cursor: "pointer" }}>Fill manually instead</button>
          )}
          {(mode === "manual" || !apiKey) && (
            <button onClick={() => canSave && onSave({ title: title.trim(), description: description.trim(), useCase: useCase.trim(), prompt: prompt.trim(), category, tag, accent })}
              disabled={!canSave}
              style={{ padding: "9px 20px", background: canSave ? "#4ade8012" : "transparent", border: `1px solid ${canSave ? "#4ade80" : "#16163a"}`, borderRadius: "7px", color: canSave ? "#4ade80" : "#374151", fontSize: "11px", fontFamily: mono, cursor: canSave ? "pointer" : "not-allowed", letterSpacing: "0.8px", transition: "all 0.2s" }}>
              ⊕  Save to Library
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── LIBRARY TAB ───────────────────────────────────────────────────────────────
function LibraryTab({ customPrompts, setCustomPrompts, apiKey, openSaveModal }) {
  const [cat, setCat] = useState("All");
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [copied, setCopied] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showCustomOnly, setShowCustomOnly] = useState(false);

  const allPrompts = [...BUILT_IN_PROMPTS, ...customPrompts];
  const cats = ["All", "Export", "Continue", "Transfer", "Utility", "Project", "Custom"];

  const filtered = allPrompts.filter(p =>
    (!showCustomOnly || !p.builtin) &&
    (cat === "All" || p.category === cat) &&
    (!search || p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()))
  );

  const copy = (p) => { navigator.clipboard.writeText(p.prompt); setCopied(p.id); setTimeout(() => setCopied(null), 2000); };

  const deletePrompt = (id) => {
    setCustomPrompts(prev => prev.filter(p => p.id !== id));
    setConfirmDelete(null);
  };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative" }}>
          <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#2d3748", fontSize: "13px" }}>⌕</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search prompts…"
            style={{ padding: "7px 10px 7px 28px", background: "#07071a", border: "1px solid #16163a", borderRadius: "6px", color: "#a0aec0", fontSize: "11px", fontFamily: mono, outline: "none", width: "200px" }} />
        </div>
        {cats.map(c => (
          <button key={c} onClick={() => setCat(c)} style={{ padding: "6px 12px", borderRadius: "20px", fontSize: "10px", cursor: "pointer", letterSpacing: "0.5px", border: cat === c ? "1px solid #22d3ee" : "1px solid #16163a", background: cat === c ? "#22d3ee12" : "transparent", color: cat === c ? "#22d3ee" : "#2d3748", fontFamily: mono, transition: "all 0.15s" }}>{c}</button>
        ))}
        <button onClick={() => setShowCustomOnly(s => !s)} style={{ padding: "6px 12px", borderRadius: "20px", fontSize: "10px", cursor: "pointer", border: showCustomOnly ? "1px solid #4ade80" : "1px solid #16163a", background: showCustomOnly ? "#4ade8012" : "transparent", color: showCustomOnly ? "#4ade80" : "#2d3748", fontFamily: mono, transition: "all 0.15s", letterSpacing: "0.5px" }}>
          {showCustomOnly ? "● " : "○ "}My Saved
        </button>
        <span style={{ fontSize: "10px", color: "#1e2040", fontFamily: mono }}>{filtered.length} prompts</span>

        {/* Add button */}
        <button onClick={openSaveModal}
          style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "7px", padding: "8px 16px", background: "#4ade8012", border: "1px solid #4ade80", borderRadius: "8px", color: "#4ade80", fontSize: "11px", fontFamily: mono, cursor: "pointer", letterSpacing: "0.8px", transition: "all 0.2s", whiteSpace: "nowrap" }}
          onMouseEnter={e => e.currentTarget.style.background = "#4ade8020"}
          onMouseLeave={e => e.currentTarget.style.background = "#4ade8012"}>
          <span style={{ fontSize: "14px" }}>⊕</span> Save to Library
        </button>
      </div>

      {/* Custom prompts count */}
      {customPrompts.length > 0 && (
        <div style={{ marginBottom: "14px", padding: "8px 12px", background: "#04100a", border: "1px solid #0a2a16", borderRadius: "7px", fontSize: "10px", color: "#2d6040", fontFamily: mono, display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span style={{ color: "#4ade80" }}>◈</span>
          <span>{customPrompts.length} custom prompt{customPrompts.length !== 1 ? "s" : ""} saved</span>
          <span style={{ color: "#1a3024" }}>·</span>
          <span style={{ color: "#1e3a28" }}>persisted in localStorage — survives refresh & browser restart</span>
          <span style={{ color: "#1a3024" }}>·</span>
          <span style={{ color: "#1e3a28" }}>use ↓ Export in the top bar to back up or move to another device</span>
        </div>
      )}

      {/* Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "12px" }}>
        {filtered.map(p => (
          <div key={p.id}
            style={{ background: p.builtin ? "#08081c" : "#070f0a", border: `1px solid ${p.builtin ? "#13133a" : "#0a2a16"}`, borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", transition: "border-color 0.2s, transform 0.2s", position: "relative" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = p.accent + "50"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = p.builtin ? "#13133a" : "#0a2a16"; e.currentTarget.style.transform = ""; }}>

            {/* Custom badge */}
            {!p.builtin && (
              <div style={{ position: "absolute", top: "10px", right: "10px", fontSize: "8px", color: "#4ade80", letterSpacing: "1.5px", fontFamily: mono, background: "#4ade8010", border: "1px solid #4ade8025", padding: "1px 7px", borderRadius: "3px" }}>SAVED</div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingRight: !p.builtin ? "50px" : "0" }}>
              <Tag label={p.tag} accent={p.accent} />
            </div>
            <div>
              <h3 style={{ margin: "0 0 5px", fontFamily: display, fontSize: "14px", fontWeight: 700, color: "#e2e8f0" }}>{p.title}</h3>
              <p style={{ margin: 0, fontSize: "11px", color: "#374151", lineHeight: 1.6, fontFamily: mono }}>{p.description}</p>
            </div>
            {p.useCase && (
              <div style={{ background: p.builtin ? "#05050f" : "#040d06", borderLeft: `2px solid ${p.accent}40`, padding: "6px 10px", borderRadius: "0 5px 5px 0" }}>
                <span style={{ fontSize: "9px", color: p.accent, letterSpacing: "1px", fontFamily: mono }}>WHEN: </span>
                <span style={{ fontSize: "10px", color: "#2d3748", fontFamily: mono }}>{p.useCase}</span>
              </div>
            )}
            <button onClick={() => setExpanded(expanded === p.id ? null : p.id)}
              style={{ background: "none", border: "none", color: "#2d3748", fontSize: "10px", cursor: "pointer", textAlign: "left", padding: 0, fontFamily: mono, display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ display: "inline-block", transition: "transform 0.2s", transform: expanded === p.id ? "rotate(90deg)" : "" }}>▶</span>
              {expanded === p.id ? "hide" : "preview prompt"}
            </button>
            {expanded === p.id && (
              <div style={{ whiteSpace: "pre-wrap", fontSize: "10px", lineHeight: 1.75, color: "#374151", background: "#040410", borderRadius: "6px", padding: "10px", maxHeight: "180px", overflowY: "auto", fontFamily: mono, border: "1px solid #13133a" }}>{p.prompt}</div>
            )}

            <div style={{ display: "flex", gap: "6px", marginTop: "auto" }}>
              <button onClick={() => copy(p)} style={{ flex: 1, padding: "8px", background: copied === p.id ? `${p.accent}12` : p.builtin ? "#05050f" : "#040d06", border: `1px solid ${copied === p.id ? p.accent : p.builtin ? "#13133a" : "#0a2a16"}`, borderRadius: "6px", color: copied === p.id ? p.accent : "#2d3748", fontSize: "10px", fontFamily: mono, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "7px", transition: "all .15s", letterSpacing: "0.8px" }}>
                {copied === p.id ? "✓  copied" : "⎘  copy prompt"}
              </button>
              {!p.builtin && (
                confirmDelete === p.id
                  ? <div style={{ display: "flex", gap: "4px" }}>
                      <button onClick={() => deletePrompt(p.id)} style={{ padding: "8px 10px", background: "#f8717112", border: "1px solid #f87171", borderRadius: "6px", color: "#f87171", fontSize: "10px", fontFamily: mono, cursor: "pointer" }}>delete</button>
                      <button onClick={() => setConfirmDelete(null)} style={{ padding: "8px 10px", background: "transparent", border: "1px solid #16163a", borderRadius: "6px", color: "#374151", fontSize: "10px", fontFamily: mono, cursor: "pointer" }}>cancel</button>
                    </div>
                  : <button onClick={() => setConfirmDelete(p.id)} style={{ padding: "8px 10px", background: "transparent", border: "1px solid #16163a", borderRadius: "6px", color: "#2d3748", fontSize: "10px", fontFamily: mono, cursor: "pointer", transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#f87171"; e.currentTarget.style.color = "#f87171"; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = "#16163a"; e.currentTarget.style.color = "#2d3748"; }}>
                      ✕
                    </button>
              )}
            </div>
          </div>
        ))}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ gridColumn: "1/-1", textAlign: "center", padding: "60px 20px", color: "#1e2040", fontFamily: mono }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>◈</div>
            <div style={{ fontSize: "13px", marginBottom: "6px", color: "#2d3748" }}>No prompts found</div>
            <div style={{ fontSize: "11px" }}>Try a different filter or save your first custom prompt</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── TOOLS TAB ─────────────────────────────────────────────────────────────────
function ToolsTab({ apiKey, onSaveToLibrary }) {
  const [tool, setTool] = useState("compressor");
  const tools = [
    { id: "compressor", label: "Context Compressor", icon: "⟁", accent: "#22d3ee" },
    { id: "extractor",  label: "State Extractor",    icon: "⊛", accent: "#a78bfa" },
    { id: "formatter",  label: "Cross-AI Formatter", icon: "⊞", accent: "#4ade80" },
    { id: "variables",  label: "Prompt Variables",   icon: "⟨⟩", accent: "#facc15" },
    { id: "estimator",  label: "Size Estimator",     icon: "▤",  accent: "#f97316" },
  ];

  return (
    <div style={{ display: "flex", gap: "0" }}>
      <div style={{ width: "170px", flexShrink: 0, borderRight: "1px solid #13133a", paddingRight: "16px", marginRight: "28px" }}>
        {tools.map(t => (
          <button key={t.id} onClick={() => setTool(t.id)}
            style={{ width: "100%", padding: "9px 12px", borderRadius: "7px", cursor: "pointer", marginBottom: "3px", border: tool === t.id ? `1px solid ${t.accent}25` : "1px solid transparent", background: tool === t.id ? `${t.accent}0c` : "transparent", color: tool === t.id ? t.accent : "#2d3748", fontSize: "11px", fontFamily: mono, display: "flex", alignItems: "center", gap: "8px", transition: "all 0.15s", textAlign: "left" }}
            onMouseEnter={e => { if (tool !== t.id) e.currentTarget.style.color = "#4a5568"; }}
            onMouseLeave={e => { if (tool !== t.id) e.currentTarget.style.color = "#2d3748"; }}>
            <span style={{ fontSize: "13px" }}>{t.icon}</span>
            <span style={{ fontSize: "10px", lineHeight: 1.3 }}>{t.label}</span>
          </button>
        ))}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {tool === "compressor" && <CompressorTool apiKey={apiKey} onSave={onSaveToLibrary} />}
        {tool === "extractor"  && <ExtractorTool  apiKey={apiKey} onSave={onSaveToLibrary} />}
        {tool === "formatter"  && <FormatterTool  apiKey={apiKey} />}
        {tool === "variables"  && <VariablesTool  onSave={onSaveToLibrary} />}
        {tool === "estimator"  && <EstimatorTool />}
      </div>
    </div>
  );
}

// Save-to-Library mini button used inside tools
const SaveToLibBtn = ({ text, onSave }) => (
  <button onClick={() => onSave && onSave(text)}
    style={{ padding: "5px 10px", background: "#4ade8012", border: "1px solid #4ade8040", borderRadius: "5px", color: "#4ade80", fontSize: "10px", fontFamily: mono, cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
    ⊕ save
  </button>
);

function CompressorTool({ apiKey, onSave }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const run = async () => {
    if (!input.trim() || !apiKey) return;
    setLoading(true); setOutput(""); setErr("");
    try {
      await callGemini(apiKey,
        "You are a context compression expert. Receive raw AI conversation text and output a compressed context prompt ready to paste into a new chat. Be precise and dense. Use clear headers. Output ONLY the compressed context — no preamble, no commentary.",
        `Compress this conversation:\n\n${input}`, setOutput);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };
  return (
    <div>
      <ToolHeader icon="⟁" title="Context Compressor" accent="#22d3ee" desc="Paste any conversation → get a compressed, structured context prompt." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <SLabel>Input Conversation</SLabel>
          <Textarea value={input} onChange={setInput} placeholder="Paste your full conversation here…" rows={13} />
          <div style={{ marginTop: "10px", display: "flex", gap: "8px", alignItems: "center" }}>
            <RunBtn onClick={run} loading={loading} label="⟁  Compress" accent="#22d3ee" disabled={!apiKey || !input.trim()} />
            {input && <button onClick={() => { setInput(""); setOutput(""); }} style={{ background: "none", border: "none", color: "#2d3748", fontSize: "10px", cursor: "pointer", fontFamily: mono }}>clear</button>}
            {!apiKey && <span style={{ fontSize: "10px", color: "#374151", fontFamily: mono }}>← add API key above</span>}
          </div>
          <ErrMsg msg={err} />
        </div>
        <div>
          <SLabel right={output ? <span style={{ fontSize: "10px", color: "#1e2040", fontFamily: mono }}>≈{Math.round(output.split(/\s+/).length * 1.3).toLocaleString()} tokens</span> : null}>Compressed Output</SLabel>
          <OutputPanel text={output} loading={loading} accent="#22d3ee" minH={280}
            actions={output && onSave ? <SaveToLibBtn text={output} onSave={onSave} /> : null} />
        </div>
      </div>
    </div>
  );
}

function ExtractorTool({ apiKey, onSave }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const run = async () => {
    if (!input.trim() || !apiKey) return;
    setLoading(true); setOutput(""); setErr("");
    try {
      await callGemini(apiKey,
        `You are a project state extraction expert. Output ONLY this structure:\n\nPROJECT NAME\n[name]\n\nGOAL\n[goal]\n\nTECH STACK\n[stack]\n\nCURRENT PROGRESS\n- [done items]\n\nOPEN PROBLEMS\n- [blockers]\n\nNEXT TASK\n[next action]\n\nKEY DECISIONS\n- [decisions]\n\nIMPORTANT CONTEXT\n[other critical info]`,
        `Extract project state:\n\n${input}`, setOutput);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };
  return (
    <div>
      <ToolHeader icon="⊛" title="State Extractor" accent="#a78bfa" desc="Paste a project conversation → auto-extract goal, stack, progress, and next steps." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <SLabel>Input Conversation</SLabel>
          <Textarea value={input} onChange={setInput} placeholder="Paste a project conversation — any length, any AI…" rows={13} />
          <div style={{ marginTop: "10px" }}>
            <RunBtn onClick={run} loading={loading} label="⊛  Extract State" accent="#a78bfa" disabled={!apiKey || !input.trim()} />
          </div>
          <ErrMsg msg={err} />
        </div>
        <div>
          <SLabel>Extracted State</SLabel>
          <OutputPanel text={output} loading={loading} accent="#a78bfa" minH={280}
            actions={output && onSave ? <SaveToLibBtn text={output} onSave={onSave} /> : null} />
        </div>
      </div>
    </div>
  );
}

function FormatterTool({ apiKey }) {
  const [input, setInput] = useState("");
  const [target, setTarget] = useState("Claude");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const targets = [
    { id: "Claude",  accent: "#f97316", desc: "XML tags, explicit rules, structured sections" },
    { id: "ChatGPT", accent: "#22d3ee", desc: "Markdown headers, direct instructions, no XML" },
    { id: "Gemini",  accent: "#4ade80", desc: "Concise, factual, brief bullets" },
    { id: "Llama",   accent: "#facc15", desc: "Plain text, minimal formatting, essential only" },
    { id: "Mistral", accent: "#c084fc", desc: "Standard markdown, balanced density" },
  ];
  const instructions = {
    Claude:  "Reformat for Claude AI: use XML tags (<context>, <instructions>, <projects>, <preferences>), explicit always/never rules, thorough structured output.",
    ChatGPT: "Reformat for ChatGPT/GPT-4: ## markdown headers, conversational tone, no XML. Start with 'About me:' section.",
    Gemini:  "Reformat for Gemini: very concise, short bullet points only, critical info only.",
    Llama:   "Reformat for Llama: plain text, no markdown, no XML, essential facts only, under 500 words.",
    Mistral: "Reformat for Mistral: standard markdown (## headers, - bullets), medium density.",
  };
  const sel = targets.find(t => t.id === target);
  const run = async () => {
    if (!input.trim() || !apiKey) return;
    setLoading(true); setOutput(""); setErr("");
    try {
      await callGemini(apiKey, "You are an AI context formatting expert. Reformat context exports optimally for specific AI models. Output ONLY the reformatted context — no commentary, no code fences.",
        `${instructions[target]}\n\nReformat:\n\n${input}`, setOutput);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  };
  return (
    <div>
      <ToolHeader icon="⊞" title="Cross-AI Formatter" accent="#4ade80" desc="Reformat any context export to work optimally with a specific AI model." />
      <SLabel>Target AI</SLabel>
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        {targets.map(t => (
          <button key={t.id} onClick={() => setTarget(t.id)} style={{ padding: "8px 16px", borderRadius: "7px", cursor: "pointer", border: target === t.id ? `1px solid ${t.accent}` : "1px solid #16163a", background: target === t.id ? `${t.accent}12` : "#07071a", color: target === t.id ? t.accent : "#374151", fontFamily: mono, fontSize: "11px", transition: "all 0.15s" }}>{t.id}</button>
        ))}
      </div>
      {sel && <div style={{ fontSize: "10px", color: "#2d3748", fontFamily: mono, marginBottom: "16px" }}><span style={{ color: sel.accent }}>→</span> {sel.desc}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <SLabel>Input Context</SLabel>
          <Textarea value={input} onChange={setInput} placeholder="Paste any exported context here…" rows={11} />
          <div style={{ marginTop: "10px" }}>
            <RunBtn onClick={run} loading={loading} label={`⊞  Format for ${target}`} accent={sel?.accent || "#4ade80"} disabled={!apiKey || !input.trim()} />
          </div>
          <ErrMsg msg={err} />
        </div>
        <div>
          <SLabel>Formatted for {target}</SLabel>
          <OutputPanel text={output} loading={loading} accent={sel?.accent || "#4ade80"} minH={240} />
        </div>
      </div>
    </div>
  );
}

function VariablesTool({ onSave }) {
  const [template, setTemplate] = useState(`You are helping me continue a project called {{project_name}}.\n\nMy goal: {{goal}}\n\nTech stack: {{tech_stack}}\n\nProgress so far:\n{{current_progress}}\n\nConversation to continue:\n{{conversation}}\n\nPlease pick up exactly where we left off.`);
  const [vars, setVars] = useState({});
  const [result, setResult] = useState("");
  const detected = [...new Set([...template.matchAll(/\{\{(\w+)\}\}/g)].map(m => m[1]))];
  const generate = () => {
    let out = template;
    for (const v of detected) out = out.replaceAll(`{{${v}}}`, vars[v] || `[${v}]`);
    setResult(out);
  };
  return (
    <div>
      <ToolHeader icon="⟨⟩" title="Prompt Variables" accent="#facc15" desc="Build reusable templates with dynamic {{variable}} fill-in fields." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <SLabel>Template — use {"{{variable}}"} syntax</SLabel>
            <Textarea value={template} onChange={setTemplate} rows={9} />
          </div>
          {detected.length > 0 && (
            <div>
              <SLabel>{detected.length} variable{detected.length !== 1 ? "s" : ""} detected</SLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {detected.map(v => (
                  <div key={v} style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                    <div style={{ width: "130px", flexShrink: 0, padding: "7px 10px", background: "#06060e", border: "1px solid #facc1525", borderRadius: "6px", fontSize: "10px", color: "#facc15", fontFamily: mono, marginTop: "2px" }}>{"{{"}{v}{"}}"}</div>
                    <textarea value={vars[v] || ""} onChange={e => setVars(p => ({ ...p, [v]: e.target.value }))} placeholder={v.replaceAll("_", " ")} rows={2}
                      style={{ flex: 1, background: "#07071a", border: "1px solid #16163a", borderRadius: "6px", color: "#a0aec0", fontSize: "11px", fontFamily: mono, padding: "7px 10px", resize: "vertical", outline: "none" }} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={generate} style={{ padding: "9px 18px", background: "#facc1512", border: "1px solid #facc15", borderRadius: "7px", color: "#facc15", fontSize: "11px", fontFamily: mono, cursor: "pointer", letterSpacing: "0.8px" }}>⟨⟩ Generate</button>
          </div>
        </div>
        <div>
          <SLabel right={result ? <div style={{ display: "flex", gap: "6px", alignItems: "center" }}><span style={{ fontSize: "10px", color: "#1e2040", fontFamily: mono }}>≈{Math.round(result.split(/\s+/).length * 1.3).toLocaleString()} tokens</span>{onSave && <SaveToLibBtn text={result} onSave={onSave} />}</div> : null}>Generated Prompt</SLabel>
          <div style={{ position: "relative", background: "#050514", border: `1px solid ${result ? "#facc1530" : "#16163a"}`, borderRadius: "8px", padding: "14px", minHeight: "200px", fontFamily: mono, fontSize: "12px", color: "#718096", lineHeight: 1.8, whiteSpace: "pre-wrap", wordBreak: "break-word", transition: "border-color .3s" }}>
            {result || <span style={{ color: "#1e1e4a" }}>Generated prompt appears here</span>}
            {result && <div style={{ position: "absolute", top: 10, right: 10 }}><CopyBtn text={result} accent="#facc15" /></div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function EstimatorTool() {
  const [input, setInput] = useState("");
  const tokens = input ? Math.round(input.split(/\s+/).filter(Boolean).length * 1.35 + input.length * 0.08) : 0;
  return (
    <div>
      <ToolHeader icon="▤" title="Size Estimator" accent="#f97316" desc="Estimate token count and check compatibility before pasting." />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        <div>
          <SLabel>Paste Any Text or Context</SLabel>
          <Textarea value={input} onChange={setInput} placeholder="Paste any text, prompt, or exported context…" rows={12} />
          {input && (
            <div style={{ marginTop: "8px", display: "flex", gap: "14px", fontSize: "10px", fontFamily: mono }}>
              <span style={{ color: "#2d3748" }}>{input.split(/\s+/).filter(Boolean).length} words</span>
              <span style={{ color: "#2d3748" }}>{input.length} chars</span>
              <span style={{ color: "#f97316" }}>≈ {tokens.toLocaleString()} tokens</span>
            </div>
          )}
        </div>
        <div>
          <SLabel>Model Compatibility</SLabel>
          <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {Object.entries(TOKEN_LIMITS).map(([model, { limit, color }]) => {
              const pct = tokens ? Math.min((tokens / limit) * 100, 100) : 0;
              const over = tokens > limit, warn = !over && tokens > limit * 0.8;
              const sc = over ? "#f87171" : warn ? "#fbbf24" : tokens ? "#4ade80" : "#2d3748";
              return (
                <div key={model} style={{ background: "#08081c", border: "1px solid #13133a", borderRadius: "7px", padding: "10px 12px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "#4a5568", fontFamily: mono }}>{model}</span>
                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                      <span style={{ fontSize: "9px", color: "#1e2040", fontFamily: mono }}>{(limit / 1000).toFixed(0)}k</span>
                      <span style={{ fontSize: "9px", color: sc, fontFamily: mono, padding: "1px 7px", background: `${sc}12`, border: `1px solid ${sc}25`, borderRadius: "3px", letterSpacing: "1px" }}>{over ? "OVER" : warn ? "WARN" : tokens ? "OK" : "—"}</span>
                    </div>
                  </div>
                  <div style={{ height: "3px", background: "#13133a", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: sc, borderRadius: "2px", transition: "width 0.4s ease" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── WORKFLOWS TAB ─────────────────────────────────────────────────────────────
function WorkflowsTab() {
  const [active, setActive] = useState("transfer");
  const [step, setStep] = useState(0);
  const [copied, setCopied] = useState(null);
  const wf = WORKFLOWS.find(w => w.id === active);
  const copy = (prompt, idx) => { navigator.clipboard.writeText(prompt); setCopied(idx); setTimeout(() => setCopied(null), 2000); };

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "10px", marginBottom: "28px" }}>
        {WORKFLOWS.map(w => (
          <button key={w.id} onClick={() => { setActive(w.id); setStep(0); }}
            style={{ padding: "14px 16px", borderRadius: "10px", cursor: "pointer", border: active === w.id ? `1px solid ${w.accent}` : "1px solid #16163a", background: active === w.id ? `${w.accent}10` : "#07071a", color: active === w.id ? w.accent : "#374151", fontFamily: mono, transition: "all 0.15s", textAlign: "left" }}>
            <div style={{ fontSize: "20px", marginBottom: "6px" }}>{w.icon}</div>
            <div style={{ fontSize: "12px", fontFamily: display, fontWeight: 700, color: active === w.id ? w.accent : "#64748b", marginBottom: "4px" }}>{w.title}</div>
            <div style={{ fontSize: "10px", color: "#2d3748", lineHeight: 1.5 }}>{w.description}</div>
          </button>
        ))}
      </div>

      {wf && (
        <>
          <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "24px", flexWrap: "wrap" }}>
            {wf.steps.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <button onClick={() => setStep(i)} style={{ display: "flex", alignItems: "center", gap: "7px", padding: "6px 12px", borderRadius: "20px", cursor: "pointer", border: i === step ? `1px solid ${wf.accent}` : i < step ? `1px solid ${wf.accent}40` : "1px solid #16163a", background: i === step ? `${wf.accent}15` : "transparent", color: i === step ? wf.accent : i < step ? wf.accent + "70" : "#2d3748", fontFamily: mono, fontSize: "10px", transition: "all 0.2s" }}>
                  <span style={{ width: "16px", height: "16px", borderRadius: "50%", border: "1px solid currentColor", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "9px", flexShrink: 0 }}>{i < step ? "✓" : i + 1}</span>
                  {s.label}
                </button>
                {i < wf.steps.length - 1 && <div style={{ width: "16px", height: "1px", background: i < step ? wf.accent + "40" : "#16163a", margin: "0 2px" }} />}
              </div>
            ))}
          </div>

          <div style={{ background: "#08081c", border: `1px solid ${wf.accent}25`, borderRadius: "12px", padding: "22px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <div style={{ width: "26px", height: "26px", borderRadius: "50%", background: `${wf.accent}15`, border: `1px solid ${wf.accent}`, color: wf.accent, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontFamily: mono, flexShrink: 0 }}>{step + 1}</div>
              <h4 style={{ margin: 0, fontFamily: display, fontSize: "15px", fontWeight: 700, color: "#e2e8f0" }}>{wf.steps[step].label}</h4>
            </div>
            <div style={{ background: "#05050f", borderLeft: `2px solid ${wf.accent}40`, padding: "9px 12px", borderRadius: "0 6px 6px 0", marginBottom: "14px" }}>
              <span style={{ fontSize: "9px", color: wf.accent, letterSpacing: "1px", fontFamily: mono }}>ACTION: </span>
              <span style={{ fontSize: "11px", color: "#374151", fontFamily: mono }}>{wf.steps[step].instruction}</span>
            </div>
            <div style={{ whiteSpace: "pre-wrap", fontSize: "11px", lineHeight: 1.75, color: "#4a5568", background: "#050514", borderRadius: "8px", padding: "12px 14px", fontFamily: mono, border: "1px solid #13133a", marginBottom: "14px" }}>{wf.steps[step].prompt}</div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => copy(wf.steps[step].prompt, step)} style={{ padding: "7px 16px", background: copied === step ? `${wf.accent}15` : "transparent", border: `1px solid ${copied === step ? wf.accent : "#16163a"}`, borderRadius: "6px", color: copied === step ? wf.accent : "#2d3748", fontSize: "10px", fontFamily: mono, cursor: "pointer", transition: "all 0.15s", letterSpacing: "0.5px" }}>
                {copied === step ? "✓ copied" : "⎘ copy prompt"}
              </button>
              <div style={{ display: "flex", gap: "8px" }}>
                {step > 0 && <button onClick={() => setStep(s => s - 1)} style={{ padding: "7px 14px", background: "transparent", border: "1px solid #16163a", borderRadius: "6px", color: "#374151", fontSize: "10px", fontFamily: mono, cursor: "pointer" }}>← back</button>}
                {step < wf.steps.length - 1
                  ? <button onClick={() => setStep(s => s + 1)} style={{ padding: "7px 14px", background: `${wf.accent}12`, border: `1px solid ${wf.accent}`, borderRadius: "6px", color: wf.accent, fontSize: "10px", fontFamily: mono, cursor: "pointer", letterSpacing: "0.5px" }}>next →</button>
                  : <button onClick={() => setStep(0)} style={{ padding: "7px 14px", background: `${wf.accent}12`, border: `1px solid ${wf.accent}`, borderRadius: "6px", color: wf.accent, fontSize: "10px", fontFamily: mono, cursor: "pointer" }}>↺ restart</button>
                }
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── STORAGE HELPERS ───────────────────────────────────────────────────────────
const LS_PROMPTS = "contextos_prompts_v1";
const LS_APIKEY  = "contextos_apikey_v1";

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(LS_PROMPTS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveToStorage(prompts) {
  try { localStorage.setItem(LS_PROMPTS, JSON.stringify(prompts)); } catch {}
}

function loadApiKey() {
  try { return localStorage.getItem(LS_APIKEY) || ""; } catch { return ""; }
}

function saveApiKey(key) {
  try { localStorage.setItem(LS_APIKEY, key); } catch {}
}

function exportLibrary(prompts) {
  const data = {
    version: 1,
    exported: new Date().toISOString(),
    prompts,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `context-os-library-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importLibrary(file, onSuccess, onError) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      // Accept both raw array and wrapped {prompts:[]} format
      const prompts = Array.isArray(data) ? data : data.prompts;
      if (!Array.isArray(prompts)) throw new Error("Invalid format");
      // Sanitise: strip builtin flag, re-assign IDs to avoid collisions
      const sanitised = prompts.map((p, i) => ({
        ...p,
        id: Date.now() + i,
        builtin: false,
        accent: CATEGORY_ACCENTS[p.category] || "#f472b6",
      }));
      onSuccess(sanitised);
    } catch (err) { onError(err.message); }
  };
  reader.readAsText(file);
}

// ─── ROOT APP ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("library");
  const [apiKey, setApiKey] = useState(() => loadApiKey());
  const [customPrompts, setCustomPrompts] = useState(() => loadFromStorage());
  const [saveModal, setSaveModal] = useState(null);
  const [toast, setToast] = useState(null);
  const [importErr, setImportErr] = useState("");
  const importRef = useRef(null);

  // ── Persist prompts to localStorage on every change ──
  useEffect(() => {
    saveToStorage(customPrompts);
  }, [customPrompts]);

  // ── Persist API key on every change ──
  useEffect(() => {
    saveApiKey(apiKey);
  }, [apiKey]);

  const showToast = (msg, color = "#4ade80") => {
    setToast({ msg, color });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = (data) => {
    const newPrompt = {
      ...data,
      id: Date.now(),
      builtin: false,
      accent: CATEGORY_ACCENTS[data.category] || "#f472b6",
    };
    setCustomPrompts(prev => [newPrompt, ...prev]);
    setSaveModal(null);
    setTab("library");
    showToast(`"${data.title}" saved to library ✓`);
  };

  const openSaveWithPrefill = (promptText) => {
    setSaveModal({ prefill: promptText });
  };

  const handleExport = () => {
    if (customPrompts.length === 0) { showToast("No saved prompts to export", "#f87171"); return; }
    exportLibrary(customPrompts);
    showToast(`Exported ${customPrompts.length} prompt${customPrompts.length !== 1 ? "s" : ""} ✓`);
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportErr("");
    importLibrary(
      file,
      (imported) => {
        setCustomPrompts(prev => {
          // Merge: skip duplicates by title
          const existing = new Set(prev.map(p => p.title));
          const fresh = imported.filter(p => !existing.has(p.title));
          return [...fresh, ...prev];
        });
        showToast(`Imported ${imported.length} prompt${imported.length !== 1 ? "s" : ""} ✓`);
      },
      (err) => { showToast(`Import failed: ${err}`, "#f87171"); }
    );
    // Reset input so the same file can be re-imported
    e.target.value = "";
  };

  const tabs = [
    { id: "library",   label: "Library",   icon: "◈", meta: `${BUILT_IN_PROMPTS.length + customPrompts.length} prompts` },
    { id: "tools",     label: "Tools",     icon: "⚙", meta: "5 tools" },
    { id: "workflows", label: "Workflows", icon: "⋮", meta: "3 flows" },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#060614", fontFamily: mono, color: "#e2e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500&family=Syne:wght@700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #060614; }
        ::-webkit-scrollbar-thumb { background: #1a1a3a; border-radius: 2px; }
        textarea, input, select { font-family: 'JetBrains Mono', monospace !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes dots { 0%{content:'.'} 33%{content:'..'} 66%{content:'...'} }
        @keyframes fadeUp { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:none; } }
        @keyframes slideIn { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:none; } }
        .fade { animation: fadeUp 0.2s ease; }
        .modal-inner { animation: slideIn 0.25s ease; }
        button { cursor: pointer; }
      `}</style>

      {/* Hidden file input for import */}
      <input
        ref={importRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: "none" }}
      />

      {/* Top bar */}
      <div style={{ borderBottom: "1px solid #0f0f2a", padding: "0 32px", background: "#04040f", display: "flex", alignItems: "stretch", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", paddingRight: "28px", borderRight: "1px solid #0f0f2a", marginRight: "20px" }}>
          <div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22d3ee", boxShadow: "0 0 10px #22d3ee88" }} />
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: "13px", fontWeight: 800, color: "#e2e8f0", letterSpacing: "1px" }}>CONTEXT OS</span>
        </div>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding: "15px 18px", background: "none", border: "none", borderBottom: tab === t.id ? "2px solid #22d3ee" : "2px solid transparent", color: tab === t.id ? "#22d3ee" : "#2d3748", fontSize: "11px", fontFamily: mono, display: "flex", alignItems: "center", gap: "8px", transition: "all 0.15s", letterSpacing: "0.5px", marginBottom: "-1px" }}
            onMouseEnter={e => { if (tab !== t.id) e.currentTarget.style.color = "#4a5568"; }}
            onMouseLeave={e => { if (tab !== t.id) e.currentTarget.style.color = "#2d3748"; }}>
            <span>{t.icon}</span>{t.label}
            <span style={{ fontSize: "9px", color: tab === t.id ? "#22d3ee50" : "#1e1e3a", letterSpacing: "1px" }}>{t.meta}</span>
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Import */}
          <button
            onClick={() => importRef.current?.click()}
            title="Import library from JSON file"
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", background: "transparent", border: "1px solid #1e1e3a", borderRadius: "6px", color: "#374151", fontSize: "10px", fontFamily: mono, cursor: "pointer", letterSpacing: "0.8px", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#a78bfa"; e.currentTarget.style.color = "#a78bfa"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e3a"; e.currentTarget.style.color = "#374151"; }}>
            ↑ Import
          </button>
          {/* Export */}
          <button
            onClick={handleExport}
            title={`Export your ${customPrompts.length} saved prompt${customPrompts.length !== 1 ? "s" : ""} as JSON`}
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "6px 12px", background: "transparent", border: "1px solid #1e1e3a", borderRadius: "6px", color: "#374151", fontSize: "10px", fontFamily: mono, cursor: "pointer", letterSpacing: "0.8px", transition: "all 0.2s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "#22d3ee"; e.currentTarget.style.color = "#22d3ee"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "#1e1e3a"; e.currentTarget.style.color = "#374151"; }}>
            ↓ Export{customPrompts.length > 0 ? ` (${customPrompts.length})` : ""}
          </button>
          {/* Divider */}
          <div style={{ width: "1px", height: "20px", background: "#1e1e3a" }} />
          {/* Save to Library */}
          <button onClick={() => setSaveModal({ prefill: null })}
            style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 14px", background: "#4ade8012", border: "1px solid #4ade8040", borderRadius: "6px", color: "#4ade80", fontSize: "10px", fontFamily: mono, cursor: "pointer", letterSpacing: "0.8px", transition: "all 0.2s" }}
            onMouseEnter={e => e.currentTarget.style.background = "#4ade8020"}
            onMouseLeave={e => e.currentTarget.style.background = "#4ade8012"}>
            <span style={{ fontSize: "13px" }}>⊕</span> Save to Library
          </button>
          {/* Storage indicator */}
          <div title="Prompts are saved to your browser's localStorage — they persist across refreshes"
            style={{ display: "flex", alignItems: "center", gap: "5px", padding: "0 8px", borderLeft: "1px solid #0f0f2a", height: "100%" }}>
            <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 5px #4ade8088" }} />
            <span style={{ fontSize: "9px", color: "#1e3024", letterSpacing: "1px", fontFamily: mono }}>LOCAL</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px 32px" }}>
        {tab === "tools" && <ApiKeyBanner apiKey={apiKey} setApiKey={setApiKey} />}
        <div className="fade" key={tab}>
          {tab === "library"   && <LibraryTab customPrompts={customPrompts} setCustomPrompts={setCustomPrompts} apiKey={apiKey} openSaveModal={() => setSaveModal({ prefill: null })} />}
          {tab === "tools"     && <ToolsTab apiKey={apiKey} onSaveToLibrary={openSaveWithPrefill} />}
          {tab === "workflows" && <WorkflowsTab />}
        </div>
      </div>

      {/* Save Modal */}
      {saveModal && (
        <SaveModal
          initial={saveModal.prefill ? { prompt: saveModal.prefill } : null}
          onSave={handleSave}
          onClose={() => setSaveModal(null)}
          apiKey={apiKey}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", padding: "12px 18px", background: "#09091f", border: `1px solid ${toast.color}40`, borderRadius: "8px", color: toast.color, fontSize: "12px", fontFamily: mono, zIndex: 1000, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", animation: "slideIn 0.25s ease", display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "14px" }}>✓</span>{toast.msg}
        </div>
      )}
    </div>
  );
}
