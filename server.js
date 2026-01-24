// Lightweight proxy to call LinkedIn from the server (avoids browser CORS blocks).
import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import { Buffer } from 'buffer';
import { schedulerService } from './services/schedulerService.js';
import { saveConfig, loadConfig, saveCredentials, loadCredentials } from './services/storageService.js';
import { linkedinAuthService } from './services/linkedinAuthService.js';

dotenv.config();

const app = express();
const PORT = process.env.PROXY_PORT || 4000;

// Allow your frontend origin(s); comma-separated if multiple.
const allowedOrigins = (process.env.FRONTEND_ORIGIN || process.env.VITE_FRONTEND_ORIGIN || '').split(',')
  .map((o) => o.trim())
  .filter(Boolean);

// Basic CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.length === 0) {
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  next();
});

// Increase JSON/body limits to handle base64 image uploads from the client.
app.use(express.json({ limit: '15mb' }));

// Health check for quick verification
app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

// Simple OAuth callback helper: echoes ?code and ?state so you can copy them.
app.get('/callback', (req, res) => {
  const { code, state, error, error_description } = req.query;
  if (error) {
    return res.status(400).send(`OAuth error: ${error} - ${error_description || ''}`);
  }
  if (!code) {
    return res.status(400).send('No "code" found in query params. Did you approve the OAuth prompt?');
  }
  res.type('text/plain').send(
    `OAuth code received.\n\ncode=${code}\nstate=${state || ''}\n\nPaste this code into the accessToken request.`
  );
});

// Proxy endpoint that forwards the payload to LinkedIn's UGC API.
app.post('/api/linkedin', async (req, res) => {
  const token = process.env.VITE_LINKEDIN_ACCESS_TOKEN || process.env.LINKEDIN_ACCESS_TOKEN;
  if (!token) {
    return res.status(400).json({ error: 'Missing LinkedIn token' });
  }

  try {
    const apiRes = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(req.body)
    });

    const text = await apiRes.text();
    res.status(apiRes.status);
    res.type(apiRes.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (err) {
    console.error('LinkedIn proxy error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Proxy endpoint to register and upload an image to LinkedIn, returning the asset URN.
app.post('/api/linkedin/upload', async (req, res) => {
  const token = process.env.VITE_LINKEDIN_ACCESS_TOKEN || process.env.LINKEDIN_ACCESS_TOKEN;
  if (!token) {
    return res.status(400).json({ error: 'Missing LinkedIn token' });
  }

  const { imageUrl, ownerUrn } = req.body || {};
  if (!imageUrl || !ownerUrn) {
    return res.status(400).json({ error: 'imageUrl and ownerUrn are required' });
  }

  try {
    // 1) Register upload
    const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify({
        registerUploadRequest: {
          recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
          owner: ownerUrn,
          serviceRelationships: [
            { relationshipType: 'OWNER', identifier: 'urn:li:userGeneratedContent' }
          ]
        }
      })
    });

    if (!registerRes.ok) {
      const text = await registerRes.text();
      return res.status(registerRes.status).json({ error: `registerUpload failed: ${text}` });
    }

    const registerData = await registerRes.json();
    const uploadUrl = registerData.value?.uploadMechanism?.['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest']?.uploadUrl;
    const asset = registerData.value?.asset;

    if (!uploadUrl || !asset) {
      return res.status(500).json({ error: 'registerUpload response missing uploadUrl or asset' });
    }

    // 2) Upload bytes
    const base64Match = imageUrl.match(/^data:(.+);base64,(.*)$/);
    if (!base64Match) {
      return res.status(400).json({ error: 'imageUrl must be a data URL (base64)' });
    }
    const mimeType = base64Match[1];
    const buffer = Buffer.from(base64Match[2], 'base64');

    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': mimeType,
        'Content-Length': buffer.length
      },
      body: buffer
    });

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      return res.status(uploadRes.status).json({ error: `upload failed: ${text}` });
    }

    return res.json({ asset });
  } catch (err) {
    console.error('LinkedIn image upload error:', err);
    res.status(500).json({ error: err instanceof Error ? err.message : 'Unknown error' });
  }
});

// Config management endpoints
app.get('/api/config', (_req, res) => {
  try {
    const config = loadConfig();
    res.json(config || {});
  } catch (error) {
    res.status(500).json({ error: 'Failed to load config' });
  }
});

app.post('/api/config', (req, res) => {
  try {
    const config = req.body;
    saveConfig(config);

    // Update scheduler if auto-posting is enabled
    if (config.enableAutoPosting && config.weeklySchedule) {
      schedulerService.updateSchedule(config.weeklySchedule);
    } else {
      schedulerService.clearAllJobs();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save config' });
  }
});

// Credentials management endpoints
app.post('/api/credentials', (req, res) => {
  try {
    const credentials = req.body;
    saveCredentials(credentials);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save credentials' });
  }
});

// Scheduler status endpoint
app.get('/api/scheduler/status', (_req, res) => {
  try {
    const status = schedulerService.getStatus();
    res.json({ jobs: status });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get scheduler status' });
  }
});

// LinkedIn authentication endpoints
app.post('/api/linkedin/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    console.log(`[Server] LinkedIn login attempt for: ${email}`);

    const result = await linkedinAuthService.login(email, password);
    res.json(result);
  } catch (error) {
    console.error('[Server] LinkedIn login error:', error);
    res.status(500).json({
      error: error.message || 'Login failed',
      details: error.toString()
    });
  }
});

app.get('/api/linkedin/auth/status', (_req, res) => {
  try {
    const isAuthenticated = linkedinAuthService.isAuthenticated();
    const credentials = loadCredentials();

    res.json({
      authenticated: isAuthenticated,
      email: credentials?.linkedinEmail || null,
      method: isAuthenticated ? 'password' : (credentials?.linkedinAccessToken ? 'oauth' : 'none')
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to check auth status' });
  }
});

app.post('/api/linkedin/auth/logout', (_req, res) => {
  try {
    linkedinAuthService.logout();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Load config and initialize scheduler on startup
const startupConfig = loadConfig();
if (startupConfig?.enableAutoPosting && startupConfig.weeklySchedule) {
  console.log('[Server] Initializing scheduler from saved config...');
  schedulerService.updateSchedule(startupConfig.weeklySchedule);
}

app.listen(PORT, () => {
  console.log(`LinkedIn proxy running on http://localhost:${PORT}`);
  console.log('[Server] Scheduler service initialized');
});
