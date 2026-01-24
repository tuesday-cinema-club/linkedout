# LinkedIn Cybersecurity Bot

An intelligent, automated LinkedIn posting bot that generates and publishes professional cybersecurity content. Built with AI agents (Gemini/Claude), supports both cloud and local GPU image generation, and includes a web-based configuration interface.

## Features

- **AI-Powered Content Generation**: Uses Gemini or Claude to research and write professional cybersecurity articles
- **Dual Posting Schedule**:
  - **Daily Short Posts** (150-300 words): Breaking cybersecurity news, CVEs, and updates
  - **Weekly Long Articles** (600-1000 words): In-depth analysis and thought leadership
- **Flexible Image Generation**:
  - Cloud-based: Gemini Flash Image API
  - Local GPU: Stable Diffusion (AUTOMATIC1111 WebUI)
- **Human-Like Writing**: Professional analyst style with no emojis, no AI markers
- **Web-Based Configuration**: Easy settings management through browser UI
- **Docker Support**: Containerized for easy deployment and GitHub sync
- **Automated Posting**: Schedule posts or generate on-demand

## Architecture

```
┌─────────────────┐
│   Web UI        │  ← Configuration & Manual Posting
│  (React/Vite)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Agent System   │
│                 │
│  • Manager      │  ← Orchestrates workflow
│  • Researcher   │  ← Finds cyber news (Google Search)
│  • Copywriter   │  ← Writes content (Gemini/Claude)
│  • Designer     │  ← Generates images (Cloud/Local)
│  • Publisher    │  ← Reviews & posts to LinkedIn
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LinkedIn API   │  ← UGC Posting with images
└─────────────────┘
```

## Quick Start

### Prerequisites

- Node.js 20+
- Gemini API key OR Claude API key
- LinkedIn OAuth access token
- (Optional) NVIDIA GPU + Stable Diffusion WebUI for local image generation

### 1. Clone and Install

```bash
git clone <your-repo>
cd linkedout-vbunny
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
VITE_GEMINI_API_KEY=your-gemini-key
VITE_CLAUDE_API_KEY=your-claude-key
VITE_LINKEDIN_ACCESS_TOKEN=your-linkedin-token
VITE_LINKEDIN_PERSON_URN=urn:li:person:XXXXXXX
```

See [.env.example](./.env.example) for detailed setup instructions.

### 3. Run Locally

```bash
# Start both frontend and backend
npm start

# Or run separately:
npm run dev    # Frontend (port 3000)
npm run proxy  # Backend (port 4000)
```

Access the UI at [http://localhost:3000](http://localhost:3000)

### 4. Docker Deployment

```bash
# Build and run with docker-compose
docker-compose up -d

# Or build manually
docker build -t linkedin-cyber-bot .
docker run -p 3000:3000 -p 4000:4000 --env-file .env linkedin-cyber-bot
```

## Configuration

### Web UI Configuration

1. Open [http://localhost:3000](http://localhost:3000)
2. Click the **Settings** button (top right)
3. Configure:
   - **AI Provider**: Gemini (with web search) or Claude (better writing)
   - **Image Generation**: Cloud (Gemini) or Local GPU (Stable Diffusion)
   - **Posting Schedule**: Enable daily/weekly auto-posts, set times
   - **API Keys**: Add/update credentials (saved to localStorage + .env)

### Posting Schedule

**Daily Short Posts** (150-300 words):
- Breaking cybersecurity news
- Recent CVE disclosures
- Threat intelligence updates
- Time: Configurable (default: 9:00 AM)

**Weekly Long Articles** (600-1000 words):
- In-depth threat analysis
- Security tool reviews
- Compliance updates
- Industry trends
- Day/Time: Configurable (default: Monday 10:00 AM)

### Writing Style

The bot generates content in a **professional analyst** style:
- Technical accuracy with accessible explanations
- Cites CVE numbers, MITRE ATT&CK techniques, vendor advisories
- Includes impact analysis and actionable recommendations
- NO emojis, NO marketing hype, NO generic buzzwords
- Looks human-written for career/networking purposes

## Getting LinkedIn Credentials

### 1. Create LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click **Create App**
3. Fill in details (name, company, logo, etc.)
4. Add **Sign In with LinkedIn using OpenID Connect** product
5. Add **Share on LinkedIn** product (requires LinkedIn review)

### 2. Get Access Token

**Method 1: OAuth 2.0 Tool (Quick)**
1. Go to [LinkedIn OAuth Tools](https://www.linkedin.com/developers/tools/oauth)
2. Select your app
3. Request scopes: `openid`, `profile`, `email`, `w_member_social`
4. Click **Request Access Token**
5. Copy the token

**Method 2: Manual OAuth Flow (Production)**
```bash
# 1. Authorization URL
https://www.linkedin.com/oauth/v2/authorization?
  response_type=code
  &client_id=YOUR_CLIENT_ID
  &redirect_uri=YOUR_REDIRECT_URI
  &scope=openid%20profile%20email%20w_member_social

# 2. Exchange code for token
curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
  -d grant_type=authorization_code \
  -d code=AUTHORIZATION_CODE \
  -d client_id=YOUR_CLIENT_ID \
  -d client_secret=YOUR_CLIENT_SECRET \
  -d redirect_uri=YOUR_REDIRECT_URI
```

### 3. Get Person URN

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     https://api.linkedin.com/v2/userinfo
```

Copy the `sub` field (format: `urn:li:person:XXXXXXX`)

## Local GPU Image Generation (Optional)

For free, GPU-accelerated image generation:

### 1. Install Stable Diffusion WebUI

```bash
# Clone AUTOMATIC1111 WebUI
git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui
cd stable-diffusion-webui

# Download a model (Stable Diffusion 1.5 recommended)
# Place in models/Stable-diffusion/

# Run with API enabled
./webui.sh --api --listen
```

### 2. Configure Bot

In `.env` or Web UI settings:
```env
VITE_SD_API_URL=http://localhost:7860
BOT_IMAGE_PROVIDER=local-sd
```

### 3. Verify

The Web UI will show "Local GPU ✓" if Stable Diffusion is detected.

## Usage

### Manual Posting

1. Open Web UI at [http://localhost:3000](http://localhost:3000)
2. Type a topic or let the AI choose:
   - "Write about the latest Log4Shell developments"
   - "Analyze the MOVEit vulnerability impact"
   - "Generate a daily update" (AI picks recent news)
3. Watch the agent workflow:
   - **Researcher**: Finds recent cybersecurity news
   - **Copywriter**: Writes professional analysis
   - **Designer**: Creates cover image
   - **Publisher**: Reviews for quality
4. Preview and publish to LinkedIn

### Automated Posting

Enable in Web UI settings:
- **Daily Posts**: Automatically generate and post short updates
- **Weekly Articles**: Automatically generate and post long-form content
- Posts are published at configured times
- Bot avoids duplicate topics within a session

### Content Categories

The bot can write about:
- Zero-day vulnerabilities & CVEs
- Data breaches & incident response
- Threat intelligence & APT groups
- Security tools & techniques
- Compliance (GDPR, SOC2, HIPAA)
- Cloud security (AWS, Azure, GCP)
- Application security (SAST, DAST)
- Network security & firewalls
- Endpoint detection & response (EDR)
- Identity & access management (IAM)
- Cryptography & PKI
- DevSecOps & CI/CD security
- Malware analysis & reverse engineering
- Bug bounty programs
- Ransomware & extortion
- Supply chain attacks
- AI/ML security
- IoT & OT security

## Deployment

### GitHub + Docker Workflow

```bash
# 1. Push code to GitHub
git add .
git commit -m "Update bot configuration"
git push origin main

# 2. Pull on server
git pull origin main

# 3. Rebuild and restart Docker container
docker-compose down
docker-compose up -d --build

# 4. View logs
docker-compose logs -f linkedin-bot
```

### Environment Variables (Docker)

All configuration can be done via environment variables - see [.env.example](./.env.example) for full list.

## Troubleshooting

### "Gemini API not initialized"
- Check `VITE_GEMINI_API_KEY` in .env
- Verify key at https://aistudio.google.com/apikey

### "Claude API not initialized"
- Check `VITE_CLAUDE_API_KEY` in .env
- Verify key at https://console.anthropic.com/

### "LinkedIn API error 401"
- Access token expired - regenerate using OAuth flow
- Token missing `w_member_social` scope

### "LinkedIn API error 403"
- Your app may need LinkedIn review for posting permissions
- Check app status at https://www.linkedin.com/developers/apps

### "Local GPU not detected"
- Ensure Stable Diffusion WebUI is running: `./webui.sh --api --listen`
- Check URL in settings matches SD API (default: http://localhost:7860)
- Test manually: `curl http://localhost:7860/sdapi/v1/sd-models`

## License

MIT License

## Security

- **Never commit `.env` file** - it contains sensitive credentials
- Use environment variables in production
- Rotate LinkedIn tokens periodically
- Monitor API usage to avoid rate limits
- Review generated content before auto-posting sensitive topics

---

**Built for cybersecurity professionals to maintain an active LinkedIn presence with high-quality, AI-generated content.**
