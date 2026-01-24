export enum AgentRole {
  USER = 'User',
  MANAGER = 'Manager',
  RESEARCHER = 'Researcher',
  COPYWRITER = 'Copywriter',
  DESIGNER = 'Designer',
  PUBLISHER = 'Publisher'
}

export interface AgentAction {
  role: AgentRole;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  timestamp: number;
  output?: string;
  metadata?: any; // For flexible data like search results or image URLs
}

export interface ChatMessage {
  id: string;
  role: AgentRole;
  content: string;
  isInternal?: boolean; // If true, it's an "inner monologue" or inter-agent comms
}

export interface LinkedInDraft {
  headline: string;
  body: string;
  hashtags: string[];
  imageUrl?: string;
}

export interface AgentPlan {
  nextAgent: AgentRole;
  reasoning: string;
  taskDescription: string;
  isComplete: boolean;
}

// Configuration types for the cybersecurity bot
export type AIProvider = "gemini" | "claude";
export type ImageGenProvider = "gemini" | "local-sd";
export type PostScheduleType = "daily" | "weekly" | "manual";

export interface DaySchedule {
  enabled: boolean;
  postCount: number; // 0-6 posts per day
  isLongPost: boolean; // If true, one post will be 500+ words with image
  postTimes: string[]; // Array of times like ["09:00", "14:00"]
}

export interface WeeklySchedule {
  monday: DaySchedule;
  tuesday: DaySchedule;
  wednesday: DaySchedule;
  thursday: DaySchedule;
  friday: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

export interface BotConfig {
  // AI Provider settings
  aiProvider: AIProvider;
  imageGenProvider: ImageGenProvider;

  // Advanced Scheduling
  enableAutoPosting: boolean;
  weeklySchedule: WeeklySchedule;

  // Legacy scheduling (for migration)
  dailyPostEnabled?: boolean;
  weeklyPostEnabled?: boolean;
  dailyPostTime?: string; // HH:MM format
  weeklyPostDay?: number; // 0-6 (Sunday-Saturday)
  weeklyPostTime?: string; // HH:MM format

  // Content preferences
  contentFocus: string[]; // Categories from CYBER_CONTENT_CATEGORIES
  writingStyle: "professional" | "thought-leader" | "journalist";

  // API Configuration
  geminiApiKey?: string;
  claudeApiKey?: string;
  linkedinAccessToken?: string;
  linkedinPersonUrn?: string;
  stableDiffusionUrl?: string;
}

export interface PostSchedule {
  type: PostScheduleType;
  nextRun?: Date;
  lastRun?: Date;
  status: "idle" | "running" | "error";
}
