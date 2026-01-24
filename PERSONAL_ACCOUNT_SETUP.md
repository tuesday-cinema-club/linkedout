# Personal Account LinkedIn Setup Guide

This guide helps you set up LinkedIn authentication for personal accounts without requiring a company LinkedIn page.

## Method 1: OAuth with Personal Account (Recommended)

### Step 1: Create a LinkedIn App

1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Click **"Create app"**
3. Fill in the required information:
   - **App name**: Choose any name (e.g., "My LinkedIn Bot")
   - **LinkedIn Page**: You can use your personal profile or create a test page
   - **App logo**: Upload any image (can be a placeholder)
   - **Legal agreement**: Check the box

### Step 2: Configure App Products

1. In your app dashboard, go to the **"Products"** tab
2. Request access to:
   - **Sign In with LinkedIn using OpenID Connect** (usually auto-approved)
   - **Share on LinkedIn** (may require review - submit and wait)

### Step 3: Get OAuth Credentials

1. Go to the **"Auth"** tab in your app
2. Copy your **Client ID** and **Client Secret**
3. Add a redirect URL: `http://localhost:4000/callback`

### Step 4: Generate Access Token

**Quick Method (OAuth Tool):**
1. Go to [LinkedIn OAuth Tools](https://www.linkedin.com/developers/tools/oauth)
2. Select your app
3. Request scopes: `openid`, `profile`, `email`, `w_member_social`
4. Click **"Request Access Token"**
5. Copy the token (valid for 60 days)

**Manual Method (for longer-lived tokens):**
```bash
# 1. Get authorization code
# Visit this URL in your browser:
https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:4000/callback&scope=openid%20profile%20email%20w_member_social

# 2. After authorizing, you'll be redirected with a code parameter
# Exchange the code for an access token:
curl -X POST https://www.linkedin.com/oauth/v2/accessToken \
  -d grant_type=authorization_code \
  -d code=AUTHORIZATION_CODE \
  -d client_id=YOUR_CLIENT_ID \
  -d client_secret=YOUR_CLIENT_SECRET \
  -d redirect_uri=http://localhost:4000/callback
```

### Step 5: Get Person URN

```bash
curl -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
     https://api.linkedin.com/v2/userinfo
```

Copy the `sub` field (format: `urn:li:person:XXXXXXX`)

### Step 6: Configure Bot

Add to your `.env` file:
```env
VITE_LINKEDIN_ACCESS_TOKEN=your-access-token-here
VITE_LINKEDIN_PERSON_URN=urn:li:person:XXXXXXX
```

---

## Method 2: Cookie-Based Authentication (Experimental)

> [!WARNING]
> **This method may violate LinkedIn's Terms of Service and could result in account restrictions.**
> Use at your own risk. OAuth (Method 1) is the recommended approach.

### Requirements
- Chrome or Firefox browser
- Browser DevTools knowledge

### Steps

1. **Extract Cookies from Browser:**
   - Log into LinkedIn in your browser
   - Open DevTools (F12)
   - Go to Application → Cookies → https://www.linkedin.com
   - Copy the following cookies:
     - `li_at`
     - `JSESSIONID`

2. **Configure Bot:**
   ```env
   LINKEDIN_AUTH_METHOD=cookie
   LINKEDIN_COOKIE_LI_AT=your-li_at-cookie
   LINKEDIN_COOKIE_JSESSIONID=your-jsessionid-cookie
   ```

3. **Limitations:**
   - Cookies expire (usually 1 year for `li_at`)
   - May trigger security alerts
   - Not officially supported by LinkedIn API

---

## Troubleshooting

### "Share on LinkedIn" Product Not Approved

If LinkedIn hasn't approved the "Share on LinkedIn" product:
- **For testing**: Use the OAuth tool to generate tokens (works even without approval)
- **For production**: Submit a detailed use case explaining why you need posting permissions
- **Alternative**: Use the unofficial cookie method (not recommended)

### Access Token Expired

OAuth tokens expire after 60 days:
1. Go back to the OAuth tool
2. Generate a new token
3. Update your `.env` file
4. Restart the bot

### "Invalid Person URN" Error

Make sure the URN format is correct:
- **Correct**: `urn:li:person:ABC123XYZ`
- **Incorrect**: `ABC123XYZ` (missing prefix)

### Rate Limiting

LinkedIn limits API calls:
- **Posts**: Max 100 per day per user
- **Solution**: Adjust your posting schedule in bot settings

---

## Security Best Practices

1. **Never commit `.env` to git**
   ```bash
   # Add to .gitignore
   .env
   data/credentials/
   ```

2. **Rotate tokens regularly**
   - Generate new OAuth tokens every 30 days
   - Update credentials in Docker volumes

3. **Use environment variables in production**
   ```bash
   docker run -e VITE_LINKEDIN_ACCESS_TOKEN=xxx ...
   ```

4. **Monitor for suspicious activity**
   - Check LinkedIn security settings regularly
   - Review "Where you're signed in" section

---

## Need Help?

- **LinkedIn API Docs**: https://docs.microsoft.com/en-us/linkedin/
- **OAuth Guide**: https://docs.microsoft.com/en-us/linkedin/shared/authentication/authentication
- **Community**: LinkedIn Developer Forums
