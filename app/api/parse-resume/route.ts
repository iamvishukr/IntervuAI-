import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB

function cleanup(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file received." }, { status: 400 });
    }
    if (file.size === 0) {
      return NextResponse.json({ error: "That file is empty." }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File is too large. Please upload a file under 8 MB." },
        { status: 400 }
      );
    }

    const name = file.name.toLowerCase();
    const buffer = Buffer.from(await file.arrayBuffer());
    let text = "";

    if (name.endsWith(".pdf") || file.type === "application/pdf") {
      const { extractText, getDocumentProxy } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const result = await extractText(pdf, { mergePages: true });
      text = result.text;
    } else if (
      name.endsWith(".docx") ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } else if (name.endsWith(".txt") || name.endsWith(".md") || file.type.startsWith("text/")) {
      text = buffer.toString("utf-8");
    } else if (name.endsWith(".doc")) {
      return NextResponse.json(
        { error: "Legacy .doc files aren't supported. Please save it as PDF or .docx and try again." },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, Word (.docx), or plain text file." },
        { status: 400 }
      );
    }

    text = cleanup(text);

    if (text.length < 40) {
      return NextResponse.json(
        {
          error:
            "We couldn't read any text from that file — it may be a scanned image. Try exporting a text-based PDF, or paste your resume text instead.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text,
      filename: file.name,
      words: text.split(/\s+/).length,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error && err.message
        ? `Couldn't read that file: ${err.message}`
        : "Couldn't read that file. Try a different format, or paste the text instead.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
