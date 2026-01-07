import Anthropic from "@anthropic-ai/sdk";

// Claude API key from environment
const getClaudeApiKey = (): string => {
  return (
    (import.meta as any).env?.VITE_CLAUDE_API_KEY ||
    process.env.VITE_CLAUDE_API_KEY ||
    process.env.CLAUDE_API_KEY ||
    process.env.ANTHROPIC_API_KEY ||
    ""
  );
};

const claudeApiKey = getClaudeApiKey();

if (!claudeApiKey) {
  console.warn("Missing Claude API key. Set VITE_CLAUDE_API_KEY in your .env for live calls.");
}

let anthropic: Anthropic | null = null;

try {
  if (claudeApiKey) {
    anthropic = new Anthropic({ apiKey: claudeApiKey });
  }
} catch (error) {
  console.error("Failed to initialize Claude client:", error);
}

// Robust JSON parsing
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

export const runClaudeCompletion = async (
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    requireJSON?: boolean;
  } = {}
): Promise<string> => {
  if (!anthropic) {
    throw new Error("Claude API client not initialized. Check your API key.");
  }

  const {
    model = "claude-sonnet-4-20250514",
    maxTokens = 4096,
    temperature = 1.0,
    requireJSON = false
  } = options;

  try {
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: userPrompt
        }
      ]
    });

    const textContent = response.content
      .filter((block) => block.type === "text")
      .map((block) => (block as any).text)
      .join("\n");

    return textContent;
  } catch (error) {
    console.error("Claude API error:", error);
    throw error;
  }
};

export const runClaudeJSONCompletion = async (
  systemPrompt: string,
  userPrompt: string,
  options: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<any> => {
  const text = await runClaudeCompletion(systemPrompt, userPrompt, {
    ...options,
    requireJSON: true
  });
  return parseJSON(text);
};

export const isClaudeAvailable = (): boolean => {
  return !!anthropic && !!claudeApiKey;
};
