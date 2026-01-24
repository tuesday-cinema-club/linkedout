# Windows Setup Guide - LinkedIn Cybersecurity Bot

This guide will get you up and running on Windows in under 10 minutes.

## Prerequisites

1. **Node.js 20+** - Download from https://nodejs.org/
2. **Git** (optional) - Download from https://git-scm.com/

## Step 1: Install Dependencies (2 minutes)

Open PowerShell or Command Prompt in the project folder:

```powershell
npm install
```

This installs all required packages including:
- Gemini AI SDK
- Claude AI SDK (optional)
- LinkedIn API client
- React frontend

## Step 2: Get Your API Keys (5 minutes)

### Gemini API Key (REQUIRED)

1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key

### LinkedIn Credentials (REQUIRED)

**Quick Method:**
1. Go to https://www.linkedin.com/developers/apps
2. Create a new app (fill in basic info)
3. Go to https://www.linkedin.com/developers/tools/oauth
4. Select your app
5. Scopes: `openid`, `profile`, `email`, `w_member_social`
6. Click "Request Access Token"
7. Copy the token

**Get Person URN:**
```powershell
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" https://api.linkedin.com/v2/userinfo
```
Copy the `sub` field.

### Claude API Key (OPTIONAL - for better writing)

1. Go to https://console.anthropic.com/
2. Create API key
3. Copy the key

## Step 3: Configure Environment (1 minute)

Copy the example env file:

```powershell
copy .env.example .env
```

Edit `.env` in Notepad or VSCode and add your keys:

```env
VITE_GEMINI_API_KEY=your-gemini-key-here
VITE_LINKEDIN_ACCESS_TOKEN=your-linkedin-token
VITE_LINKEDIN_PERSON_URN=urn:li:person:XXXXXXX
```

**IMPORTANT:** Make sure there are NO spaces around the `=` sign!

## Step 4: Run the Bot (30 seconds)

```powershell
npm start
```

This starts both servers:
- ✅ Backend (port 4000)
- ✅ Frontend (port 3000)

Open your browser to: **http://localhost:3000**

## Step 5: Generate Your First Post (1 minute)

### Option A: Quick Daily Update
1. Click "Daily Update" button
2. Wait for AI to research + write (30-60 seconds)
3. Review the preview on the right
4. Click "Publish to LinkedIn"

### Option B: Weekly Analysis
1. Click "Weekly Article" button
2. Wait for AI to generate (60-90 seconds)
3. Review the long-form article
4. Click "Publish to LinkedIn"

### Option C: Custom Topic
1. Type in chat: "Write about [specific CVE/breach/topic]"
2. Press Enter
3. Review and publish

## Troubleshooting

### "Cannot find module"
Run: `npm install`

### "Port 3000 already in use"
1. Find and kill the process:
   ```powershell
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```
2. Or change port in `vite.config.ts`

### "Gemini API error"
- Check your `.env` file has the correct key
- Verify NO spaces: `VITE_GEMINI_API_KEY=abc123` (correct)
- Not: `VITE_GEMINI_API_KEY = abc123` (wrong!)

### "LinkedIn 401 error"
- Your token expired (LinkedIn tokens last 60 days)
- Generate a new one: https://www.linkedin.com/developers/tools/oauth

### Frontend won't load
1. Check both servers are running
2. Visit http://localhost:4000/health - should show `{"ok":true}`
3. Check console for errors

## Using with VSCode

1. Open folder in VSCode: `File > Open Folder`
2. Open terminal: `` Ctrl+` ``
3. Run: `npm start`
4. View in browser: http://localhost:3000

### VSCode Extensions (Recommended)

- **ES7+ React/Redux/React-Native snippets** - Code snippets
- **Prettier** - Code formatting
- **TypeScript Vue Plugin (Volar)** - TypeScript support

## Configuration

### Change AI Provider (Gemini ↔ Claude)

1. Click "⚙ Settings" button
2. Select AI Provider: Gemini or Claude
3. Save

### Change Image Generation (Cloud ↔ Local GPU)

1. Click "⚙ Settings"
2. Select Image Gen: Cloud (Gemini) or Local GPU
3. For Local GPU, see "Local GPU Setup" below

### Schedule Auto-Posting

1. Click "⚙ Settings"
2. Enable "Enable automatic posting"
3. Set daily post time (e.g., 9:00 AM)
4. Set weekly post day + time (e.g., Monday 10:00 AM)
5. Save

**Note:** Auto-posting requires bot to be running continuously.

## Local GPU Setup (Optional)

For FREE image generation with your own GPU:

### Requirements
- NVIDIA GPU with 6GB+ VRAM
- Windows 10/11

### Install Stable Diffusion

1. Download: https://github.com/AUTOMATIC1111/stable-diffusion-webui
2. Extract to `C:\stable-diffusion-webui`
3. Run `webui-user.bat` (downloads model ~4GB)
4. Edit `webui-user.bat`, add: `set COMMANDLINE_ARGS=--api --listen`
5. Run `webui-user.bat` again
6. Access: http://localhost:7860

### Configure Bot

1. In bot settings, select "Local GPU" for image generation
2. Bot will auto-detect Stable Diffusion on port 7860

## Docker Setup (Optional)

For deployment or running in a container:

```powershell
# Build image
docker build -t linkedin-cyber-bot .

# Run container
docker run -p 3000:3000 -p 4000:4000 --env-file .env linkedin-cyber-bot

# Or use docker-compose
docker-compose up -d
```

Access at http://localhost:3000

## Daily Workflow

### Morning Routine (Automated)

If auto-posting enabled:
- Bot posts daily update at 9 AM automatically
- Bot posts weekly article on Monday at 10 AM

### Manual Posting

1. Open http://localhost:3000
2. Click "Daily Update" or "Weekly Article"
3. Review content (ALWAYS review before posting!)
4. Click "Publish to LinkedIn"
5. Done!

## Important Notes

### NO Emojis
- Bot is configured to NEVER use emojis
- All content written in professional analyst style
- Looks human-written for job/networking purposes

### Content Quality
- Always review posts before publishing
- Bot generates factual cybersecurity content
- Cites CVE numbers, sources, and provides actionable insights

### API Costs
- **Gemini**: ~$0.05-0.15 per post (includes research + writing + image)
- **Claude**: ~$0.10-0.30 per post (better writing quality)
- **Local GPU**: FREE (after initial setup)

### LinkedIn Rate Limits
- Don't post more than 1x per hour
- Daily posts: 1-2 recommended
- Weekly posts: 1 recommended

## Next Steps

1. ✅ **Test locally** - Generate a few posts, DON'T publish yet
2. ✅ **Review quality** - Make sure writing meets your standards
3. ✅ **Publish first post** - Start with a daily update
4. ✅ **Monitor engagement** - Check LinkedIn for reactions/comments
5. ✅ **Adjust schedule** - Fine-tune posting times based on engagement

## Support

- **Full Documentation**: See [README.md](./README.md)
- **Quick Start**: See [QUICKSTART.md](./QUICKSTART.md)
- **Changes**: See [TRANSFORMATION_SUMMARY.md](./TRANSFORMATION_SUMMARY.md)

---

**You're ready to build your cybersecurity LinkedIn presence! 🔐**

Run `npm start` and open http://localhost:3000 to begin.
