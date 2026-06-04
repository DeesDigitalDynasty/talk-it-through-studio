import { z } from "zod";

// --- CLIENT AUTH REGISTRATION SCHEMA ---
export const SignUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  age: z.number().min(18, "You must be at least 18 years old").max(120),
  preferredLanguage: z.enum(["English", "Yoruba", "English-Pidgin"]),
  faithPreference: z.enum(["None", "Christian", "Muslim", "Other"]),
  phone: z.string().optional(),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;

// --- MOOD LOG SCHEMA ---
export const MoodLogSchema = z.object({
  mood: z.number().min(1).max(10),
  sleepQuality: z.number().min(1).max(10).optional(),
  notes: z.string().optional(),
});

export type MoodLogInput = z.infer<typeof MoodLogSchema>;

// --- IN-APP CHAT SCHEMA ---
export const ChatMessageSchema = z.object({
  id: z.string(),
  role: z.enum(["user", "model"]),
  content: z.string(),
  createdAt: z.string(),
  isCrisisMatch: z.boolean().optional(),
});

export type ChatMessage = z.infer<typeof ChatMessageSchema>;

export interface TherapySession {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  messages: ChatMessage[];
}

// --- PEER GROUP SCHEMA ---
export const GroupMessageCommentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  content: z.string(),
  createdAt: z.string(),
  isReported: z.boolean().default(false),
});

export type GroupMessageComment = z.infer<typeof GroupMessageCommentSchema>;

export const GroupMessageSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  room: z.string(),
  content: z.string(),
  createdAt: z.string(),
  isReported: z.boolean().default(false),
  likesUserIds: z.array(z.string()).optional(),
  replies: z.array(GroupMessageCommentSchema).optional(),
});

export type GroupMessage = z.infer<typeof GroupMessageSchema>;

export interface SeasonalResource {
  id: string;
  title: string;
  description: string;
  phoneOrLink: string;
  category: string;
  createdAt: string;
}

// --- SHOP SCHEMA ---
export interface Product {
  id: string;
  title: string;
  category: "apparel" | "digital" | "art";
  description: string;
  priceNaira: number;
  tags: string[];
  imageUrl: string;
}

export interface DonationStat {
  totalNaira: number;
  totalDonors: number;
  healthcareSponsorshipsPaid: number;
  ngoPartnershipsFunded: number;
}
