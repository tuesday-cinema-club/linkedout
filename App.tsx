import React, { useState, useCallback, useEffect, useRef } from 'react';
import { AgentSidebar } from './components/AgentSidebar';
import { ChatInterface } from './components/ChatInterface';
import { PostPreview } from './components/PostPreview';
import { ConfigPanel } from './components/ConfigPanel';
import { AgentRole, ChatMessage, AgentAction, LinkedInDraft, AgentPlan, BotConfig, AIProvider } from './types';
import {
  runManagerAgent,
  runResearcherAgent,
  runCopywriterAgent,
  runDesignerAgent,
  runPublisherAgent,
  generateAutoPrompt,
  isGeminiAvailable
} from './services/aiService';
import { isClaudeAvailable } from './services/claudeService';
import { publishToLinkedIn } from './services/linkedinService';
import { migrateConfig, createDefaultWeeklySchedule } from './services/configMigration';

// Load initial config from localStorage or defaults
const loadConfig = (): BotConfig => {
  const saved = localStorage.getItem('botConfig');

  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Migrate legacy config if needed
      return migrateConfig(parsed);
    } catch (e) {
      console.error('Failed to parse saved config:', e);
    }
  }

  // Return default config
  return {
    aiProvider: isGeminiAvailable() ? 'gemini' : isClaudeAvailable() ? 'claude' : 'gemini',
    imageGenProvider: 'gemini',
    enableAutoPosting: false,
    weeklySchedule: createDefaultWeeklySchedule(),
    contentFocus: [],
    writingStyle: 'professional'
  };
};

export default function App() {
  // Bot configuration
  const [config, setConfig] = useState<BotConfig>(loadConfig());
  const [showConfig, setShowConfig] = useState(false);

  // Conversational transcript shown in the chat column
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', role: AgentRole.MANAGER, content: "Hello! I'm your Cybersecurity Content Manager. Tell me what topic you want to post about, or I can find the latest cybersecurity news for you." }
  ]);

  // Timeline of actions shown in the sidebar
  const [actions, setActions] = useState<AgentAction[]>([]);
  const [activeAgent, setActiveAgent] = useState<AgentRole | null>(null);
  const [currentDraft, setCurrentDraft] = useState<LinkedInDraft | null>(null);

  // UI flags
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [publishedGallery, setPublishedGallery] = useState<{
    id: string;
    url: string | null;
    imageUrl?: string;
    headline?: string;
    timestamp: number
  }[]>([]);

  // Auto-posting state
  const [autoPublishEnabled, setAutoPublishEnabled] = useState(false);
  const [autoIntervalMinutes, setAutoIntervalMinutes] = useState(15);
  const [autoCountdownMs, setAutoCountdownMs] = useState(0);
  const [autoTaskElapsedMs, setAutoTaskElapsedMs] = useState(0);

  // Refs for auto-posting
  const autoTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextRunTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const taskTimerRef = useRef<NodeJS.Timeout | null>(null);
  const taskStartRef = useRef<number | null>(null);
  const draftRef = useRef<LinkedInDraft | null>(null);
  const messagesRef = useRef<ChatMessage[]>(messages);
  const autoTopicsRef = useRef<Set<string>>(new Set());
  const autoRunInFlight = useRef(false);
  const stopRequestedRef = useRef(false);

  // Save config to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('botConfig', JSON.stringify(config));
  }, [config]);

  // Keep refs in sync
  useEffect(() => {
    draftRef.current = currentDraft;
  }, [currentDraft]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Helper functions
  const addAction = (role: AgentRole, description: string, status: AgentAction['status'] = 'active', metadata?: any) => {
    setActions(prev => [...prev, {
      role,
      description,
      status,
      timestamp: Date.now(),
      metadata
    }]);
  };

  const updateActionStatus = (status: AgentAction['status']) => {
    setActions(prev => {
      const newActions = [...prev];
      if (newActions.length > 0) {
        newActions[newActions.length - 1].status = status;
      }
      return newActions;
    });
  };

  const addMessage = (role: AgentRole, content: string, isInternal = false) => {
    setMessages(prev => [...prev, {
      id: Date.now().toString() + Math.random(),
      role,
      content,
      isInternal
    }]);
  };

  // THE ORCHESTRATOR - Main agent workflow
  const processAgentCycle = useCallback(async (
    userPrompt: string,
    history: string,
    postType: 'daily' | 'weekly' = 'weekly',
    opts?: { resetDraft?: boolean; preserveImage?: boolean }
  ): Promise<LinkedInDraft | null> => {
    setIsProcessing(true);
    let keepGoing = true;
    let iterations = 0;
    const MAX_ITERATIONS = 8;

    const resetDraft = opts?.resetDraft ?? false;
    const preserveImage = opts?.preserveImage ?? true;
    let localDraft = resetDraft ? null : currentDraft;
    let lastContext = userPrompt;

    while (keepGoing && iterations < MAX_ITERATIONS) {
      iterations++;

      // 1. MANAGER DECIDES
      setActiveAgent(AgentRole.MANAGER);
      addAction(AgentRole.MANAGER, "Planning next step...");

      try {
        const plan: AgentPlan = await runManagerAgent(lastContext, history, localDraft, config.aiProvider);
        updateActionStatus('completed');

        addMessage(AgentRole.MANAGER, `Decision: ${plan.reasoning}`, true);

        if (plan.isComplete) {
          addMessage(AgentRole.MANAGER, "The draft is ready! Check the preview on the right.");
          keepGoing = false;
          break;
        }

        if (plan.nextAgent === AgentRole.PUBLISHER) {
          if (!localDraft || !localDraft.body) {
            addMessage(AgentRole.MANAGER, "Draft is empty. Writing content first...", true);
            plan.nextAgent = AgentRole.COPYWRITER;
            plan.taskDescription = "Write a cybersecurity LinkedIn post based on the research.";
          } else {
            addMessage(AgentRole.MANAGER, "Draft ready for review.");
            keepGoing = false;
            break;
          }
        }

        // 2. EXECUTE SUB-AGENT
        const nextAgent = plan.nextAgent;
        setActiveAgent(nextAgent);

        switch (nextAgent) {
          case AgentRole.RESEARCHER:
            addAction(AgentRole.RESEARCHER, `Researching: ${plan.taskDescription}`);
            const research = await runResearcherAgent(plan.taskDescription, config.aiProvider);
            updateActionStatus('completed');

            const findingsSummary = `Found ${research.sources.length} sources.`;
            addAction(AgentRole.RESEARCHER, "Research complete.", 'completed', { sources: research.sources });
            addMessage(AgentRole.RESEARCHER, findingsSummary, true);

            lastContext = `Research Results: ${research.summary}`;
            history += `\n[System] Researcher found: ${research.summary}`;
            break;

          case AgentRole.COPYWRITER:
            addAction(AgentRole.COPYWRITER, "Writing article (this may take a moment)...");
            const draft = await runCopywriterAgent(
              lastContext,
              plan.taskDescription,
              postType,
              config.aiProvider
            );
            updateActionStatus('completed');

            localDraft = {
              headline: draft.headline || "Untitled Draft",
              body: draft.body || "",
              hashtags: Array.isArray(draft.hashtags) ? draft.hashtags : [],
              imageUrl: preserveImage ? localDraft?.imageUrl : undefined
            };
            setCurrentDraft(localDraft);
            setPublishedUrl(null);

            if (localDraft.headline) {
              autoTopicsRef.current.add(localDraft.headline.toLowerCase());
            }

            addAction(AgentRole.COPYWRITER, "Article drafted.", 'completed');
            addMessage(AgentRole.COPYWRITER, `Wrote: "${draft.headline}"`, true);

            lastContext = `Draft Created. Headline: ${draft.headline}`;
            history += `\n[System] Copywriter created draft.`;
            break;

          case AgentRole.DESIGNER:
            addAction(AgentRole.DESIGNER, "Generating cover image...");
            setIsGeneratingImage(true);

            if (!localDraft) {
              localDraft = { headline: "Drafting...", body: "Content coming soon...", hashtags: [] };
              setCurrentDraft(localDraft);
            }

            const designContext = `${plan.taskDescription}. Headline: ${localDraft.headline}`;
            const useLocalGPU = config.imageGenProvider === 'local-sd';
            const imageUrl = await runDesignerAgent(
              designContext,
              config.aiProvider,
              useLocalGPU
            );

            setIsGeneratingImage(false);
            updateActionStatus('completed');

            if (localDraft) {
              localDraft = { ...localDraft, imageUrl };
              setCurrentDraft(localDraft);
            }

            addAction(AgentRole.DESIGNER, "Image generated.", 'completed');
            addMessage(AgentRole.DESIGNER, "Cover image created.", true);

            lastContext = "Image generated successfully.";
            history += "\n[System] Designer generated an image.";
            break;
        }

      } catch (error) {
        console.error(error);
        addMessage(AgentRole.MANAGER, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        keepGoing = false;
        updateActionStatus('failed');
      }
    }

    setActiveAgent(null);
    setIsProcessing(false);
    return localDraft || null;
  }, [currentDraft, config]);

  const handleSendMessage = useCallback((text: string) => {
    addMessage(AgentRole.USER, text);
    const historyStr = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    processAgentCycle(text, historyStr, 'weekly');
  }, [messages, processAgentCycle]);

  const handlePostToLinkedIn = async (overrideDraft?: LinkedInDraft | null): Promise<boolean> => {
    const draftToPublish = overrideDraft || draftRef.current || currentDraft;
    if (!draftToPublish || !draftToPublish.body || draftToPublish.body.trim().length < 50) {
      addAction(AgentRole.PUBLISHER, "Draft missing body text. Skipping publish.", 'failed');
      return false;
    }

    setIsPublishing(true);
    setActiveAgent(AgentRole.PUBLISHER);

    addAction(AgentRole.PUBLISHER, "Reviewing content for quality...");

    try {
      const review = await runPublisherAgent(draftToPublish, config.aiProvider);
      updateActionStatus('completed');

      if (!review.approved) {
        addMessage(AgentRole.PUBLISHER, `Content not approved: ${review.feedback}`);
        addAction(AgentRole.PUBLISHER, "Content rejected.", 'failed');
        setIsPublishing(false);
        setActiveAgent(null);
        return false;
      }

      addMessage(AgentRole.PUBLISHER, `Content approved. Publishing to LinkedIn...`);
      addAction(AgentRole.PUBLISHER, "Publishing to LinkedIn...");

      const result = await publishToLinkedIn(draftToPublish);

      if (result.success) {
        updateActionStatus('completed');
        addMessage(AgentRole.PUBLISHER, `Published successfully!`);
        setPublishedUrl(result.url || null);

        setPublishedGallery(prev => [{
          id: result.id || Date.now().toString(),
          url: result.url || null,
          imageUrl: draftToPublish.imageUrl,
          headline: draftToPublish.headline,
          timestamp: Date.now()
        }, ...prev].slice(0, 12));

        setIsPublishing(false);
        setActiveAgent(null);
        return true;
      } else {
        updateActionStatus('failed');
        addMessage(AgentRole.PUBLISHER, `Publish failed: ${result.error}`);
        setIsPublishing(false);
        setActiveAgent(null);
        return false;
      }
    } catch (error) {
      updateActionStatus('failed');
      addMessage(AgentRole.PUBLISHER, `Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsPublishing(false);
      setActiveAgent(null);
      return false;
    }
  };

  const handleConfigChange = (newConfig: BotConfig) => {
    setConfig(newConfig);
  };

  const handleGenerateDaily = () => {
    const prompt = generateAutoPrompt('daily');
    addMessage(AgentRole.USER, "Generate daily cybersecurity update");
    const historyStr = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    processAgentCycle(prompt, historyStr, 'daily');
  };

  const handleGenerateWeekly = () => {
    const prompt = generateAutoPrompt('weekly');
    addMessage(AgentRole.USER, "Generate weekly cybersecurity analysis");
    const historyStr = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    processAgentCycle(prompt, historyStr, 'weekly');
  };

  const handlePostNow = async () => {
    // Generate and post immediately
    const prompt = generateAutoPrompt('daily');
    addMessage(AgentRole.USER, "Post Now - Generating content immediately");
    const historyStr = messages.map(m => `${m.role}: ${m.content}`).join('\n');
    const draft = await processAgentCycle(prompt, historyStr, 'daily', { resetDraft: true });

    // Auto-publish after generation
    if (draft && draft.body) {
      await handlePostToLinkedIn(draft);
    }
  };

  return (
    <div style={{
      display: 'flex',
      height: '100vh',
      backgroundColor: '#0a0a0a',
      color: '#fff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Left Sidebar - Agent Actions */}
      <div style={{ width: '320px', borderRight: '1px solid #222' }}>
        <AgentSidebar actions={actions} activeAgent={activeAgent} />
      </div>

      {/* Middle Column - Chat Interface */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: '1px solid #222' }}>
        {/* Header */}
        <div style={{
          padding: '16px 24px',
          borderBottom: '1px solid #222',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>
              Cybersecurity LinkedIn Bot
            </h1>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#888' }}>
              AI Provider: {config.aiProvider.toUpperCase()} | Images: {config.imageGenProvider === 'local-sd' ? 'Local GPU' : 'Cloud'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={handlePostNow}
              disabled={isProcessing || isPublishing}
              style={{
                padding: '8px 16px',
                backgroundColor: '#51cf66',
                border: 'none',
                borderRadius: '4px',
                color: '#000',
                cursor: (isProcessing || isPublishing) ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 600,
                opacity: (isProcessing || isPublishing) ? 0.5 : 1
              }}
            >
              ⚡ Post Now
            </button>
            <button
              onClick={handleGenerateDaily}
              disabled={isProcessing}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1a73e8',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: isProcessing ? 0.5 : 1
              }}
            >
              Daily Update
            </button>
            <button
              onClick={handleGenerateWeekly}
              disabled={isProcessing}
              style={{
                padding: '8px 16px',
                backgroundColor: '#1a73e8',
                border: 'none',
                borderRadius: '4px',
                color: '#fff',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                opacity: isProcessing ? 0.5 : 1
              }}
            >
              Weekly Article
            </button>
            <button
              onClick={() => setShowConfig(true)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#2a2a2a',
                border: '1px solid #444',
                borderRadius: '4px',
                color: '#fff',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              ⚙ Settings
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isProcessing={isProcessing}
        />
      </div>

      {/* Right Column - Post Preview */}
      <div style={{ width: '500px' }}>
        <PostPreview
          draft={currentDraft}
          onPublish={() => handlePostToLinkedIn()}
          isPublishing={isPublishing}
          isGeneratingImage={isGeneratingImage}
          publishedUrl={publishedUrl}
          publishedGallery={publishedGallery}
        />
      </div>

      {/* Configuration Panel (Modal) */}
      {showConfig && (
        <ConfigPanel
          config={config}
          onConfigChange={handleConfigChange}
          onClose={() => setShowConfig(false)}
        />
      )}
    </div>
  );
}
