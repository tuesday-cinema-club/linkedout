# 🔗 LinkedOut: The Autonomous Content Engine

<div align="center">
  <p align="center">
    <strong>Transforming raw research into high-impact professional content.</strong>
  </p>
</div>

---

## 🚀 Overview

**LinkedOut** is a state-of-the-art agentic workflow designed to bridge the gap between deep research and social media presence. Built with a focus on high-fidelity "agentic" interactions, it allows users to trigger research tasks that are automatically synthesized into polished LinkedIn posts, complete with AI-generated image suggestions and optimized formatting.

## ✨ Features

- **🧠 Multi-Model Intelligence**: Leverages Google Gemini and Anthropic Claude for deep contextual research and creative writing.
- **🎨 Glassmorphic UI**: A premium, terminal-inspired professional dashboard for managing your content pipeline.
- **🔍 Agentic Research**: Automatically fetches movie data, box office numbers, and production trivia.
- **📪 One-Click Publishing**: Integrated OAuth flow for direct-to-LinkedIn posting.
- **🖼️ Visual Storytelling**: Automatic generation of visual metadata and layout previews.

## 🛠️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- A LinkedIn Developer App (for OAuth/API access)

### 1. Clone & Install
```bash
git clone https://github.com/tuesday-cinema-club/linkedout
cd linkedout
npm install
```

### 2. Configure Environment
Create a `.env` file in the root directory (use the provided clean template):

```env
VITE_GEMINI_API_KEY=your_gemini_key
VITE_LINKEDIN_ACCESS_TOKEN=your_token
VITE_LINKEDIN_PERSON_URN=urn:li:person:your_urn
```

### 3. Launch
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend Proxy
npm run proxy
```

---

## 📅 Roadmap (Next Steps)

### 🌍 Platform Scaling
- [ ] **Omni-Channel Support**: Scale the engine to support **Twitter/X**, **Facebook**, and **Instagram**.
- [ ] **Cross-Posting Logic**: Automatic adaptation of content length and style for each platform.

### 🎬 Multimedia Evolution
- [ ] **Video Support**: Move beyond static images. Support for uploading video files and auto-generating video captions.
- [ ] **AI Video Generation**: Integration with Sora/Runway/Pika for generating short-form video clips from text prompts.

### 🏠 Self-Hosted Intelligence
- [ ] **ComfyUI Integration**: Option to route image and video generation through **self-hosted ComfyUI instances**.
- [ ] **Local LLM Support**: Support for local models (Llama 3, Mistral) via Ollama/vLLM for full privacy and reduced costs.

---

## 🏗️ Architecture

- **Frontend**: React + Vite + Tailwind CSS
- **Backend**: Node.js + Express (handling OAuth and Proxy services)
- **AI**: Gemini Pro API / Claude 3.5
- **Deployment**: Dockerized with multi-stage builds.

---

<div align="center">
  <sub>Built by the Tuesday Cinema Club.</sub>
</div>
