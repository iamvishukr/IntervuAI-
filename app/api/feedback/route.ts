import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { getClient, MODEL, parseModelJson, withRetry } from "@/lib/gemini";
import type { ChatMessage, InterviewFeedback } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const feedbackSchema = {
  type: Type.OBJECT,
  properties: {
    overallScore: { type: Type.NUMBER },
    verdict: { type: Type.STRING },
    categories: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          score: { type: Type.NUMBER },
          comment: { type: Type.STRING },
        },
        required: ["name", "score", "comment"],
      },
    },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
    improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["overallScore", "verdict", "categories", "strengths", "improvements"],
};

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      jobDescription,
    }: { messages: ChatMessage[]; jobDescription: string } = await req.json();

    const answered = (messages || []).filter((m) => m.role === "user");
    if (answered.length < 1) {
      return NextResponse.json(
        { error: "Answer at least one question before requesting feedback." },
        { status: 400 }
      );
    }

    const transcript = (messages || [])
      .map((m) => `${m.role === "user" ? "CANDIDATE" : "INTERVIEWER"}: ${m.content}`)
      .join("\n\n");

    const client = getClient();

    const feedback = await withRetry(async () => {
      const result = await client.models.generateContent({
        model: MODEL,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Evaluate this mock interview transcript against the job description. Be honest — do not inflate scores for weak or short answers.

Return a JSON object with keys:
- "overallScore": number 0-100
- "verdict": one candid sentence (e.g. "Strong on fundamentals, needs sharper storytelling.")
- "categories": array of exactly 4 objects { "name": one of "Communication", "Technical depth", "Structure (STAR)", "Role fit"; "score": number 0-10; "comment": one specific sentence }
- "strengths": array of 2-3 short specific strings
- "improvements": array of 2-3 short actionable strings

JOB DESCRIPTION:
${(jobDescription || "").slice(0, 6000)}

TRANSCRIPT:
${transcript.slice(0, 12000)}`,
              },
            ],
          },
        ],
        config: {
          systemInstruction:
            "You are a senior hiring manager writing candid, constructive interview feedback. Respond only with the requested JSON.",
          responseMimeType: "application/json",
          responseSchema: feedbackSchema,
          thinkingConfig: { thinkingBudget: 0 },
          maxOutputTokens: 4000,
        },
      });

      const parsed = parseModelJson<InterviewFeedback>(result.text || "");
      if (
        typeof parsed?.overallScore !== "number" ||
        !Array.isArray(parsed?.categories)
      ) {
        throw new Error("Model returned malformed feedback.");
      }
      return parsed;
    });

    return NextResponse.json({ feedback });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to score interview.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
