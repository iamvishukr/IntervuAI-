import { NextRequest, NextResponse } from "next/server";
import { Type } from "@google/genai";
import { getClient, MODEL, parseModelJson, withRetry } from "@/lib/gemini";
import type { GeneratedQuestion } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const questionSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.NUMBER },
      category: { type: Type.STRING },
      question: { type: Type.STRING },
    },
    required: ["id", "category", "question"],
  },
};

export async function POST(req: NextRequest) {
  try {
    const { jobDescription, resume } = await req.json();

    if (!jobDescription?.trim() || !resume?.trim()) {
      return NextResponse.json(
        { error: "Both a job description and a resume are required." },
        { status: 400 }
      );
    }

    const client = getClient();

    const questions = await withRetry(async () => {
      const result = await client.models.generateContent({
        model: MODEL,
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Based on this job description and candidate resume, generate exactly 6 interview questions tailored to this specific role and candidate. Mix categories: 2 technical (specific to the role's stack), 2 behavioral (probing the candidate's actual listed experience), 1 role/scenario question, and 1 question about a gap or risk area you notice when comparing the resume to the job description.

Return a JSON array of 6 objects with keys: "id" (number 1-6), "category" (short label like "Technical", "Behavioral", "Scenario", "Gap probe"), "question" (string).

JOB DESCRIPTION:
${jobDescription.slice(0, 8000)}

CANDIDATE RESUME:
${resume.slice(0, 8000)}`,
              },
            ],
          },
        ],
        config: {
          systemInstruction:
            "You are an expert technical recruiter and interview coach. Respond only with the requested JSON.",
          responseMimeType: "application/json",
          responseSchema: questionSchema,
          // Thinking tokens count against maxOutputTokens on 2.5 models and can
          // truncate the JSON — disable thinking for this structured call.
          thinkingConfig: { thinkingBudget: 0 },
          maxOutputTokens: 4000,
        },
      });

      const parsed = parseModelJson<GeneratedQuestion[]>(result.text || "");
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Model returned no questions.");
      }
      return parsed;
    });

    return NextResponse.json({ questions });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Failed to generate questions.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
