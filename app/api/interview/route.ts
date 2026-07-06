import { NextRequest, NextResponse } from "next/server";
import { getClient, MODEL, toGeminiContents } from "@/lib/gemini";
import type { ChatMessage, GeneratedQuestion } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const {
      messages,
      jobDescription,
      resume,
      questions,
    }: {
      messages: ChatMessage[];
      jobDescription: string;
      resume: string;
      questions: GeneratedQuestion[];
    } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "No messages provided." }, { status: 400 });
    }

    const questionList = (questions || [])
      .map((q) => `${q.id}. [${q.category}] ${q.question}`)
      .join("\n");

    const systemInstruction = `You are "Alex", a friendly but rigorous interviewer conducting a realistic mock interview.

CONTEXT
Job description:
${(jobDescription || "").slice(0, 6000)}

Candidate resume:
${(resume || "").slice(0, 6000)}

Planned question list (use as your backbone, in order):
${questionList}

RULES
- Ask ONE question at a time. Never dump multiple questions in one turn.
- Start with a one-line warm greeting, then ask question 1.
- After each candidate answer: give ONE brief natural reaction (a few words), optionally ONE short follow-up if the answer was vague, then move to the next planned question.
- Stay in character as an interviewer. Do not coach, do not reveal scores, do not summarize performance mid-interview.
- Keep every turn under 80 words. Be conversational, not robotic.
- After the final planned question has been answered, thank the candidate and say the interview is complete and they can end the session to see their feedback.`;

    const client = getClient();
    const stream = await client.models.generateContentStream({
      model: MODEL,
      contents: toGeminiContents(messages),
      config: { systemInstruction, maxOutputTokens: 500 },
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.text;
            if (text) controller.enqueue(encoder.encode(text));
          }
          controller.close();
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Interview request failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
