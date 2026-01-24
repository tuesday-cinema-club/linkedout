# Quick Start Guide - LinkedIn Cybersecurity Bot

Get up and running in 5 minutes!

## Prerequisites

- Node.js 20+ installed
- A Gemini API key (free from Google)
- LinkedIn account

## Step 1: Install Dependencies (1 min)

```bash
npm install
```

## Step 2: Get Your API Keys (2 min)

### Gemini API Key (Required)

1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key

### LinkedIn Credentials (Required)

**Quick Method:**
1. Go to https://www.linkedin.com/developers/apps
2. Create a new app
3. Go to https://www.linkedin.com/developers/tools/oauth
4. Request scopes: `openid`, `profile`, `email`, `w_member_social`
5. Click "Request Access Token"
6. Copy the token

**Get Person URN:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.linkedin.com/v2/userinfo
```
Copy the `sub` field.

## Step 3: Configure Environment (1 min)

```bash
cp .env.example .env
```

Edit `.env` and add your keys:

```env
VITE_GEMINI_API_KEY=your-gemini-api-key-here
VITE_LINKEDIN_ACCESS_TOKEN=your-linkedin-oauth-token
VITE_LINKEDIN_PERSON_URN=urn:li:person:XXXXXXXXX
```

## Step 4: Run the Bot (30 seconds)

```bash
npm start
```

Open http://localhost:3000 in your browser.

## Step 5: Generate Your First Post (1 min)

1. In the web UI, type: **"Write about the latest cybersecurity news"**
2. Watch the agents work:
   - Researcher finds recent news
   - Copywriter creates professional content
   - Designer generates cover image
   - Publisher reviews for quality
3. Click **"Publish to LinkedIn"** when ready

## Done! 🎉

Your bot is now posting professional cybersecurity content to LinkedIn.

## What's Next?

### Enable Automated Posting

1. Click the **Settings** icon (top right)
2. Enable "Enable automatic posting"
3. Configure schedule:
   - **Daily**: Short updates about recent cyber news (9 AM)
   - **Weekly**: Long-form analysis articles (Monday 10 AM)
4. Save settings

The bot will now post automatically!

### Optional: Add Claude for Better Writing

1. Get Claude API key: https://console.anthropic.com/
2. Add to `.env`:
   ```env
   VITE_CLAUDE_API_KEY=your-claude-key
   ```
3. In Settings, select "Claude" as AI provider
4. Enjoy superior writing quality!

### Optional: Use Local GPU for Images

1. Install Stable Diffusion WebUI:
   ```bash
   git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui
   cd stable-diffusion-webui
   ./webui.sh --api --listen
   ```

2. In Settings, select "Local GPU" for image generation
3. Free image generation with your own GPU!

## Common Issues

### "API key not found"
- Make sure `.env` file exists (not `.env.example`)
- Check that keys are on the correct lines with no extra spaces

### "LinkedIn API error"
- Your access token may have expired (they expire after 60 days)
- Regenerate using the OAuth tool above

### "Can't connect to localhost:3000"
- Make sure you ran `npm start` (not just `npm run dev`)
- This starts both frontend AND backend servers

## Tips for Best Results

1. **Review before posting**: Always check the generated content in preview
2. **No emojis**: The bot is configured to write professionally (no AI vibes)
3. **Daily vs Weekly**: Daily posts are 150-300 words, weekly are 600-1000 words
4. **Topics**: Let the AI choose topics, or specify: "Write about [specific CVE/breach/tool]"
5. **Professional tone**: All content is written in analyst style for job networking

## Need Help?

- Full documentation: See [README.md](./README.md)
- Detailed changes: See [TRANSFORMATION_SUMMARY.md](./TRANSFORMATION_SUMMARY.md)
- Environment setup: See [.env.example](./.env.example)

---

**You're all set! Start posting professional cybersecurity content to grow your LinkedIn presence.**
