/**
 * Unified AI Service
 * Supports both Gemini and Claude APIs for content generation
 */

import { GoogleGenAI, Type } from "@google/genai";
import { runClaudeCompletion, runClaudeJSONCompletion, isClaudeAvailable } from "./claudeService";
import { AgentRole, AgentPlan, LinkedInDraft } from "../types";
import { generateCyberSecurityPrompt } from "./cyberSecurityService";

// AI Provider type
export type AIProvider = "gemini" | "claude";

// Get API keys
const geminiApiKey =
  (import.meta as any).env?.VITE_GEMINI_API_KEY ||
  process.env.VITE_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.API_KEY ||
  "";

const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

// JSON parsing helper
const parseJSON = (text: string) => {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("No JSON object found");
    const jsonStr = text.substring(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    try {
      return JSON.parse(cleanText);
    } catch (e2) {
      throw new Error("Failed to parse Agent response. Raw text: " + text.substring(0, 100));
    }
  }
};

// ============================================================================
// MANAGER AGENT - Orchestrates workflow
// ============================================================================
export const runManagerAgent = async (
  prompt: string,
  history: string,
  currentDraft: LinkedInDraft | null,
  provider: AIProvider = "gemini"
): Promise<AgentPlan> => {
  const sanitizedDraft = currentDraft ? { ...currentDraft } : null;
  if (sanitizedDraft && sanitizedDraft.imageUrl && sanitizedDraft.imageUrl.length > 500) {
    sanitizedDraft.imageUrl = "<IMAGE_DATA_EXISTS_BUT_OMITTED_FOR_TOKEN_OPTIMIZATION>";
  }

  const hasResearch = history.includes("Researcher found:");
  const hasDraft = currentDraft && currentDraft.body && currentDraft.body.length > 50;
  const hasImage = currentDraft && currentDraft.imageUrl && !currentDraft.imageUrl.includes("OMITTED");

  const systemInstruction = `
You are the Manager of a cybersecurity content creation agency. You MUST enforce a strict linear workflow to build high-quality LinkedIn posts about cybersecurity.

YOUR STRICT WORKFLOW:
1. RESEARCHER: If you don't have cybersecurity research/news in the history yet, call the Researcher.
2. COPYWRITER: If you have research but the 'Current Draft Body' is empty or short, call the Copywriter.
3. DESIGNER: If you have a text draft but no image, call the Designer.
4. USER APPROVAL: Only when you have Research + Text Draft + Image, mark isComplete = true.

DO NOT SKIP STEPS.
DO NOT MARK COMPLETE UNTIL THE DRAFT HAS TEXT AND AN IMAGE.

Current State:
- Has Research: ${hasResearch}
- Has Text Draft: ${hasDraft}
- Has Image: ${hasImage}

Current Draft Preview: ${JSON.stringify(sanitizedDraft || {})}
`;

  const userPrompt = `Conversation History:\n${history}\n\nUser's latest Input: ${prompt}\n\nDecide the next step based on the STRICT WORKFLOW.`;

  if (provider === "claude" && isClaudeAvailable()) {
    const response = await runClaudeJSONCompletion(
      systemInstruction + "\n\nYou MUST respond with valid JSON matching this schema: {nextAgent: string (RESEARCHER|COPYWRITER|DESIGNER|PUBLISHER), reasoning: string, taskDescription: string, isComplete: boolean}",
      userPrompt,
      { maxTokens: 1024 }
    );
    return response as AgentPlan;
  } else {
    if (!ai) throw new Error("Gemini API client not initialized");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            nextAgent: { type: Type.STRING, enum: [AgentRole.RESEARCHER, AgentRole.COPYWRITER, AgentRole.DESIGNER, AgentRole.PUBLISHER] },
            reasoning: { type: Type.STRING },
            taskDescription: { type: Type.STRING },
            isComplete: { type: Type.BOOLEAN }
          },
          required: ["nextAgent", "reasoning", "taskDescription", "isComplete"]
        }
      }
    });

    if (!response.text) throw new Error("Manager failed to respond");
    return parseJSON(response.text) as AgentPlan;
  }
};

// ============================================================================
// RESEARCHER AGENT - Finds cybersecurity news and data
// ============================================================================
export const runResearcherAgent = async (
  task: string,
  provider: AIProvider = "gemini"
): Promise<{ summary: string; sources: string[] }> => {
  const enhancedTask = `${task}\n\nFocus on: Recent CVEs, threat intelligence, security tools, breaches, or industry developments. Cite specific version numbers, CVE IDs, and dates when available.`;

  if (provider === "claude" && isClaudeAvailable()) {
    // Claude doesn't have built-in search, so we provide instructions to use web search results
    const response = await runClaudeCompletion(
      "You are a cybersecurity researcher. Provide a detailed summary of the latest information on the given topic. Focus on technical accuracy, timeline, impact, and actionable insights.",
      enhancedTask,
      { maxTokens: 2048 }
    );
    return {
      summary: response,
      sources: [] // Note: Would need to integrate with external search API
    };
  } else {
    if (!ai) throw new Error("Gemini API client not initialized");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: enhancedTask,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const text = response.text || "No results found.";
    const sources: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri) sources.push(chunk.web.uri);
      });
    }

    return { summary: text, sources: Array.from(new Set(sources)) };
  }
};

// ============================================================================
// COPYWRITER AGENT - Writes cybersecurity content
// ============================================================================
export const runCopywriterAgent = async (
  researchData: string,
  task: string,
  postType: "daily" | "weekly",
  provider: AIProvider = "gemini"
): Promise<LinkedInDraft> => {
  const wordCount = postType === "daily" ? "150-300 words" : "600-1000 words";
  const style = postType === "daily" ? "Brief, newsworthy update" : "In-depth analysis with actionable insights";

  const systemPrompt = `
ROLE: Senior Cybersecurity Analyst & LinkedIn Thought Leader.

CRITICAL REQUIREMENTS:
1. ABSOLUTELY NO EMOJIS - This must look professional and human-written, not AI-generated.
2. Write in a PROFESSIONAL ANALYST style - technical but accessible.
3. Target length: ${wordCount}
4. Style: ${style}

FORMATTING (LinkedIn-compatible markdown):
- Use '##' for Section Headers.
- Use '>' for pull quotes from experts or documentation.
- Use '**' for emphasis on technical terms.
- Use '-' for lists.

TONE & STYLE:
- Professional and authoritative
- Cite specific CVE numbers, version numbers, dates
- Include impact analysis (who is affected, severity)
- Provide actionable recommendations where relevant
- Use industry terminology correctly (CVSS scores, MITRE ATT&CK, etc.)
- Write like a human analyst, not an AI - vary sentence structure, use professional judgment
- NO marketing speak, NO hype, NO emojis

HEADLINE:
- Clear and specific (include CVE ID, vendor, or threat name)
- Professional, not clickbait
- Example: "Critical RCE Vulnerability in Apache Struts 2 (CVE-2024-XXXX) Affects Enterprise Deployments"

HASHTAGS:
- Use relevant technical hashtags: #CyberSecurity #InfoSec #ThreatIntelligence #Vulnerability #DataBreach
- Maximum 5-7 hashtags
- NO generic hashtags like #technology or #business
`;

  const userPrompt = `
TASK: ${task}
RESEARCH DATA: ${researchData}

Write the LinkedIn post now. Return valid JSON with: {headline: string, body: string, hashtags: string[]}
`;

  if (provider === "claude" && isClaudeAvailable()) {
    const response = await runClaudeJSONCompletion(
      systemPrompt + "\n\nYou MUST respond with valid JSON matching this exact schema: {headline: string, body: string, hashtags: string[]}",
      userPrompt,
      { maxTokens: 4096, temperature: 0.8 }
    );
    return response as LinkedInDraft;
  } else {
    if (!ai) throw new Error("Gemini API client not initialized");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            body: { type: Type.STRING },
            hashtags: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["headline", "body", "hashtags"]
        }
      }
    });

    if (!response.text) throw new Error("Copywriter failed to write");
    return parseJSON(response.text) as LinkedInDraft;
  }
};

// ============================================================================
// DESIGNER AGENT - Creates cybersecurity-themed images
// ============================================================================
export const runDesignerAgent = async (
  postContext: string,
  provider: AIProvider = "gemini",
  useLocalGPU: boolean = false
): Promise<string> => {
  // If local GPU is selected, delegate to Stable Diffusion service
  if (useLocalGPU) {
    // This will be implemented in the imageGenService
    const { generateImageLocal } = await import("./imageGenService");
    return await generateImageLocal(postContext);
  }

  // Cloud-based image generation
  if (provider === "claude") {
    // Claude doesn't have native image generation - fallback to Gemini
    provider = "gemini";
  }

  if (!ai) throw new Error("Gemini API client not initialized");

  const prompt = `
Create a high-quality, 16:9 professional illustration for a cybersecurity article about: "${postContext}".

Style: Modern, Technical, Professional. Think: Security operations center, network diagrams, abstract cyber threats, digital locks, shields, or abstract data visualization.

Visual Elements: Use dark blues, cyans, blacks, and accent colors (red for threats, green for secure). Clean, editorial quality.

Constraints:
- NO TEXT on the image
- NO words, NO logos, NO labels
- Professional and sophisticated
- Should complement a LinkedIn business post
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: prompt,
  });

  let imageUrl = "";
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        imageUrl = `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        break;
      }
    }
  }

  if (!imageUrl) throw new Error("Designer failed to generate image");
  return imageUrl;
};

// ============================================================================
// PUBLISHER AGENT - Reviews content safety and quality
// ============================================================================
export const runPublisherAgent = async (
  draft: LinkedInDraft,
  provider: AIProvider = "gemini"
): Promise<{ approved: boolean; feedback: string }> => {
  const systemPrompt = `
Review this cybersecurity LinkedIn post for quality and appropriateness.

Standards:
- APPROVE if: Factual, professional, provides value to security professionals
- REJECT if: Contains misinformation, promotes illegal hacking, violates LinkedIn ToS, or includes hate speech

The post should be technical and professional. Critical analysis of vendors or security practices is allowed.
`;

  const userPrompt = `
Headline: ${draft.headline}
Body: ${draft.body}

Review and return JSON: {approved: boolean, feedback: string}
`;

  if (provider === "claude" && isClaudeAvailable()) {
    const response = await runClaudeJSONCompletion(
      systemPrompt + "\n\nRespond with JSON: {approved: boolean, feedback: string}",
      userPrompt,
      { maxTokens: 512 }
    );
    return response;
  } else {
    if (!ai) throw new Error("Gemini API client not initialized");
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            approved: { type: Type.BOOLEAN },
            feedback: { type: Type.STRING }
          },
          required: ["approved", "feedback"]
        }
      }
    });

    if (!response.text) return { approved: false, feedback: "Error reviewing content." };
    return parseJSON(response.text);
  }
};

// ============================================================================
// AUTO-GENERATION HELPERS
// ============================================================================
export const generateAutoPrompt = (type: "daily" | "weekly"): string => {
  return generateCyberSecurityPrompt(type);
};

export const isGeminiAvailable = (): boolean => {
  return !!ai && !!geminiApiKey;
};
