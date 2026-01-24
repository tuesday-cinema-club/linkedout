# Quick Setup Guide

## Step 1: Get Gemini API Key (Free)

1. Go to https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the key

## Step 2: Add API Key to .env

Open `.env` file and add:
```
VITE_GEMINI_API_KEY=your-key-here
```

## Step 3: Choose LinkedIn Authentication Method

### Option A: Username/Password (Easiest)

1. Open the app: `npm start`
2. Click **⚙ Settings**
3. Scroll to "LinkedIn Authentication"
4. Select "Username/Password (Experimental)"
5. Enter your LinkedIn email and password
6. Click "Login to LinkedIn"

> **Warning**: This uses browser automation which may violate LinkedIn ToS. Use at your own risk.

### Option B: OAuth (Recommended)

Follow the guide in [PERSONAL_ACCOUNT_SETUP.md](file:///c:/Users/User/Desktop/EtnaaStuff/linkedout-vbunny/PERSONAL_ACCOUNT_SETUP.md)

## Step 4: Test the Bot

1. Click **⚡ Post Now** to generate and post immediately
2. Or configure a schedule in Settings

---

## Troubleshooting

### "Gemini (not configured)"

- Make sure you added `VITE_GEMINI_API_KEY` to `.env`
- Restart the app after editing `.env`

### LinkedIn Login Fails

**Common issues**:
- **Security challenge**: LinkedIn detected automation. Try logging in manually in a browser first, then try again.
- **Wrong credentials**: Double-check your email/password
- **2FA enabled**: Disable 2-factor authentication temporarily

**Alternative**: Use OAuth method instead (see PERSONAL_ACCOUNT_SETUP.md)

### Puppeteer Installation Issues

If you see errors about Chrome not found:
```bash
npx puppeteer browsers install chrome
```

---

## Next Steps

- Configure your posting schedule in Settings
- Customize content focus (CVEs, threat intel, etc.)
- Test with "Post Now" before enabling auto-posting

---

## Need Help?

- Full documentation: [README.md](file:///c:/Users/User/Desktop/EtnaaStuff/linkedout-vbunny/README.md)
- OAuth setup: [PERSONAL_ACCOUNT_SETUP.md](file:///c:/Users/User/Desktop/EtnaaStuff/linkedout-vbunny/PERSONAL_ACCOUNT_SETUP.md)
- Feature walkthrough: [walkthrough.md](file:///C:/Users/User/.gemini/antigravity/brain/f571a27e-7527-497f-afb8-fb30fc2ee869/walkthrough.md)
