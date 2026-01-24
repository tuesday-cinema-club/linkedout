import React, { useState, useEffect } from 'react';
import { BotConfig, AIProvider, ImageGenProvider, WeeklySchedule } from '../types';
import { isGeminiAvailable } from '../services/aiService';
import { isClaudeAvailable } from '../services/claudeService';
import { getLocalSDStatus } from '../services/imageGenService';
import { ScheduleConfig } from './ScheduleConfig';

interface ConfigPanelProps {
  config: BotConfig;
  onConfigChange: (config: BotConfig) => void;
  onClose: () => void;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onConfigChange, onClose }) => {
  const [localConfig, setLocalConfig] = useState<BotConfig>(config);
  const [sdStatus, setSDStatus] = useState<{ available: boolean; models?: string[]; error?: string } | null>(null);
  const [showApiKeys, setShowApiKeys] = useState(false);

  // LinkedIn auth state
  const [linkedinAuthMethod, setLinkedinAuthMethod] = useState<'oauth' | 'password'>('oauth');
  const [linkedinEmail, setLinkedinEmail] = useState('');
  const [linkedinPassword, setLinkedinPassword] = useState('');
  const [linkedinAuthStatus, setLinkedinAuthStatus] = useState<any>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    // Check SD status on mount
    getLocalSDStatus().then(setSDStatus);

    // Check LinkedIn auth status
    fetch('http://localhost:4000/api/linkedin/auth/status')
      .then(res => res.json())
      .then(setLinkedinAuthStatus)
      .catch(console.error);
  }, []);

  const handleSave = () => {
    onConfigChange(localConfig);
    onClose();
  };

  const updateConfig = (updates: Partial<BotConfig>) => {
    setLocalConfig(prev => ({ ...prev, ...updates }));
  };

  const handleLinkedinLogin = async () => {
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('http://localhost:4000/api/linkedin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: linkedinEmail, password: linkedinPassword })
      });

      const result = await response.json();

      if (response.ok) {
        setLinkedinAuthStatus({ authenticated: true, email: linkedinEmail, method: 'password' });
        setLinkedinPassword(''); // Clear password
        alert('LinkedIn login successful!');
      } else {
        setLoginError(result.error || 'Login failed');
      }
    } catch (error: any) {
      setLoginError(error.message || 'Network error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLinkedinLogout = async () => {
    try {
      await fetch('http://localhost:4000/api/linkedin/auth/logout', { method: 'POST' });
      setLinkedinAuthStatus({ authenticated: false, email: null, method: 'none' });
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const geminiAvailable = isGeminiAvailable();
  const claudeAvailable = isClaudeAvailable();

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        border: '1px solid #333',
        borderRadius: '8px',
        padding: '24px',
        maxWidth: '600px',
        maxHeight: '80vh',
        overflow: 'auto',
        color: '#fff'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600 }}>Bot Configuration</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#888',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0 8px'
            }}
          >
            ×
          </button>
        </div>

        {/* AI Provider Section */}
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#00d4ff' }}>AI Provider</h3>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                value="gemini"
                checked={localConfig.aiProvider === 'gemini'}
                onChange={(e) => updateConfig({ aiProvider: e.target.value as AIProvider })}
                disabled={!geminiAvailable}
              />
              <span>Gemini {geminiAvailable ? '✓' : '(not configured)'}</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                value="claude"
                checked={localConfig.aiProvider === 'claude'}
                onChange={(e) => updateConfig({ aiProvider: e.target.value as AIProvider })}
                disabled={!claudeAvailable}
              />
              <span>Claude {claudeAvailable ? '✓' : '(not configured)'}</span>
            </label>
          </div>

          {!geminiAvailable && !claudeAvailable && (
            <div style={{
              padding: '12px',
              backgroundColor: '#3d2a00',
              border: '1px solid #8b6914',
              borderRadius: '4px',
              fontSize: '13px',
              marginTop: '12px'
            }}>
              <div style={{ fontWeight: 600, marginBottom: '4px', color: '#ffb347' }}>⚠️ No AI Provider Configured</div>
              <div style={{ color: '#ccc', marginBottom: '8px' }}>You need at least one API key to use the bot:</div>
              <ul style={{ margin: '8px 0', paddingLeft: '20px', color: '#ccc' }}>
                <li><a href="https://aistudio.google.com/apikey" target="_blank" style={{ color: '#00d4ff' }}>Get Gemini API Key (Free)</a></li>
                <li><a href="https://console.anthropic.com/" target="_blank" style={{ color: '#00d4ff' }}>Get Claude API Key (Paid)</a></li>
              </ul>
              <div style={{ fontSize: '12px', color: '#888' }}>Add your key in the "API Configuration" section below.</div>
            </div>
          )}
          <p style={{ fontSize: '12px', color: '#888', margin: '8px 0 0 0' }}>
            {localConfig.aiProvider === 'gemini'
              ? 'Using Google Gemini for content generation and research (includes web search).'
              : 'Using Claude (Anthropic) for content generation. Note: Web search requires separate integration.'}
          </p>
        </section>

        {/* Image Generation Section */}
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#00d4ff' }}>Image Generation</h3>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                value="gemini"
                checked={localConfig.imageGenProvider === 'gemini'}
                onChange={(e) => updateConfig({ imageGenProvider: e.target.value as ImageGenProvider })}
              />
              <span>Cloud (Gemini)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="radio"
                value="local-sd"
                checked={localConfig.imageGenProvider === 'local-sd'}
                onChange={(e) => updateConfig({ imageGenProvider: e.target.value as ImageGenProvider })}
                disabled={sdStatus && !sdStatus.available}
              />
              <span>Local GPU {sdStatus?.available ? '✓' : '(not available)'}</span>
            </label>
          </div>
          {sdStatus && !sdStatus.available && (
            <p style={{ fontSize: '12px', color: '#ff6b6b', margin: '8px 0 0 0' }}>
              Stable Diffusion not detected. Install AUTOMATIC1111 WebUI and run on port 7860.
            </p>
          )}
          {sdStatus?.available && sdStatus.models && (
            <p style={{ fontSize: '12px', color: '#51cf66', margin: '8px 0 0 0' }}>
              Found {sdStatus.models.length} model(s) available.
            </p>
          )}
        </section>

        {/* Scheduling Section */}
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#00d4ff' }}>Posting Schedule</h3>

          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={localConfig.enableAutoPosting}
              onChange={(e) => updateConfig({ enableAutoPosting: e.target.checked })}
            />
            <span>Enable automatic posting</span>
          </label>

          {localConfig.weeklySchedule && (
            <ScheduleConfig
              schedule={localConfig.weeklySchedule}
              onScheduleChange={(schedule: WeeklySchedule) => updateConfig({ weeklySchedule: schedule })}
              disabled={!localConfig.enableAutoPosting}
            />
          )}
        </section>

        {/* LinkedIn Authentication Section */}
        <section style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#00d4ff' }}>LinkedIn Authentication</h3>

          {linkedinAuthStatus?.authenticated ? (
            <div style={{
              padding: '12px',
              backgroundColor: '#1a3d1a',
              border: '1px solid #2d5a2d',
              borderRadius: '4px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, color: '#51cf66' }}>✓ Authenticated</div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>
                    {linkedinAuthStatus.email} ({linkedinAuthStatus.method})
                  </div>
                </div>
                <button
                  onClick={handleLinkedinLogout}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: '#ff6b6b',
                    border: 'none',
                    borderRadius: '4px',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          ) : (
            <>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="oauth"
                    checked={linkedinAuthMethod === 'oauth'}
                    onChange={(e) => setLinkedinAuthMethod(e.target.value as 'oauth' | 'password')}
                  />
                  <span>OAuth (Recommended)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="password"
                    checked={linkedinAuthMethod === 'password'}
                    onChange={(e) => setLinkedinAuthMethod(e.target.value as 'oauth' | 'password')}
                  />
                  <span>Username/Password (Experimental)</span>
                </label>
              </div>

              {linkedinAuthMethod === 'oauth' ? (
                <div style={{
                  padding: '12px',
                  backgroundColor: '#2a2a2a',
                  border: '1px solid #444',
                  borderRadius: '4px',
                  fontSize: '13px'
                }}>
                  <div style={{ marginBottom: '8px' }}>Follow the OAuth setup guide:</div>
                  <ol style={{ margin: '8px 0', paddingLeft: '20px' }}>
                    <li>Create app at <a href="https://www.linkedin.com/developers/apps" target="_blank" style={{ color: '#00d4ff' }}>LinkedIn Developers</a></li>
                    <li>Get token from <a href="https://www.linkedin.com/developers/tools/oauth" target="_blank" style={{ color: '#00d4ff' }}>OAuth Tool</a></li>
                    <li>Add to API Configuration below</li>
                  </ol>
                  <div style={{ fontSize: '11px', color: '#666', marginTop: '8px' }}>
                    See PERSONAL_ACCOUNT_SETUP.md for detailed instructions
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{
                    padding: '8px 12px',
                    backgroundColor: '#3d1a1a',
                    border: '1px solid #8b1414',
                    borderRadius: '4px',
                    fontSize: '12px',
                    marginBottom: '12px',
                    color: '#ff6b6b'
                  }}>
                    ⚠️ Warning: Automated login may violate LinkedIn ToS and could result in account restrictions. Use at your own risk.
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <input
                      type="email"
                      value={linkedinEmail}
                      onChange={(e) => setLinkedinEmail(e.target.value)}
                      placeholder="LinkedIn Email"
                      disabled={isLoggingIn}
                      style={{
                        padding: '8px',
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                    />
                    <input
                      type="password"
                      value={linkedinPassword}
                      onChange={(e) => setLinkedinPassword(e.target.value)}
                      placeholder="LinkedIn Password"
                      disabled={isLoggingIn}
                      onKeyPress={(e) => e.key === 'Enter' && handleLinkedinLogin()}
                      style={{
                        padding: '8px',
                        backgroundColor: '#2a2a2a',
                        border: '1px solid #444',
                        borderRadius: '4px',
                        color: '#fff',
                        fontSize: '14px'
                      }}
                    />
                    <button
                      onClick={handleLinkedinLogin}
                      disabled={isLoggingIn || !linkedinEmail || !linkedinPassword}
                      style={{
                        padding: '10px',
                        backgroundColor: isLoggingIn ? '#555' : '#0077b5',
                        border: 'none',
                        borderRadius: '4px',
                        color: '#fff',
                        cursor: isLoggingIn || !linkedinEmail || !linkedinPassword ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        fontWeight: 600
                      }}
                    >
                      {isLoggingIn ? 'Logging in...' : 'Login to LinkedIn'}
                    </button>

                    {loginError && (
                      <div style={{
                        padding: '8px',
                        backgroundColor: '#3d1a1a',
                        border: '1px solid #8b1414',
                        borderRadius: '4px',
                        fontSize: '12px',
                        color: '#ff6b6b'
                      }}>
                        {loginError}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </section>

        {/* API Keys Section */}
        <section style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <h3 style={{ fontSize: '16px', margin: 0, color: '#00d4ff' }}>API Configuration</h3>
            <button
              onClick={() => setShowApiKeys(!showApiKeys)}
              style={{
                padding: '4px 12px',
                fontSize: '12px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '4px',
                color: '#888',
                cursor: 'pointer'
              }}
            >
              {showApiKeys ? 'Hide' : 'Show'} Keys
            </button>
          </div>

          {showApiKeys && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={localConfig.geminiApiKey || ''}
                  onChange={(e) => updateConfig({ geminiApiKey: e.target.value })}
                  placeholder="Enter Gemini API key"
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                  Claude API Key
                </label>
                <input
                  type="password"
                  value={localConfig.claudeApiKey || ''}
                  onChange={(e) => updateConfig({ claudeApiKey: e.target.value })}
                  placeholder="Enter Claude API key"
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                  LinkedIn Access Token
                </label>
                <input
                  type="password"
                  value={localConfig.linkedinAccessToken || ''}
                  onChange={(e) => updateConfig({ linkedinAccessToken: e.target.value })}
                  placeholder="Enter LinkedIn OAuth token"
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                  LinkedIn Person URN
                </label>
                <input
                  type="text"
                  value={localConfig.linkedinPersonUrn || ''}
                  onChange={(e) => updateConfig({ linkedinPersonUrn: e.target.value })}
                  placeholder="urn:li:person:XXXXXXX"
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                  Stable Diffusion URL (optional)
                </label>
                <input
                  type="text"
                  value={localConfig.stableDiffusionUrl || 'http://localhost:7860'}
                  onChange={(e) => updateConfig({ stableDiffusionUrl: e.target.value })}
                  placeholder="http://localhost:7860"
                  style={{
                    width: '100%',
                    padding: '8px',
                    backgroundColor: '#2a2a2a',
                    border: '1px solid #444',
                    borderRadius: '4px',
                    color: '#fff',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          )}
        </section>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2a2a2a',
              border: '1px solid #444',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              backgroundColor: '#00d4ff',
              border: 'none',
              borderRadius: '4px',
              color: '#000',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600
            }}
          >
            Save Configuration
          </button>
        </div>

        {/* Info Footer */}
        <div style={{
          marginTop: '24px',
          padding: '12px',
          backgroundColor: '#2a2a2a',
          borderRadius: '4px',
          fontSize: '12px',
          color: '#888'
        }}>
          <strong style={{ color: '#00d4ff' }}>Note:</strong> Configuration is saved to browser localStorage and .env file.
          For Docker deployments, use environment variables or the web UI to configure settings.
        </div>
      </div>
    </div>
  );
};
