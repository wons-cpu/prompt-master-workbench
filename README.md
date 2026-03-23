# ⚡ Prompt Master Workbench

**An AI-powered prompt engineering tool that generates production-ready prompts optimized for 20+ AI tools.**

Pick a target tool → describe your goal → get a prompt that works on the first try.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)
![Claude API](https://img.shields.io/badge/Claude_API-Sonnet-A78BFA)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Demo

**Select your tool and describe what you need:**

![Prompt Master — Input](./assets/screenshot-input.png)

**Get a production-ready prompt, optimized for that tool:**

![Prompt Master — Output](./assets/screenshot-output.png)

---

## The Problem

Every AI tool behaves differently. A prompt optimized for Claude fails on GPT-4o. Midjourney needs comma-separated descriptors, not prose. Autonomous agents like Devin need explicit stop conditions or they spiral. Most users don't know these differences — they write one generic prompt and wonder why the output is wrong.

## The Solution

Prompt Master Workbench encodes tool-specific optimization rules for **20+ AI platforms** into a single interface. It applies a diagnostic checklist to catch common prompt failures (vague verbs, missing format locks, scope leaks, reasoning technique mismatches) and routes through the correct prompt template — all before the user hits "generate."

The result: a single copyable prompt, optimized for the target tool's architecture and failure modes. Even when a generated prompt isn't exactly what you need, it gives you a strong structural template. You refine from a professional starting point instead of a blank page.

---

## Architecture

```
┌─────────────────────────────────────┐
│         React Frontend (Vite)       │
│  ┌──────────┐  ┌─────────────────┐  │
│  │ Tool Grid │  │ Template Select │  │
│  └─────┬────┘  └───────┬─────────┘  │
│        └───────┬───────┘            │
│          ┌─────▼──────┐             │
│          │  Composer   │             │
│          │  (builds    │             │
│          │  user msg)  │             │
│          └─────┬──────┘             │
└────────────────┼────────────────────┘
                 │ POST /v1/messages
                 ▼
┌─────────────────────────────────────┐
│      Claude Sonnet API              │
│  ┌───────────────────────────────┐  │
│  │  System Prompt (Prompt Master │  │
│  │  v1.4 knowledge base)         │  │
│  │  • Tool routing rules         │  │
│  │  • 11 prompt templates        │  │
│  │  • Diagnostic checklist       │  │
│  │  • Fabrication guardrails     │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Key design decisions:**

- **System prompt as knowledge base.** The entire Prompt Master v1.4 skill — tool-specific routing for Claude, GPT-4o, Gemini, o1/o3, Midjourney, Stable Diffusion, Claude Code, Cursor, Devin, and more — is compiled into a structured system prompt. This means every API call carries full domain knowledge without requiring a database or retrieval layer.

- **Template routing.** The system auto-selects from 11 prompt templates (RTF, CO-STAR, RISEN, CRISPE, Chain of Thought, Few-Shot, File-Scope, ReAct, Visual Descriptor, ComfyUI, Decompiler) based on the tool + task combination, or the user can override manually.

- **Diagnostic pre-processing.** Before generating, the system scans for 6 categories of prompt failure (task, context, format, scope, reasoning, agentic) and silently fixes them — converting vague verbs to precise operations, adding missing format locks, removing Chain of Thought from reasoning-native models, and injecting stop conditions for agents.

- **Fabrication guardrails.** The system hard-blocks techniques that cause fabrication in single-prompt execution: Mixture of Experts, Tree of Thought, Graph of Thought, Universal Self-Consistency, and layered prompt chaining.

---

## Supported Tools

| Category            | Tools                                                                               |
| ------------------- | ----------------------------------------------------------------------------------- |
| **Language Models** | Claude, ChatGPT/GPT-4o, Gemini, o1/o3, DeepSeek-R1, Qwen, Llama/Mistral, Perplexity |
| **Code & Agents**   | Claude Code, Cursor/Windsurf, GitHub Copilot, Bolt/v0/Lovable, Devin, Antigravity   |
| **Image & Video**   | Midjourney, DALL-E 3, Stable Diffusion, ComfyUI, Sora/Runway                        |
| **Other**           | ElevenLabs, Zapier/Make/n8n, Ollama                                                 |

---

## Quick Start

```bash
# Clone
git clone https://github.com/wons-cpu/prompt-master-workbench.git
cd prompt-master-workbench

# Install
npm install

# Run
npm run dev
```

The app opens at `http://localhost:3000`. On first launch, you'll be prompted for your [Anthropic API key](https://console.anthropic.com/settings/keys). The key is stored in your browser's localStorage and is only sent to Anthropic's API.

### Build for Production

```bash
npm run build
npm run preview
```

> **Note:** In production, the app calls the Anthropic API directly using the `anthropic-dangerous-direct-browser-access` header. For a production deployment serving other users, you should add a backend proxy to keep API keys server-side.

---

## How It Works

1. **Select a target tool** from the grid (20+ options across LLMs, code agents, image generators, workflow tools).
2. **Describe your goal** in plain language — what you want the AI to do.
3. _(Optional)_ Open **Advanced Options** to force a specific template or add extra context.
4. **Generate.** The system routes through tool-specific rules, applies the diagnostic checklist, selects the optimal template, and returns a single copyable prompt block.
5. **Paste** the prompt into your target tool. It should work on the first try.

---

## Tech Stack

- **Frontend:** React 18, Vite 6, CSS-in-JS (no external UI library)
- **API:** Anthropic Claude Sonnet via Messages API
- **State:** React hooks + localStorage for persistence
- **Design:** Custom dark theme, JetBrains Mono + Instrument Serif typography, CSS keyframe animations

---

## Project Structure

```
prompt-master-workbench/
├── index.html              # Entry point
├── package.json
├── vite.config.js          # Dev server config
├── assets/                 # Screenshots
├── src/
│   ├── main.jsx            # React mount
│   └── App.jsx             # Full application
├── LICENSE
└── README.md
```

---

## License

MIT — see [LICENSE](./LICENSE).

---

Built by **Wonseok** · Powered by the [Prompt Master](https://github.com/dontbother/prompt-master) skill system × Claude Sonnet
