# LinkedIn Bot - Quick Start Guide

## What's New

✅ **Advanced Weekly Scheduling** - Configure posts per day with custom times  
✅ **Post Now Button** - Generate and publish immediately  
✅ **Docker Persistence** - Config survives container restarts  
✅ **Personal Account Support** - OAuth setup guide included  

---

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Your Schedule

```bash
npm start
```

Then:
1. Click **⚙ Settings**
2. Enable "Enable automatic posting"
3. Configure each day:
   - ✅ Enable days you want to post
   - ➕ Add post times (up to 6/day)
   - 📝 Check "Long Post" for 500+ word articles

**Example**:
- Monday: 9 AM (short), 10 AM (long)
- Wednesday: 2 PM (short)
- Friday: 9 AM, 12 PM, 5 PM (all short)

### 3. Use "Post Now"

Click **⚡ Post Now** in header to generate and publish immediately.

---

## Docker Deployment

```bash
# Create data directories
mkdir -p data/config data/credentials data/history

# Start container
docker-compose up -d

# View scheduler status
curl http://localhost:4000/api/scheduler/status
```

---

## Hardware Requirements

### Intel Arc A3000

✅ **Compatible** - 6GB VRAM is sufficient for Stable Diffusion 1.5

**Setup**:
1. Install [AUTOMATIC1111 WebUI](https://github.com/AUTOMATIC1111/stable-diffusion-webui)
2. Run: `./webui.sh --api --listen`
3. In Settings → Image Generation → Select "Local GPU"

**Recommendation**: Start with cloud mode (free), switch to GPU later if desired.

---

## Authentication

### Personal Accounts

See [PERSONAL_ACCOUNT_SETUP.md](file:///c:/Users/User/Desktop/EtnaaStuff/linkedout-vbunny/PERSONAL_ACCOUNT_SETUP.md) for detailed OAuth setup.

**Quick Steps**:
1. Create app at [LinkedIn Developers](https://www.linkedin.com/developers/apps)
2. Get token from [OAuth Tool](https://www.linkedin.com/developers/tools/oauth)
3. Add to `.env`:
   ```env
   VITE_LINKEDIN_ACCESS_TOKEN=your-token
   VITE_LINKEDIN_PERSON_URN=urn:li:person:XXXXX
   ```

---

## Files Changed

### New Components
- `components/ScheduleConfig.tsx` - Weekly schedule UI
- `services/schedulerService.ts` - Cron job manager
- `services/storageService.ts` - File persistence
- `services/configMigration.ts` - Config migration

### Modified Files
- `types.ts` - Added scheduling types
- `App.tsx` - Added Post Now button
- `ConfigPanel.tsx` - Integrated schedule UI
- `server.js` - Added API endpoints
- `docker-compose.yml` - Added persistent volumes

### Documentation
- `PERSONAL_ACCOUNT_SETUP.md` - OAuth guide
- `walkthrough.md` - Full implementation details

---

## Next Steps

1. **Configure your schedule** in Settings
2. **Test "Post Now"** to verify posting works
3. **Deploy to Docker** for 24/7 operation
4. **Monitor** via `/api/scheduler/status`

---

## Need Help?

- **Full Documentation**: See [walkthrough.md](file:///C:/Users/User/.gemini/antigravity/brain/f571a27e-7527-497f-afb8-fb30fc2ee869/walkthrough.md)
- **Personal Account Setup**: See [PERSONAL_ACCOUNT_SETUP.md](file:///c:/Users/User/Desktop/EtnaaStuff/linkedout-vbunny/PERSONAL_ACCOUNT_SETUP.md)
- **Original README**: See [README.md](file:///c:/Users/User/Desktop/EtnaaStuff/linkedout-vbunny/README.md)
