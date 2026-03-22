import { useState, useRef, useEffect, useCallback } from "react";

/* ─── Tool & Template Data ─── */

const TOOL_CATEGORIES = {
  "Language Models": [
    { id: "claude", name: "Claude", icon: "◈" },
    { id: "chatgpt", name: "ChatGPT / GPT-4o", icon: "◉" },
    { id: "gemini", name: "Gemini", icon: "◇" },
    { id: "o1o3", name: "o1 / o3", icon: "⬡" },
    { id: "deepseek", name: "DeepSeek-R1", icon: "◆" },
    { id: "qwen", name: "Qwen", icon: "◎" },
    { id: "llama", name: "Llama / Mistral", icon: "△" },
    { id: "perplexity", name: "Perplexity", icon: "⊙" },
  ],
  "Code & Agents": [
    { id: "claude-code", name: "Claude Code", icon: "⌘" },
    { id: "cursor", name: "Cursor / Windsurf", icon: "⟐" },
    { id: "copilot", name: "GitHub Copilot", icon: "⏣" },
    { id: "bolt", name: "Bolt / v0 / Lovable", icon: "⚡" },
    { id: "devin", name: "Devin", icon: "⊞" },
    { id: "antigravity", name: "Antigravity", icon: "⍟" },
  ],
  "Image & Video": [
    { id: "midjourney", name: "Midjourney", icon: "✦" },
    { id: "dalle", name: "DALL-E 3", icon: "◐" },
    { id: "sd", name: "Stable Diffusion", icon: "◑" },
    { id: "comfyui", name: "ComfyUI", icon: "⬢" },
    { id: "sora", name: "Sora / Runway", icon: "▶" },
  ],
  Other: [
    { id: "elevenlabs", name: "ElevenLabs", icon: "♫" },
    { id: "zapier", name: "Zapier / Make / n8n", icon: "⇄" },
    { id: "ollama", name: "Ollama (local)", icon: "⊡" },
  ],
};

const TEMPLATES = [
  { id: "auto", name: "Auto-detect", desc: "Let Prompt Master choose the best template" },
  { id: "rtf", name: "RTF", desc: "Simple one-shot tasks" },
  { id: "costar", name: "CO-STAR", desc: "Professional docs & business writing" },
  { id: "risen", name: "RISEN", desc: "Complex multi-step projects" },
  { id: "crispe", name: "CRISPE", desc: "Creative & brand voice work" },
  { id: "cot", name: "Chain of Thought", desc: "Logic, math, debugging" },
  { id: "fewshot", name: "Few-Shot", desc: "Pattern replication with examples" },
  { id: "filescope", name: "File-Scope", desc: "IDE code editing (Cursor, Copilot)" },
  { id: "react-stop", name: "ReAct + Stop", desc: "Autonomous agents (Claude Code, Devin)" },
  { id: "visual", name: "Visual Descriptor", desc: "Image / video generation" },
  { id: "decompiler", name: "Decompiler", desc: "Break down or adapt existing prompts" },
];

/* ─── System Prompt (Prompt Master v1.4 knowledge) ─── */

const SYSTEM_PROMPT = `You are Prompt Master — an elite prompt engineer. You take the user's rough idea, identify the target AI tool, and output a single production-ready prompt optimized for that specific tool.

HARD RULES:
- Output ONLY the prompt block ready to paste. No explanation unless asked.
- After the prompt block, output exactly one line: target tool + template type used + approximate token count.
- Then one sentence strategy note.
- NOTHING else.
- NEVER embed fabrication-prone techniques (Mixture of Experts, Tree of Thought, Graph of Thought, Universal Self-Consistency, prompt chaining as layered technique).
- NEVER add Chain of Thought to reasoning-native models (o1, o3, DeepSeek-R1, Qwen3 thinking mode).
- Place the most critical constraints in the first 30% of the generated prompt.
- Every sentence must be load-bearing. No vague adjectives. Format explicit. Length stated. Scope bounded.

TOOL-SPECIFIC ROUTING:
- Claude: XML tags for structure, explicit format, provide WHY not just WHAT. Add "Keep solutions minimal" for coding.
- ChatGPT/GPT-4o: Strong role assignment, numbered steps, numeric constraints, "Skip preamble. No caveats."
- Gemini: Leverage long context, add citation grounding, explicit format locks.
- o1/o3/DeepSeek-R1: SHORT clean instructions ONLY. State goal + success criteria. No CoT. No XML. Under 200 words system prompt.
- Qwen2.5: Role in system prompt, explicit output format/JSON schema, shorter focused prompts.
- Qwen3 thinking: Same as o1. Qwen3 non-thinking: same as Qwen2.5.
- Llama/Mistral: Shorter prompts, simple flat structure, explicit role, avoid complex nesting.
- Perplexity: Specify mode (search/analyze/compare), add citation requirements, grounding constraints.
- Claude Code: Starting state + target state + allowed/forbidden actions + stop conditions + checkpoints. Scope lock mandatory.
- Cursor/Windsurf: File path + function + current behavior + desired change + do-not-touch list + "Done when:" condition.
- Copilot: Exact function signature + docstring + type hints + edge cases in comment.
- Bolt/v0/Lovable: Specify stack, version, what NOT to scaffold, "Do not add auth, dark mode, or unlisted features."
- Devin: Explicit starting/target state, forbidden actions, stop conditions for irreversible actions, filesystem scope.
- Antigravity: Task-based outcomes, artifact requests, browser verification steps, autonomy level.
- Midjourney: Comma-separated descriptors, subject first, style/mood/lighting/composition, params at end (--ar --v 6 --style raw).
- DALL-E 3: Prose description, "do not include text in the image unless specified."
- Stable Diffusion: (word:weight) syntax, CFG 7-12, negative prompt mandatory, steps 20-30.
- ComfyUI: Separate Positive and Negative prompt blocks. Ask for checkpoint model.
- Sora/Runway: Camera movement + subject + duration + mood + cut style.
- ElevenLabs: Emotion + pacing + emphasis markers + speech rate. SSML-like markers.
- Zapier/Make/n8n: Trigger app + event → action app + action + field mapping, step by step.
- Ollama: Ask which model. System prompt via Modelfile SYSTEM. Shorter prompts. Specify temperature.

TEMPLATES (use the best fit or what the user requests):
- RTF: Role, Task, Format — fast one-shot.
- CO-STAR: Context, Objective, Style, Tone, Audience, Response — professional docs.
- RISEN: Role, Instructions, Steps, End Goal, Narrowing — complex multi-step.
- CRISPE: Capacity, Role, Insight, Statement, Personality, Experiment — creative work.
- Chain of Thought: For logic/math/debug on standard reasoning models ONLY.
- Few-Shot: 2-5 examples in <examples> tags for format-critical output.
- File-Scope: For IDE AI — file path, function, current/desired behavior, do-not-touch, done-when.
- ReAct + Stop: For agents — objective, starting/target state, allowed/forbidden actions, stop conditions, checkpoints.
- Visual Descriptor: Subject, action, setting, style, mood, lighting, color, composition, aspect ratio, negatives.
- Decompiler: Break down / adapt / simplify / split existing prompts.

DIAGNOSTIC CHECKLIST (fix silently):
- Vague task verb → precise operation
- Two tasks in one → split into Prompt 1 and Prompt 2
- No success criteria → derive binary pass/fail
- No output format → derive from task and add format lock
- Implicit length → add word/sentence count
- No role for complex tasks → add domain expert identity
- No file boundaries for IDE AI → add scope lock
- No stop conditions for agents → add checkpoint + human review triggers
- CoT on reasoning models → REMOVE IT

The user will tell you the target tool and what they want. Build the prompt.`;

/* ─── Subcomponents ─── */

function TypingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 3, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "var(--accent)",
            animation: `bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
          }}
        />
      ))}
    </span>
  );
}

function ApiKeyModal({ onSave }) {
  const [key, setKey] = useState("");
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSave = () => {
    const trimmed = key.trim();
    if (trimmed.startsWith("sk-ant-")) onSave(trimmed);
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "rgba(5,5,10,0.92)", backdropFilter: "blur(20px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 24,
    }}>
      <div style={{
        maxWidth: 460, width: "100%", background: "var(--surface)",
        border: "1px solid var(--border)", borderRadius: 14, padding: "36px 32px",
        animation: "fadeUp 0.4s ease",
      }}>
        <div style={{
          fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase",
          color: "var(--accent)", marginBottom: 8, opacity: 0.8,
        }}>SETUP</div>
        <h2 style={{
          fontFamily: "'Instrument Serif', Georgia, serif",
          fontSize: 26, fontWeight: 400, color: "#f0ede6", marginBottom: 10,
        }}>Connect your API key</h2>
        <p style={{
          fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginBottom: 24,
        }}>
          Prompt Master calls Claude's API to generate prompts. Your key stays
          in your browser and is never sent anywhere except Anthropic's API.
        </p>

        <input
          ref={inputRef}
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          placeholder="sk-ant-api03-..."
          style={{
            width: "100%", padding: "12px 16px", background: "#0d0d18",
            border: "1px solid var(--border)", borderRadius: 8,
            color: "#e8e4dc", fontSize: 13, fontFamily: "inherit",
            marginBottom: 16,
          }}
        />

        <button onClick={handleSave} disabled={!key.trim().startsWith("sk-ant-")} style={{
          width: "100%", padding: "12px 20px",
          background: key.trim().startsWith("sk-ant-")
            ? "linear-gradient(135deg, #a78bfa 0%, #7c5ce0 100%)"
            : "var(--surface2)",
          color: key.trim().startsWith("sk-ant-") ? "#0a0a0f" : "var(--muted)",
          border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
          fontFamily: "inherit", cursor: key.trim().startsWith("sk-ant-") ? "pointer" : "not-allowed",
          transition: "all 0.2s",
        }}>Save & Start Building</button>

        <p style={{
          fontSize: 10.5, color: "var(--muted)", marginTop: 14,
          textAlign: "center", lineHeight: 1.5, opacity: 0.6,
        }}>
          Get a key at{" "}
          <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer"
            style={{ color: "var(--accent)", textDecoration: "none" }}>
            console.anthropic.com
          </a>
        </p>
      </div>
    </div>
  );
}

/* ─── Main App ─── */

export default function App() {
  const [apiKey, setApiKey] = useState(() => {
    try { return localStorage.getItem("pm_api_key") || ""; } catch { return ""; }
  });
  const [selectedTool, setSelectedTool] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState("auto");
  const [userGoal, setUserGoal] = useState("");
  const [extraContext, setExtraContext] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("pm_history");
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [activeTab, setActiveTab] = useState("build");
  const outputRef = useRef(null);
  const textareaRef = useRef(null);

  // Persist history
  useEffect(() => {
    try { localStorage.setItem("pm_history", JSON.stringify(history)); } catch {}
  }, [history]);

  useEffect(() => {
    if (generatedPrompt && outputRef.current) {
      outputRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [generatedPrompt]);

  const handleSaveKey = (key) => {
    setApiKey(key);
    try { localStorage.setItem("pm_api_key", key); } catch {}
  };

  const getToolName = useCallback((id) => {
    for (const cat of Object.values(TOOL_CATEGORIES)) {
      const found = cat.find((t) => t.id === id);
      if (found) return found.name;
    }
    return id;
  }, []);

  const generatePrompt = async () => {
    if (!selectedTool) { setError("Pick a target tool first."); return; }
    if (!userGoal.trim()) { setError("Describe what you want the prompt to do."); return; }
    setError("");
    setIsGenerating(true);
    setGeneratedPrompt("");

    const toolName = getToolName(selectedTool);
    const templateHint =
      selectedTemplate !== "auto"
        ? `\nUse the ${TEMPLATES.find((t) => t.id === selectedTemplate)?.name} template.`
        : "";
    const contextBlock = extraContext.trim()
      ? `\nAdditional context: ${extraContext.trim()}`
      : "";

    const userMessage = `Target tool: ${toolName}${templateHint}\n\nWhat I need: ${userGoal.trim()}${contextBlock}`;

    try {
      // In dev (Vite proxy), use /api/anthropic. In production, direct call.
      const apiUrl = "https://api.anthropic.com/v1/messages";

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 1500,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userMessage }],
        }),
      });

      if (response.status === 401) {
        setApiKey("");
        try { localStorage.removeItem("pm_api_key"); } catch {}
        throw new Error("Invalid API key. Please re-enter your key.");
      }
      if (!response.ok) throw new Error(`API error: ${response.status}`);

      const data = await response.json();
      const text =
        data.content?.map((b) => b.text || "").join("\n") || "No response received.";
      setGeneratedPrompt(text);
      setHistory((prev) => [
        {
          tool: toolName,
          goal: userGoal.trim(),
          prompt: text,
          template: selectedTemplate,
          time: new Date().toLocaleString(),
        },
        ...prev.slice(0, 49),
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    const lines = generatedPrompt.split("\n");
    let promptOnly = generatedPrompt;
    const lastFewLines = lines.slice(-4);
    const metaIdx = lastFewLines.findIndex((l) =>
      /^(Target|Tool|Template|Strategy|token|\*\*Target)/i.test(l.trim())
    );
    if (metaIdx >= 0) {
      promptOnly = lines.slice(0, lines.length - (4 - metaIdx)).join("\n").trim();
    }
    navigator.clipboard.writeText(promptOnly);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearHistory = () => {
    setHistory([]);
    try { localStorage.removeItem("pm_history"); } catch {}
  };

  /* ─── Render ─── */

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#e8e4dc",
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* API Key Gate */}
      {!apiKey && <ApiKeyModal onSave={handleSaveKey} />}

      {/* Ambient glow */}
      <div style={{
        position: "fixed", top: "-30%", left: "-10%", width: "50%", height: "60%",
        background: "radial-gradient(ellipse, rgba(120,80,255,0.06) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: "-20%", right: "-10%", width: "45%", height: "55%",
        background: "radial-gradient(ellipse, rgba(255,120,50,0.04) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <style>{`
        :root { --accent: #a78bfa; --accent2: #f97316; --surface: #141420; --surface2: #1c1c2e; --border: #2a2a3e; --muted: #6b6b80; }
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #0a0a0f; }
        ::selection { background: var(--accent); color: #0a0a0f; }
        textarea:focus, input:focus { outline: none; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes bounce { 0%,60%,100% { transform: translateY(0); opacity:0.4; } 30% { transform: translateY(-6px); opacity:1; } }
        @keyframes slideIn { from { opacity:0; transform:translateX(-8px); } to { opacity:1; transform:translateX(0); } }
      `}</style>

      <div style={{
        maxWidth: 780, margin: "0 auto", padding: "40px 24px 80px",
        position: "relative", zIndex: 1,
      }}>
        {/* Header */}
        <header style={{ marginBottom: 48, animation: "fadeUp 0.6s ease" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{
                fontSize: 11, fontWeight: 600, letterSpacing: 3, textTransform: "uppercase",
                color: "var(--accent)", opacity: 0.8,
              }}>PROMPT MASTER</span>
              <span style={{
                fontSize: 9, padding: "2px 7px", borderRadius: 3,
                background: "rgba(167,139,250,0.15)", color: "var(--accent)", fontWeight: 500,
              }}>v1.4</span>
            </div>
            {apiKey && (
              <button
                onClick={() => { setApiKey(""); try { localStorage.removeItem("pm_api_key"); } catch {} }}
                style={{
                  background: "none", border: "1px solid var(--border)", borderRadius: 5,
                  color: "var(--muted)", fontSize: 10, fontFamily: "inherit", cursor: "pointer",
                  padding: "4px 10px",
                }}
                title="Change API key"
              >
                ● Connected
              </button>
            )}
          </div>
          <h1 style={{
            fontFamily: "'Instrument Serif', Georgia, serif",
            fontSize: 38, fontWeight: 400, lineHeight: 1.15,
            color: "#f0ede6", letterSpacing: -0.5,
          }}>
            Build prompts that work<br />
            <span style={{ fontStyle: "italic", color: "var(--accent)" }}>on the first try.</span>
          </h1>
          <p style={{ fontSize: 12.5, color: "var(--muted)", marginTop: 10, lineHeight: 1.6, maxWidth: 520 }}>
            Select your target tool. Describe what you want. Get a production-ready prompt
            optimized for that tool's specific behavior — zero re-prompts needed.
          </p>
        </header>

        {/* Tab bar */}
        <div style={{ display: "flex", gap: 0, marginBottom: 32, borderBottom: "1px solid var(--border)" }}>
          {[
            { id: "build", label: "Build" },
            { id: "history", label: `History${history.length ? ` (${history.length})` : ""}` },
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
              background: "none", border: "none",
              color: activeTab === tab.id ? "var(--accent)" : "var(--muted)",
              fontSize: 12, fontWeight: 500, fontFamily: "inherit", cursor: "pointer",
              padding: "8px 18px",
              borderBottom: activeTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
              transition: "all 0.2s",
            }}>{tab.label}</button>
          ))}
        </div>

        {activeTab === "build" ? (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {/* STEP 1: Tool Selection */}
            <section style={{ marginBottom: 36 }}>
              <label style={{
                display: "flex", alignItems: "center", gap: 8, fontSize: 11,
                fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase",
                color: "var(--muted)", marginBottom: 14,
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 10,
                  background: selectedTool ? "var(--accent)" : "var(--surface2)",
                  color: selectedTool ? "#0a0a0f" : "var(--muted)", fontWeight: 700, flexShrink: 0,
                }}>1</span>
                Target Tool
              </label>
              {Object.entries(TOOL_CATEGORIES).map(([category, tools]) => (
                <div key={category} style={{ marginBottom: 12 }}>
                  <span style={{
                    fontSize: 10, color: "var(--muted)", fontWeight: 500,
                    letterSpacing: 0.5, display: "block", marginBottom: 6, paddingLeft: 2,
                  }}>{category}</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {tools.map((tool) => (
                      <button key={tool.id} onClick={() => { setSelectedTool(tool.id); setError(""); }} style={{
                        background: selectedTool === tool.id ? "var(--accent)" : "var(--surface2)",
                        color: selectedTool === tool.id ? "#0a0a0f" : "#c0bdb5",
                        border: `1px solid ${selectedTool === tool.id ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: 6, padding: "6px 12px", fontSize: 11.5,
                        fontFamily: "inherit", fontWeight: selectedTool === tool.id ? 600 : 400,
                        cursor: "pointer", transition: "all 0.15s",
                        display: "flex", alignItems: "center", gap: 5,
                      }}>
                        <span style={{ fontSize: 13 }}>{tool.icon}</span>
                        {tool.name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </section>

            {/* STEP 2: Describe Goal */}
            <section style={{ marginBottom: 28 }}>
              <label style={{
                display: "flex", alignItems: "center", gap: 8, fontSize: 11,
                fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase",
                color: "var(--muted)", marginBottom: 10,
              }}>
                <span style={{
                  width: 18, height: 18, borderRadius: "50%", display: "flex",
                  alignItems: "center", justifyContent: "center", fontSize: 10,
                  background: userGoal.trim() ? "var(--accent)" : "var(--surface2)",
                  color: userGoal.trim() ? "#0a0a0f" : "var(--muted)", fontWeight: 700, flexShrink: 0,
                }}>2</span>
                What do you need?
              </label>
              <textarea
                ref={textareaRef}
                value={userGoal}
                onChange={(e) => { setUserGoal(e.target.value); setError(""); }}
                placeholder="e.g. Write a cold email to a VP of Engineering about our API monitoring tool that gets a reply..."
                rows={4}
                style={{
                  width: "100%", background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 8, padding: "14px 16px", color: "#e8e4dc", fontSize: 13,
                  fontFamily: "inherit", lineHeight: 1.6, resize: "vertical",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--accent)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </section>

            {/* Advanced options */}
            <div style={{ marginBottom: 28 }}>
              <button onClick={() => setShowAdvanced(!showAdvanced)} style={{
                background: "none", border: "none", color: "var(--muted)", fontSize: 11,
                fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              }}>
                <span style={{
                  transform: showAdvanced ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 0.2s", display: "inline-block",
                }}>▸</span>
                Advanced Options
              </button>

              {showAdvanced && (
                <div style={{
                  marginTop: 14, padding: 18, background: "var(--surface)",
                  border: "1px solid var(--border)", borderRadius: 8,
                  animation: "fadeUp 0.3s ease",
                }}>
                  <label style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
                    color: "var(--muted)", display: "block", marginBottom: 8,
                  }}>Template Override</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 16 }}>
                    {TEMPLATES.map((t) => (
                      <button key={t.id} onClick={() => setSelectedTemplate(t.id)} style={{
                        background: selectedTemplate === t.id ? "rgba(167,139,250,0.15)" : "transparent",
                        color: selectedTemplate === t.id ? "var(--accent)" : "var(--muted)",
                        border: `1px solid ${selectedTemplate === t.id ? "rgba(167,139,250,0.3)" : "var(--border)"}`,
                        borderRadius: 5, padding: "4px 10px", fontSize: 10.5,
                        fontFamily: "inherit", cursor: "pointer", transition: "all 0.15s",
                      }} title={t.desc}>{t.name}</button>
                    ))}
                  </div>

                  <label style={{
                    fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
                    color: "var(--muted)", display: "block", marginBottom: 8,
                  }}>Extra Context</label>
                  <textarea
                    value={extraContext}
                    onChange={(e) => setExtraContext(e.target.value)}
                    placeholder="Prior decisions, what you've tried, audience info, constraints..."
                    rows={3}
                    style={{
                      width: "100%", background: "#0d0d18", border: "1px solid var(--border)",
                      borderRadius: 6, padding: "10px 14px", color: "#c0bdb5", fontSize: 12,
                      fontFamily: "inherit", lineHeight: 1.5, resize: "vertical",
                    }}
                  />
                </div>
              )}
            </div>

            {/* Generate button */}
            <button onClick={generatePrompt} disabled={isGenerating} style={{
              width: "100%", padding: "14px 24px",
              background: isGenerating
                ? "var(--surface2)"
                : "linear-gradient(135deg, #a78bfa 0%, #7c5ce0 100%)",
              color: isGenerating ? "var(--muted)" : "#0a0a0f",
              border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600,
              fontFamily: "inherit", cursor: isGenerating ? "wait" : "pointer",
              transition: "all 0.2s", letterSpacing: 0.3,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}>
              {isGenerating ? <>Generating <TypingDots /></> : <>⚡ Generate Prompt</>}
            </button>

            {/* Error */}
            {error && (
              <div style={{
                marginTop: 12, padding: "10px 14px", borderRadius: 6,
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
                color: "#f87171", fontSize: 12,
              }}>{error}</div>
            )}

            {/* Output */}
            {generatedPrompt && (
              <div ref={outputRef} style={{ marginTop: 32, animation: "fadeUp 0.5s ease" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase",
                    color: "var(--accent2)",
                  }}>✦ Output</span>
                  <button onClick={copyToClipboard} style={{
                    background: copied ? "rgba(34,197,94,0.15)" : "var(--surface2)",
                    color: copied ? "#4ade80" : "var(--muted)",
                    border: `1px solid ${copied ? "rgba(34,197,94,0.3)" : "var(--border)"}`,
                    borderRadius: 5, padding: "5px 12px", fontSize: 11,
                    fontFamily: "inherit", cursor: "pointer", transition: "all 0.2s",
                  }}>{copied ? "✓ Copied" : "Copy prompt"}</button>
                </div>

                <div style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderRadius: 10, padding: "20px 22px", position: "relative", overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0, width: 3, height: "100%",
                    background: "linear-gradient(180deg, var(--accent) 0%, var(--accent2) 100%)",
                    borderRadius: "3px 0 0 3px",
                  }} />
                  <pre style={{
                    whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12.5,
                    lineHeight: 1.7, color: "#dbd7ce", fontFamily: "inherit",
                    margin: 0, paddingLeft: 10,
                  }}>{generatedPrompt}</pre>
                </div>

                <p style={{
                  marginTop: 12, fontSize: 11, color: "var(--muted)", fontStyle: "italic",
                  textAlign: "center",
                }}>
                  Paste this directly into {getToolName(selectedTool)}. Zero re-prompts.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* ─── History Tab ─── */
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            {history.length > 0 && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
                <button onClick={clearHistory} style={{
                  background: "none", border: "1px solid var(--border)", borderRadius: 5,
                  color: "var(--muted)", fontSize: 10, fontFamily: "inherit", cursor: "pointer",
                  padding: "4px 10px", transition: "all 0.2s",
                }}>Clear all</button>
              </div>
            )}
            {history.length === 0 ? (
              <div style={{
                textAlign: "center", padding: "60px 20px", color: "var(--muted)", fontSize: 13,
              }}>No prompts generated yet. Go build something.</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {history.map((item, i) => (
                  <div key={i} style={{
                    background: "var(--surface)", border: "1px solid var(--border)",
                    borderRadius: 8, padding: "14px 18px", cursor: "pointer",
                    animation: `slideIn 0.3s ease ${i * 0.03}s both`,
                    transition: "border-color 0.2s",
                  }}
                  onClick={() => { setGeneratedPrompt(item.prompt); setActiveTab("build"); }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border)")}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)" }}>
                        {item.tool}
                      </span>
                      <span style={{ fontSize: 10, color: "var(--muted)" }}>{item.time}</span>
                    </div>
                    <p style={{
                      fontSize: 12, color: "#c0bdb5", lineHeight: 1.5,
                      overflow: "hidden", textOverflow: "ellipsis",
                      display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>{item.goal}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer style={{
          marginTop: 64, textAlign: "center", fontSize: 10,
          color: "var(--muted)", opacity: 0.5, lineHeight: 1.8,
        }}>
          Prompt Master Workbench v1.4 — Built by Wonseok
          <br />
          Powered by Claude Sonnet × Prompt Master skill system
        </footer>
      </div>
    </div>
  );
}
