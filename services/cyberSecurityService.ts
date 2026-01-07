/**
 * Cybersecurity News & Content Service
 * Fetches real-time cybersecurity news, vulnerabilities, and industry updates
 */

export interface CyberNewsItem {
  title: string;
  summary: string;
  url: string;
  publishedDate?: string;
  source: string;
  category?: string; // "breach", "vulnerability", "tool", "policy", "threat-intel", etc.
}

/**
 * Fetches recent cybersecurity news from multiple sources
 * Uses web scraping and RSS feeds for real-time data
 */
export const fetchCyberSecurityNews = async (
  category?: string,
  limit: number = 10
): Promise<CyberNewsItem[]> => {
  // In production, this would fetch from:
  // - CVE databases (nvd.nist.gov)
  // - SecurityWeek, DarkReading, Krebs, BleepingComputer RSS
  // - CISA alerts
  // - GitHub security advisories
  // - Vendor security bulletins

  // For now, return structure for integration with AI agents
  // The AI will use Google Search Grounding to fetch real data
  return [];
};

/**
 * Categories of cybersecurity content we can generate
 */
export const CYBER_CONTENT_CATEGORIES = [
  "Zero-Day Vulnerabilities",
  "Data Breaches & Incident Response",
  "Threat Intelligence & APT Groups",
  "Security Tools & Techniques",
  "Compliance & Regulations (GDPR, SOC2, etc.)",
  "Cloud Security (AWS, Azure, GCP)",
  "Application Security (SAST, DAST, Pen Testing)",
  "Network Security & Firewalls",
  "Endpoint Detection & Response (EDR)",
  "Identity & Access Management (IAM)",
  "Cryptography & PKI",
  "DevSecOps & CI/CD Security",
  "Security Awareness & Social Engineering",
  "Malware Analysis & Reverse Engineering",
  "Bug Bounty Programs",
  "Security Certifications (CISSP, CEH, OSCP)",
  "Ransomware & Extortion",
  "Supply Chain Attacks",
  "AI/ML Security",
  "IoT & OT Security"
] as const;

/**
 * Get a random cybersecurity topic prompt for content generation
 */
export const generateCyberSecurityPrompt = (type: "daily" | "weekly"): string => {
  const currentDate = new Date().toISOString().split('T')[0];

  if (type === "daily") {
    // Short daily update - what happened today in cybersecurity
    return `Find and write about the most significant cybersecurity news or vulnerability disclosed in the past 24 hours (date: ${currentDate}). Focus on: new CVEs, major breaches, threat actor campaigns, security tool releases, or critical patches. Keep it concise (150-300 words) but informative.`;
  } else {
    // Weekly long-form analysis
    const category = CYBER_CONTENT_CATEGORIES[Math.floor(Math.random() * CYBER_CONTENT_CATEGORIES.length)];
    return `Write an in-depth analysis about a recent development or emerging trend in "${category}". Research the latest news from the past week (date: ${currentDate}), analyze its impact on enterprise security, and provide actionable insights for security professionals. This should be a comprehensive article (600-1000 words).`;
  }
};

/**
 * Cybersecurity-specific search keywords for research agents
 */
export const getCyberSearchKeywords = (topic: string): string[] => {
  const baseKeywords = [topic];
  const enhancedKeywords = [
    `${topic} CVE`,
    `${topic} vulnerability`,
    `${topic} security advisory`,
    `${topic} attack technique`,
    `${topic} MITRE ATT&CK`,
    `${topic} threat intelligence`
  ];

  return [...baseKeywords, ...enhancedKeywords];
};

/**
 * Validate that content is cybersecurity-relevant
 */
export const isCyberSecurityContent = (text: string): boolean => {
  const cyberKeywords = [
    'security', 'vulnerability', 'exploit', 'breach', 'malware',
    'ransomware', 'phishing', 'attack', 'threat', 'CVE',
    'patch', 'encryption', 'authentication', 'firewall',
    'penetration', 'zero-day', 'APT', 'SOC', 'SIEM',
    'compliance', 'GDPR', 'incident', 'forensics'
  ];

  const lowerText = text.toLowerCase();
  return cyberKeywords.some(keyword => lowerText.includes(keyword));
};
