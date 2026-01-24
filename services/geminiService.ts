import { GoogleGenAI, Type } from "@google/genai";
import { AgentRole, AgentPlan, LinkedInDraft } from "../types";

// Vite exposes env vars under import.meta.env – fall back to process.env for Node scripts/tests.
const geminiApiKey =
  (import.meta as any).env?.VITE_GEMINI_API_KEY ||
  process.env.VITE_GEMINI_API_KEY ||
  process.env.GEMINI_API_KEY ||
  process.env.API_KEY ||
  "";

if (!geminiApiKey) {
  console.warn("Missing Gemini API key. Set VITE_GEMINI_API_KEY in your .env for live calls.");
}

const ai = new GoogleGenAI({ apiKey: geminiApiKey });

// Robust JSON parsing that finds the first { and last } to ignore conversational text
const parseJSON = (text: string) => {
  try {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1) throw new Error("No JSON object found");
    const jsonStr = text.substring(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("JSON Parse Error:", e);
    // Fallback: try removing markdown code blocks if the substring method failed
    const cleanText = text.replace(/```json\n?|\n?```/g, "").trim();
    try {
      return JSON.parse(cleanText);
    } catch (e2) {
      throw new Error("Failed to parse Agent response. Raw text: " + text.substring(0, 100));
    }
  }
};

// The Manager Agent decides who acts next based on history.
export const runManagerAgent = async (
  prompt: string,
  history: string,
  currentDraft: LinkedInDraft | null
): Promise<AgentPlan> => {
  const model = "gemini-2.5-flash";
  
  // Sanitize the draft to remove base64 image data from the prompt context
  const sanitizedDraft = currentDraft ? { ...currentDraft } : null;
  if (sanitizedDraft && sanitizedDraft.imageUrl && sanitizedDraft.imageUrl.length > 500) {
    sanitizedDraft.imageUrl = "<IMAGE_DATA_EXISTS_BUT_OMITTED_FOR_TOKEN_OPTIMIZATION>";
  }
  
  const hasResearch = history.includes("Researcher found:");
  const hasDraft = currentDraft && currentDraft.body && currentDraft.body.length > 50;
  const hasImage = currentDraft && currentDraft.imageUrl && !currentDraft.imageUrl.includes("OMITTED");

  const systemInstruction = `
    You are the Manager of a creative agency. You MUST enforce a strict linear workflow to build a high-quality LinkedIn Article.
    
    YOUR STRICT WORKFLOW:
    1. RESEARCHER: If you don't have facts/research in the history yet, call the Researcher.
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

  const response = await ai.models.generateContent({
    model,
    contents: `Conversation History:\n${history}\n\nUser's latest Input: ${prompt}\n\nDecide the next step based on the STRICT WORKFLOW.`,
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
};

// The Researcher Agent uses Google Search Grounding.
export const runResearcherAgent = async (task: string): Promise<{ summary: string; sources: string[] }> => {
  const model = "gemini-2.5-flash";
  
  const response = await ai.models.generateContent({
    model,
    contents: `Research Task: ${task}. \nSummarize the key findings relevant for a LinkedIn post. Focus on box office numbers, critical reception, cast interviews, and interesting production trivia.`,
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
};

// The Copywriter Agent writes the post.
export const runCopywriterAgent = async (researchData: string, task: string): Promise<LinkedInDraft> => {
  const model = "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model,
    contents: `
    ROLE: Senior Film Critic & LinkedIn Influencer.
    TASK: ${task}
    CONTEXT: Use this research data: ${researchData}

    REQUIREMENTS:
    1. Write a LONG-FORM LinkedIn Article (minimum 400 words).
    2. HEADLINE: Catchy, punchy, editorial style (no quotes).
    3. FORMATTING:
       - Use '##' for Section Headers.
       - Use '>' for pull quotes.
       - Use '**' for emphasis.
       - Use '-' for lists.
    4. TONE: Professional but engaging, insightful, slightly opinionated.
    
    Ensure the JSON response is valid.
    `,
    config: {
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
};

// The Designer Agent creates an image.
export const runDesignerAgent = async (postContext: string): Promise<string> => {
  const model = "gemini-2.5-flash-image";

  // Enriched prompt for better relevance
  const prompt = `
    Create a high-quality, 16:9 cinematic digital illustration for a blog post about: "${postContext}".
    
    Style: Editorial, Dramatic Lighting, 8k resolution, Movie Concept Art style.
    Constraints: NO TEXT on the image. No words, no logos.
  `;

  const response = await ai.models.generateContent({
    model,
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

// The Publisher Agent reviews and approves content.
export const runPublisherAgent = async (draft: LinkedInDraft): Promise<{ approved: boolean; feedback: string }> => {
  const model = "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model,
    contents: `
    Review this LinkedIn Article draft.
    
    Headline: ${draft.headline}
    Body: ${draft.body}
    
    Standard:
    - Allow opinions, critiques, and long content.
    - ONLY REJECT if it contains Hate Speech, Violence, or Illegal Acts.
    
    Return JSON.
    `,
    config: {
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
};

// ---- LinkedIn Publishing ----
// Real API call to create a UGC post. Requires a valid access token and author URN.
const linkedinAccessToken =
  (import.meta as any).env?.VITE_LINKEDIN_ACCESS_TOKEN ||
  process.env.VITE_LINKEDIN_ACCESS_TOKEN ||
  process.env.LINKEDIN_ACCESS_TOKEN ||
  "";
const rawLinkedinAuthor =
  (import.meta as any).env?.VITE_LINKEDIN_PERSON_URN ||
  process.env.VITE_LINKEDIN_PERSON_URN ||
  process.env.LINKEDIN_PERSON_URN ||
  "";
const linkedinAuthorUrn = rawLinkedinAuthor.startsWith("urn:")
  ? rawLinkedinAuthor
  : rawLinkedinAuthor
  ? `urn:li:person:${rawLinkedinAuthor}`
  : "urn:li:person:UNKNOWN";
const linkedinProxyUrl =
  (import.meta as any).env?.VITE_LINKEDIN_PROXY_URL ||
  process.env.VITE_LINKEDIN_PROXY_URL ||
  "http://localhost:4000/api/linkedin";
const linkedinUploadUrl = linkedinProxyUrl.replace(/\/api\/linkedin$/, "/api/linkedin/upload");

// Basic markdown-to-LinkedIn-friendly text (LinkedIn ignores markdown, but we can preserve structure).
const formatForLinkedIn = (headline: string, body: string, hashtags: string[]) => {
  const lines = (body || "").split("\n").map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      // Section header → uppercase and separated
      return trimmed.replace(/^##\s*/, "").toUpperCase();
    }
    if (trimmed.startsWith("> ")) {
      // Blockquote → quoted line
      return `"${trimmed.replace(/^>\s*/, "")}"`;
    }
    if (trimmed.startsWith("- ")) {
      // Bullet → bullet char
      return `• ${trimmed.replace(/^-+\s*/, "")}`;
    }
    return line;
  });

  const formattedTags = (hashtags || []).map((t) => (t.startsWith("#") ? t : `#${t}`)).join(" ");
  // Add spacing between headline and body, preserve blank lines
  return `${headline}\n\n${lines.join("\n")}\n\n${formattedTags}`.trim();
};

/**
 * Publish directly to LinkedIn's UGC API.
 * NOTE: LinkedIn does not accept data URLs for images; we post text-only if the generated image
 * is not already hosted at an https:// URL.
 * NOTE: Browser calls are routed through a small proxy (VITE_LINKEDIN_PROXY_URL) to avoid CORS.
 */
export const publishToLinkedIn = async (
  draft: LinkedInDraft
): Promise<{ success: boolean; id?: string; url?: string; error?: string }> => {
  if (!draft.body) {
    return { success: false, error: "Draft body is empty; nothing to publish." };
  }

  // Combine headline, body, and hashtags into one share text (LinkedIn cap is ~3000 chars).
  const shareText = formatForLinkedIn(draft.headline, draft.body, draft.hashtags).slice(0, 2900);

  let mediaCategory: "IMAGE" | "NONE" = "NONE";
  const media: any[] = [];

  // If we have a base64 data URL, upload it first to get an asset URN.
  if (draft.imageUrl && draft.imageUrl.startsWith("data:")) {
    try {
      const uploadRes = await fetch(linkedinUploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: draft.imageUrl, ownerUrn: linkedinAuthorUrn })
      });
      const uploadJson = await uploadRes.json();
      if (!uploadRes.ok) {
        throw new Error(uploadJson?.error || `Upload failed with status ${uploadRes.status}`);
      }
      if (uploadJson.asset) {
        mediaCategory = "IMAGE";
        media.push({
          status: "READY",
          media: uploadJson.asset,
          description: { text: "Cover image generated by the design agent." },
          title: { text: draft.headline || "Article cover" }
        });
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Image upload failed" };
    }
  }

  const payload: any = {
    author: linkedinAuthorUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: shareText },
        shareMediaCategory: mediaCategory,
        media
      }
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" }
  };

  const response = await fetch(linkedinProxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      error: `LinkedIn API error (${response.status}): ${errorText}`
    };
  }

  const data = await response.json();
  const postUrn = data.id || data.urn || data.entity;
  const shareUrl = postUrn ? `https://www.linkedin.com/feed/update/${postUrn}` : undefined;

  return {
    success: true,
    id: postUrn,
    url: shareUrl
  };
};
