import { z } from "zod";

// Simple types for in-memory storage (no database required)
export interface Kural {
  id: number;
  kural_tamil: string;
  kural_english: string;
  meaning_tamil: string;
  meaning_english: string;
  audio_tamil_url: string | null;
  audio_english_url: string | null;
  youtube_tamil_url: string | null;
  youtube_english_url: string | null;
  uri: string | null;
  section_english: string | null;
  section_tamil: string | null;
  subsection_english: string | null;
  subsection_tamil: string | null;
  slug: string;
}

export const insertKuralSchema = z.object({
  id: z.number(),
  kural_tamil: z.string(),
  kural_english: z.string(),
  meaning_tamil: z.string(),
  meaning_english: z.string(),
  audio_tamil_url: z.string().nullable().optional(),
  audio_english_url: z.string().nullable().optional(),
  youtube_tamil_url: z.string().nullable().optional(),
  youtube_english_url: z.string().nullable().optional(),
  uri: z.string().nullable().optional(),
  section_english: z.string().nullable().optional(),
  section_tamil: z.string().nullable().optional(),
  subsection_english: z.string().nullable().optional(),
  subsection_tamil: z.string().nullable().optional(),
  slug: z.string(),
});

export type InsertKural = z.infer<typeof insertKuralSchema>;

export interface User {
  id: string;
  email: string;
  name: string | null;
  username?: string;
  googleId: string | null;
}

export const insertUserSchema = z.object({
  email: z.string(),
  name: z.string().optional(),
  googleId: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
