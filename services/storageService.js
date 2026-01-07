import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CONFIG_DIR = path.join(DATA_DIR, 'config');
const CREDENTIALS_DIR = path.join(DATA_DIR, 'credentials');
const HISTORY_DIR = path.join(DATA_DIR, 'history');

const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');
const CREDENTIALS_FILE = path.join(CREDENTIALS_DIR, 'credentials.json');
const POST_HISTORY_FILE = path.join(HISTORY_DIR, 'post_history.json');

// Ensure directories exist
function ensureDirectories() {
    [DATA_DIR, CONFIG_DIR, CREDENTIALS_DIR, HISTORY_DIR].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`[Storage] Created directory: ${dir}`);
        }
    });
}

// Save configuration
export function saveConfig(config) {
    try {
        ensureDirectories();
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
        console.log('[Storage] Config saved successfully');
    } catch (error) {
        console.error('[Storage] Failed to save config:', error);
        throw error;
    }
}

// Load configuration
export function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
            const config = JSON.parse(data);
            console.log('[Storage] Config loaded successfully');
            return config;
        }
        console.log('[Storage] No config file found');
        return null;
    } catch (error) {
        console.error('[Storage] Failed to load config:', error);
        return null;
    }
}

// Save credentials (encrypted in production)
export function saveCredentials(credentials) {
    try {
        ensureDirectories();
        // In production, encrypt these values
        fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2), 'utf-8');
        console.log('[Storage] Credentials saved successfully');
    } catch (error) {
        console.error('[Storage] Failed to save credentials:', error);
        throw error;
    }
}

// Load credentials
export function loadCredentials() {
    try {
        if (fs.existsSync(CREDENTIALS_FILE)) {
            const data = fs.readFileSync(CREDENTIALS_FILE, 'utf-8');
            const credentials = JSON.parse(data);
            console.log('[Storage] Credentials loaded successfully');
            return credentials;
        }
        console.log('[Storage] No credentials file found');
        return null;
    } catch (error) {
        console.error('[Storage] Failed to load credentials:', error);
        return null;
    }
}

// Save post history
export function savePostHistory(history) {
    try {
        ensureDirectories();
        fs.writeFileSync(POST_HISTORY_FILE, JSON.stringify(history, null, 2), 'utf-8');
        console.log('[Storage] Post history saved successfully');
    } catch (error) {
        console.error('[Storage] Failed to save post history:', error);
        throw error;
    }
}

// Load post history
export function loadPostHistory() {
    try {
        if (fs.existsSync(POST_HISTORY_FILE)) {
            const data = fs.readFileSync(POST_HISTORY_FILE, 'utf-8');
            const history = JSON.parse(data);
            console.log('[Storage] Post history loaded successfully');
            return history;
        }
        console.log('[Storage] No post history file found');
        return [];
    } catch (error) {
        console.error('[Storage] Failed to load post history:', error);
        return [];
    }
}

// Add post to history
export function addPostToHistory(post) {
    const history = loadPostHistory();
    history.unshift(post);

    // Keep only last 100 posts
    if (history.length > 100) {
        history.splice(100);
    }

    savePostHistory(history);
}
