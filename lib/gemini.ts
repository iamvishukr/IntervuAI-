import { GoogleGenAI } from "@google/genai";
import type { ChatMessage } from "@/lib/types";

export const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

export function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "Missing GEMINI_API_KEY. Copy .env.example to .env.local and add your free key from https://aistudio.google.com/apikey"
    );
  }
  return new GoogleGenAI({ apiKey });
}

/** Maps our app's chat messages to Gemini's content format (Gemini uses "model", not "assistant"). */
export function toGeminiContents(messages: ChatMessage[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? ("model" as const) : ("user" as const),
    parts: [{ text: m.content }],
  }));
}

/**
 * Parses model output as JSON. With responseSchema structured output this is
 * usually a straight JSON.parse, but we still defend against markdown fences,
 * stray prose, and smart quotes for maximum robustness.
 */
export function parseModelJson<T>(raw: string): T {
  if (!raw || !raw.trim()) {
    throw new Error("The model returned an empty response. Please try again.");
  }
  const cleaned = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  try {
    return JSON.parse(cleaned) as T;
  } catch {
    // Fall through to bracket extraction.
  }
  const firstBrace = cleaned.search(/[[{]/);
  const end = Math.max(cleaned.lastIndexOf("}"), cleaned.lastIndexOf("]"));
  if (firstBrace >= 0 && end > firstBrace) {
    return JSON.parse(cleaned.slice(firstBrace, end + 1)) as T;
  }
  throw new Error("The model returned a response that couldn't be read. Please try again.");
}

/** Runs an async producer up to `attempts` times before giving up. */
export async function withRetry<T>(fn: () => Promise<T>, attempts = 2): Promise<T> {
  let lastError: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Request failed.");
}
