/**
 * LinkedIn Publishing Service
 * Handles posting to LinkedIn with image upload
 */

import { LinkedInDraft } from "../types";

// Get LinkedIn credentials from environment
const getLinkedInCreds = () => {
  const accessToken =
    (import.meta as any).env?.VITE_LINKEDIN_ACCESS_TOKEN ||
    process.env.VITE_LINKEDIN_ACCESS_TOKEN ||
    process.env.LINKEDIN_ACCESS_TOKEN ||
    "";

  const rawPersonUrn =
    (import.meta as any).env?.VITE_LINKEDIN_PERSON_URN ||
    process.env.VITE_LINKEDIN_PERSON_URN ||
    process.env.LINKEDIN_PERSON_URN ||
    "";

  const personUrn = rawPersonUrn.startsWith("urn:")
    ? rawPersonUrn
    : rawPersonUrn
    ? `urn:li:person:${rawPersonUrn}`
    : "urn:li:person:UNKNOWN";

  const proxyUrl =
    (import.meta as any).env?.VITE_LINKEDIN_PROXY_URL ||
    process.env.VITE_LINKEDIN_PROXY_URL ||
    "http://localhost:4000/api/linkedin";

  const uploadUrl = proxyUrl.replace(/\/api\/linkedin$/, "/api/linkedin/upload");

  return { accessToken, personUrn, proxyUrl, uploadUrl };
};

/**
 * Format content for LinkedIn (markdown to LinkedIn text)
 */
const formatForLinkedIn = (
  headline: string,
  body: string,
  hashtags: string[]
): string => {
  const lines = (body || "").split("\n").map((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      return trimmed.replace(/^##\s*/, "").toUpperCase();
    }
    if (trimmed.startsWith("> ")) {
      return `"${trimmed.replace(/^>\s*/, "")}"`;
    }
    if (trimmed.startsWith("- ")) {
      return `• ${trimmed.replace(/^-+\s*/, "")}`;
    }
    return line;
  });

  const formattedTags = (hashtags || [])
    .map((t) => (t.startsWith("#") ? t : `#${t}`))
    .join(" ");

  return `${headline}\n\n${lines.join("\n")}\n\n${formattedTags}`.trim();
};

/**
 * Publish post to LinkedIn
 */
export const publishToLinkedIn = async (
  draft: LinkedInDraft
): Promise<{ success: boolean; id?: string; url?: string; error?: string }> => {
  if (!draft.body) {
    return { success: false, error: "Draft body is empty; nothing to publish." };
  }

  const { personUrn, proxyUrl, uploadUrl } = getLinkedInCreds();

  // Format content (LinkedIn has ~3000 char limit)
  const shareText = formatForLinkedIn(draft.headline, draft.body, draft.hashtags).slice(0, 2900);

  let mediaCategory: "IMAGE" | "NONE" = "NONE";
  const media: any[] = [];

  // Upload image if present
  if (draft.imageUrl && draft.imageUrl.startsWith("data:")) {
    try {
      const uploadRes = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: draft.imageUrl, ownerUrn: personUrn }),
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
          description: { text: "Cybersecurity analysis illustration" },
          title: { text: draft.headline || "Security Update" },
        });
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : "Image upload failed" };
    }
  }

  // Create UGC post
  const payload: any = {
    author: personUrn,
    lifecycleState: "PUBLISHED",
    specificContent: {
      "com.linkedin.ugc.ShareContent": {
        shareCommentary: { text: shareText },
        shareMediaCategory: mediaCategory,
        media,
      },
    },
    visibility: { "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC" },
  };

  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    return {
      success: false,
      error: `LinkedIn API error (${response.status}): ${errorText}`,
    };
  }

  const data = await response.json();
  const postUrn = data.id || data.urn || data.entity;
  const shareUrl = postUrn ? `https://www.linkedin.com/feed/update/${postUrn}` : undefined;

  return {
    success: true,
    id: postUrn,
    url: shareUrl,
  };
};

/**
 * Validate LinkedIn credentials
 */
export const validateLinkedInCreds = (): { valid: boolean; error?: string } => {
  const { accessToken, personUrn } = getLinkedInCreds();

  if (!accessToken || accessToken.length < 10) {
    return { valid: false, error: "LinkedIn access token is missing or invalid" };
  }

  if (!personUrn || personUrn.includes("UNKNOWN")) {
    return { valid: false, error: "LinkedIn person URN is missing or invalid" };
  }

  return { valid: true };
};
