# Pre-Launch Checklist - LinkedIn Cybersecurity Bot

Use this checklist before running your bot to ensure everything is configured correctly.

## ✅ Installation

- [ ] Node.js 20+ installed (`node --version`)
- [ ] Dependencies installed (`npm install`)
- [ ] No installation errors
- [ ] `node_modules` folder exists

## ✅ API Keys

### Gemini (Required)
- [ ] Gemini API key obtained from https://aistudio.google.com/apikey
- [ ] Key added to `.env` file as `VITE_GEMINI_API_KEY=...`
- [ ] NO spaces around `=` sign
- [ ] Key is valid (check at AI Studio)

### LinkedIn (Required)
- [ ] LinkedIn app created at https://www.linkedin.com/developers/apps
- [ ] OAuth token obtained
- [ ] Token added to `.env` as `VITE_LINKEDIN_ACCESS_TOKEN=...`
- [ ] Person URN obtained (from `/v2/userinfo` endpoint)
- [ ] URN added to `.env` as `VITE_LINKEDIN_PERSON_URN=urn:li:person:...`
- [ ] Token has `w_member_social` scope

### Claude (Optional)
- [ ] Claude API key obtained from https://console.anthropic.com/
- [ ] Key added to `.env` as `VITE_CLAUDE_API_KEY=...`
- [ ] OR: Skipped (will use Gemini only)

### Stable Diffusion (Optional)
- [ ] AUTOMATIC1111 WebUI installed
- [ ] Running with `--api --listen` flags
- [ ] Accessible at http://localhost:7860
- [ ] URL added to `.env` as `VITE_SD_API_URL=http://localhost:7860`
- [ ] OR: Skipped (will use cloud image generation)

## ✅ Environment Configuration

- [ ] `.env` file exists (copied from `.env.example`)
- [ ] `.env` is in `.gitignore` (NEVER commit this file!)
- [ ] All required variables set:
  - [ ] `VITE_GEMINI_API_KEY`
  - [ ] `VITE_LINKEDIN_ACCESS_TOKEN`
  - [ ] `VITE_LINKEDIN_PERSON_URN`
- [ ] NO syntax errors (no extra spaces, quotes, etc.)
- [ ] File saved

## ✅ Server Test

- [ ] Backend starts: `npm run proxy`
- [ ] Health check works: http://localhost:4000/health shows `{"ok":true}`
- [ ] No errors in console
- [ ] Stop server (Ctrl+C)

## ✅ Frontend Test

- [ ] Frontend starts: `npm run dev`
- [ ] Browser opens to http://localhost:3000
- [ ] No errors in browser console (F12)
- [ ] UI loads correctly
- [ ] Stop server (Ctrl+C)

## ✅ Full Stack Test

- [ ] Both servers start: `npm start`
- [ ] Frontend loads at http://localhost:3000
- [ ] Backend responds at http://localhost:4000/health
- [ ] No errors in console

## ✅ Content Generation Test

### Manual Post Test
- [ ] Click "Daily Update" button
- [ ] Watch agent workflow (Researcher → Copywriter → Designer)
- [ ] Draft appears in preview panel
- [ ] Content is about cybersecurity (NOT movies!)
- [ ] NO emojis in text
- [ ] Image generated successfully
- [ ] DO NOT publish yet (just testing)

### Weekly Post Test
- [ ] Click "Weekly Article" button
- [ ] Longer article generated (600-1000 words)
- [ ] Content is cybersecurity-focused
- [ ] NO emojis anywhere
- [ ] Professional analyst tone
- [ ] DO NOT publish yet

### Custom Topic Test
- [ ] Type: "Write about Apache Log4j vulnerability"
- [ ] Press Enter
- [ ] Content generated about Log4j
- [ ] Relevant and accurate
- [ ] DO NOT publish yet

## ✅ Configuration UI Test

- [ ] Click "⚙ Settings" button
- [ ] Settings panel opens
- [ ] Can select AI provider (Gemini/Claude)
- [ ] Can select image provider (Cloud/Local)
- [ ] Can toggle auto-posting
- [ ] Can set posting schedule
- [ ] Can view API key status (hidden by default)
- [ ] "Save Configuration" button works
- [ ] Settings persist after refresh

## ✅ Content Quality Review

Review 3-5 generated posts and verify:

- [ ] **NO emojis** anywhere in posts
- [ ] Professional writing style
- [ ] Technical accuracy (real CVEs, correct terms)
- [ ] Proper citations (CVE numbers, vendor names)
- [ ] Actionable insights included
- [ ] Hashtags are relevant (#CyberSecurity, #InfoSec, etc.)
- [ ] Images are professional (no text on images)
- [ ] Headline is clear and specific

## ✅ First Real Post

- [ ] Generated a high-quality post
- [ ] Reviewed content thoroughly
- [ ] Content aligns with your professional brand
- [ ] NO emojis confirmed
- [ ] Image looks professional
- [ ] Ready to publish
- [ ] Click "Publish to LinkedIn"
- [ ] Post successful (check LinkedIn)
- [ ] Engagement tracking started

## ✅ Post-Launch Monitoring

First 24 hours:
- [ ] Check LinkedIn post went live
- [ ] Monitor for engagement (likes, comments, shares)
- [ ] Respond to comments if any
- [ ] Verify post looks human-written
- [ ] No "AI-generated" comments from audience

First week:
- [ ] Track daily post performance
- [ ] Adjust posting times if needed
- [ ] Review content quality
- [ ] Make adjustments to AI provider/settings
- [ ] Plan content calendar

## ✅ Security Checklist

- [ ] `.env` file is in `.gitignore`
- [ ] Never committed API keys to git
- [ ] LinkedIn token expires in 60 days (set reminder)
- [ ] API usage monitoring enabled
- [ ] Billing alerts set up (Gemini/Claude)

## ✅ Optional Features

### Docker Deployment
- [ ] Docker installed
- [ ] `docker build -t linkedin-cyber-bot .` works
- [ ] `docker run` works with environment variables
- [ ] OR: `docker-compose up -d` works
- [ ] Container accessible at http://localhost:3000

### Auto-Posting Schedule
- [ ] Enabled in Settings
- [ ] Daily post time set (e.g., 9:00 AM)
- [ ] Weekly post time set (e.g., Monday 10:00 AM)
- [ ] Bot runs 24/7 (or use Docker restart policy)
- [ ] Monitoring alerts set up

### Local GPU Image Generation
- [ ] Stable Diffusion installed
- [ ] Running on port 7860
- [ ] Bot detects SD (shows "Local GPU ✓")
- [ ] Images generate successfully
- [ ] Quality is acceptable

## 🚨 Common Issues

### Bot won't start
- [ ] Check `npm install` ran successfully
- [ ] Check ports 3000/4000 are free
- [ ] Check `.env` file exists and is valid

### "API key not found"
- [ ] Verify `.env` file name (not `.env.txt`)
- [ ] Check NO spaces: `KEY=value` not `KEY = value`
- [ ] Restart servers after editing `.env`

### LinkedIn posts fail
- [ ] Check token is valid (regenerate if needed)
- [ ] Verify person URN is correct
- [ ] Check post content < 3000 characters
- [ ] Verify image upload succeeded

### Content is low quality
- [ ] Switch from Gemini to Claude (better writing)
- [ ] Review prompts in `aiService.ts`
- [ ] Check AI is using latest cybersecurity news
- [ ] Regenerate if needed

## ✅ Ready to Launch!

All checkboxes above should be checked before regular use.

**Final Verification:**
1. Generate 3 test posts
2. Review quality (no emojis, professional tone)
3. Publish 1 real post
4. Monitor engagement for 24 hours
5. Adjust settings as needed
6. Start regular posting schedule

---

**Everything ready? Run `npm start` and start building your cybersecurity LinkedIn presence!**

For support, see:
- [README.md](./README.md) - Full documentation
- [SETUP_WINDOWS.md](./SETUP_WINDOWS.md) - Windows-specific setup
- [QUICKSTART.md](./QUICKSTART.md) - Quick start guide
