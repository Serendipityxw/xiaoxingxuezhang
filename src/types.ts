export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  createdAt: number;
  suggestions?: string[];
  sourceTitle?: string;
  imageUrls?: string[];
}

export interface FaqItem {
  id: string;
  icon: string;
  question: string;
  shortTitle: string;
  answer: string;
  suggestions: string[];
  keywords: string[];
  imageUrls?: string[];
}

export interface QrEntry {
  id: string;
  label: string;
  imageUrl: string;
  description: string;
}

export interface SiteConfig {
  assistantName: string;
  siteTitle: string;
  schoolName: string;
  campusName: string;
  phone: string;
  phoneLabel: string;
  intro: string;
  statusText: string;
  disclaimer: string;
  avatarUrl: string;
  heroImageUrl?: string;
  qrEntries: QrEntry[];
}
