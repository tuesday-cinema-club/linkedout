import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { saveCredentials, loadCredentials } from './storageService.js';

// Use stealth plugin to avoid detection
puppeteer.use(StealthPlugin());

class LinkedInAuthService {
    constructor() {
        this.browser = null;
        this.cookies = null;
    }

    /**
     * Login to LinkedIn with username and password
     * @param {string} email - LinkedIn email
     * @param {string} password - LinkedIn password
     * @returns {Promise<Object>} Session cookies
     */
    async login(email, password) {
        console.log('[LinkedIn Auth] Starting login process...');

        try {
            // Launch browser in headless mode
            this.browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage'
                ]
            });

            const page = await this.browser.newPage();

            // Set realistic viewport and user agent
            await page.setViewport({ width: 1366, height: 768 });
            await page.setUserAgent(
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            );

            console.log('[LinkedIn Auth] Navigating to LinkedIn login page...');
            await page.goto('https://www.linkedin.com/login', {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Wait for login form
            await page.waitForSelector('#username', { timeout: 10000 });

            console.log('[LinkedIn Auth] Filling in credentials...');

            // Fill in email
            await page.type('#username', email, { delay: 100 });

            // Fill in password
            await page.type('#password', password, { delay: 100 });

            // Click login button
            console.log('[LinkedIn Auth] Submitting login form...');
            await Promise.all([
                page.click('button[type="submit"]'),
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 })
            ]);

            // Check if login was successful
            const currentUrl = page.url();

            if (currentUrl.includes('/checkpoint/challenge')) {
                console.error('[LinkedIn Auth] Security challenge detected');
                await this.browser.close();
                throw new Error('LinkedIn security challenge detected. Please login manually in a browser first, then try again.');
            }

            if (currentUrl.includes('/login')) {
                console.error('[LinkedIn Auth] Login failed - still on login page');
                await this.browser.close();
                throw new Error('Login failed. Please check your credentials.');
            }

            console.log('[LinkedIn Auth] Login successful! Extracting cookies...');

            // Get cookies
            this.cookies = await page.cookies();

            // Save cookies to storage
            const credentials = loadCredentials() || {};
            credentials.linkedinCookies = this.cookies;
            credentials.linkedinEmail = email; // Save email for reference
            saveCredentials(credentials);

            console.log('[LinkedIn Auth] Cookies saved successfully');

            // Close browser
            await this.browser.close();
            this.browser = null;

            return {
                success: true,
                cookies: this.cookies,
                message: 'Login successful'
            };

        } catch (error) {
            console.error('[LinkedIn Auth] Login error:', error);

            if (this.browser) {
                await this.browser.close();
                this.browser = null;
            }

            throw error;
        }
    }

    /**
     * Get stored cookies
     * @returns {Array} Cookies
     */
    getCookies() {
        if (this.cookies) {
            return this.cookies;
        }

        const credentials = loadCredentials();
        if (credentials && credentials.linkedinCookies) {
            this.cookies = credentials.linkedinCookies;
            return this.cookies;
        }

        return null;
    }

    /**
     * Check if cookies are still valid
     * @returns {boolean} True if cookies exist and not expired
     */
    isAuthenticated() {
        const cookies = this.getCookies();

        if (!cookies || cookies.length === 0) {
            return false;
        }

        // Check if li_at cookie exists and is not expired
        const liAtCookie = cookies.find(c => c.name === 'li_at');

        if (!liAtCookie) {
            return false;
        }

        // Check expiration (if set)
        if (liAtCookie.expires && liAtCookie.expires < Date.now() / 1000) {
            console.log('[LinkedIn Auth] Cookies expired');
            return false;
        }

        return true;
    }

    /**
     * Clear stored cookies
     */
    logout() {
        this.cookies = null;
        const credentials = loadCredentials() || {};
        delete credentials.linkedinCookies;
        delete credentials.linkedinEmail;
        saveCredentials(credentials);
        console.log('[LinkedIn Auth] Logged out');
    }

    /**
     * Get cookie header string for API requests
     * @returns {string} Cookie header value
     */
    getCookieHeader() {
        const cookies = this.getCookies();

        if (!cookies) {
            return '';
        }

        return cookies.map(c => `${c.name}=${c.value}`).join('; ');
    }
}

// Export singleton instance
export const linkedinAuthService = new LinkedInAuthService();
