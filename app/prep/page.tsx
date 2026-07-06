"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import Stepper from "@/components/Stepper";
import ResumeUpload from "@/components/ResumeUpload";
import ScoreRing from "@/components/ScoreRing";
import type {
  ChatMessage,
  GeneratedQuestion,
  InterviewFeedback,
} from "@/lib/types";

type Stage = "setup" | "generating" | "interview" | "scoring" | "feedback";

const KICKOFF = "Begin the interview.";

const GENERATING_LINES = [
  "Reading your resume…",
  "Studying the job post…",
  "Spotting the gaps…",
  "Writing your questions…",
];

const stageVariants = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -16, transition: { duration: 0.25 } },
};

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="Alex is typing">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-dotBounce rounded-full bg-moss"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}

function GeneratingOverlay() {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLine((l) => (l + 1) % GENERATING_LINES.length), 1600);
    return () => clearInterval(t);
  }, []);
  return (
    <motion.div
      variants={stageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="flex flex-1 flex-col items-center justify-center py-24 text-center"
      aria-live="polite"
    >
      <div className="relative h-28 w-40" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="cue-card absolute inset-0"
            initial={{ rotate: (i - 1) * 5, y: i * 3 }}
            animate={{ rotate: [(i - 1) * 5, (i - 1) * 5 + 3, (i - 1) * 5], y: [i * 3, i * 3 - 6, i * 3] }}
            transition={{ repeat: Infinity, duration: 1.8, delay: i * 0.25, ease: "easeInOut" }}
          />
        ))}
        <div className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.2em] text-moss">
          Prepping
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.p
          key={line}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="mt-8 font-display text-2xl font-medium"
        >
          {GENERATING_LINES[line]}
        </motion.p>
      </AnimatePresence>
      <p className="mt-3 font-mono text-xs text-sage">Usually takes a few seconds</p>
    </motion.div>
  );
}

export default function PrepPage() {
  const [stage, setStage] = useState<Stage>("setup");
  const [jobDescription, setJobDescription] = useState("");
  const [resume, setResume] = useState("");
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, streaming]);

  const visibleMessages = messages.filter((m) => m.content !== KICKOFF);
  const answersGiven = visibleMessages.filter((m) => m.role === "user").length;
  const lastMessage = visibleMessages[visibleMessages.length - 1];
  const waitingForFirstToken =
    streaming && (!lastMessage || lastMessage.role === "user" || lastMessage.content === "");

  const stepIndex: 0 | 1 | 2 =
    stage === "setup" || stage === "generating" ? 0 : stage === "feedback" ? 2 : 1;

  async function readStreamInto(res: Response, history: ChatMessage[]): Promise<void> {
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || `Request failed (${res.status}).`);
    }
    const reader = res.body?.getReader();
    if (!reader) throw new Error("Streaming is not supported by this browser.");
    const decoder = new TextDecoder();
    let acc = "";
    setMessages([...history, { role: "assistant", content: "" }]);
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      acc += decoder.decode(value, { stream: true });
      setMessages([...history, { role: "assistant", content: acc }]);
    }
    if (!acc.trim()) throw new Error("The interviewer returned an empty reply.");
  }

  async function sendToInterviewer(history: ChatMessage[]) {
    setStreaming(true);
    setError("");
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, jobDescription, resume, questions }),
      });
      await readStreamInto(res, history);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setMessages(history.filter((m) => m.content !== KICKOFF).length ? history : []);
    } finally {
      setStreaming(false);
    }
  }

  async function startSession() {
    setError("");
    setStage("generating");
    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription, resume }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not generate questions.");
      setQuestions(data.questions);
      setStage("interview");
      const kickoff: ChatMessage[] = [{ role: "user", content: KICKOFF }];
      setMessages(kickoff);
      await sendToInterviewer(kickoff);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStage("setup");
    }
  }

  async function sendAnswer() {
    const text = draft.trim();
    if (!text || streaming) return;
    setDraft("");
    const history: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(history);
    await sendToInterviewer(history);
  }

  async function endAndScore() {
    setError("");
    setStage("scoring");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: visibleMessages, jobDescription }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not score the interview.");
      setFeedback(data.feedback);
      setStage("feedback");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setStage("interview");
    }
  }

  function resetAll() {
    setStage("setup");
    setQuestions([]);
    setMessages([]);
    setFeedback(null);
    setDraft("");
    setError("");
  }

  const readyToStart = Boolean(jobDescription.trim() && resume.trim());

  return (
    <main className="grain mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-6">
      <nav className="mb-6 flex items-center justify-between">
        <Link href="/" className="focus-ring rounded font-display text-lg font-semibold">
          Intervu<span className="text-amber">AI</span>
        </Link>
        {(stage === "interview" || stage === "scoring") && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] text-coral"
          >
            <span className="h-2 w-2 animate-pulseDot rounded-full bg-coral" />
            On air
          </motion.span>
        )}
      </nav>

      <div className="mb-8">
        <Stepper current={stepIndex} />
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            role="alert"
            className="overflow-hidden"
          >
            <div className="mb-6 flex items-start justify-between gap-4 rounded-xl border border-coral/50 bg-coral/10 px-4 py-3 text-sm text-coral">
              <span>{error}</span>
              <button
                onClick={() => setError("")}
                aria-label="Dismiss error"
                className="focus-ring shrink-0 rounded font-mono hover:text-ivory"
              >
                ✕
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* ---------- SETUP ---------- */}
        {stage === "setup" && (
          <motion.section key="setup" variants={stageVariants} initial="initial" animate="animate" exit="exit">
            <p className="eyebrow mb-3">Step 1 of 3 · Brief the interviewer</p>
            <h1 className="font-display text-3xl font-semibold">
              Who&rsquo;s interviewing, and for what?
            </h1>
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-sage">Job description</span>
                  {jobDescription.trim() && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="font-mono text-[10px] uppercase tracking-widest text-amber"
                    >
                      ✓ Added
                    </motion.span>
                  )}
                </div>
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the full job posting here…"
                  rows={9}
                  className="field h-[210px] resize-y"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-sage">Your resume</span>
                  {resume.trim() && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="font-mono text-[10px] uppercase tracking-widest text-amber"
                    >
                      ✓ Added
                    </motion.span>
                  )}
                </div>
                <ResumeUpload value={resume} onChange={setResume} />
              </div>
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button onClick={startSession} disabled={!readyToStart} className="btn-amber">
                Generate my interview
                <span aria-hidden="true">→</span>
              </button>
              {!readyToStart && (
                <span className="font-mono text-xs text-sage/70">
                  Add both the job post and your resume to begin
                </span>
              )}
            </div>
          </motion.section>
        )}

        {/* ---------- GENERATING ---------- */}
        {stage === "generating" && <GeneratingOverlay key="generating" />}

        {/* ---------- INTERVIEW ---------- */}
        {(stage === "interview" || stage === "scoring") && (
          <motion.section
            key="interview"
            variants={stageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="flex min-h-0 flex-1 flex-col"
          >
            <div className="mb-4 flex items-end justify-between gap-4">
              <div>
                <p className="eyebrow mb-1">Step 2 of 3 · Live interview</p>
                <h1 className="font-display text-2xl font-semibold">
                  Alex is asking the questions.
                </h1>
              </div>
              {questions.length > 0 && (
                <div className="flex items-center gap-1.5" aria-label={`${answersGiven} of ${questions.length} questions answered`}>
                  {questions.map((q, i) => (
                    <motion.span
                      key={q.id}
                      initial={false}
                      animate={{
                        backgroundColor: i < answersGiven ? "#F2B33D" : "#1F4033",
                        scale: i === answersGiven ? 1.25 : 1,
                      }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="h-2 w-2 rounded-full"
                    />
                  ))}
                  <span className="ml-2 font-mono text-xs text-sage">
                    {answersGiven}/{questions.length}
                  </span>
                </div>
              )}
            </div>

            <div
              ref={scrollRef}
              className="panel nice-scroll flex-1 space-y-4 overflow-y-auto p-5"
              style={{ maxHeight: "52vh", minHeight: "40vh" }}
              aria-live="polite"
            >
              {visibleMessages.map((m, i) =>
                m.role === "assistant" ? (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="cue-card max-w-[85%] p-5"
                  >
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-moss">
                      Alex · Interviewer
                    </p>
                    <p className="whitespace-pre-wrap leading-relaxed">
                      {m.content}
                      {streaming && i === visibleMessages.length - 1 && m.content !== "" && (
                        <span className="ml-1 inline-block h-4 w-[2px] animate-blinkCursor bg-amber align-middle" />
                      )}
                      {streaming && i === visibleMessages.length - 1 && m.content === "" && (
                        <TypingDots />
                      )}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 14, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    className="ml-auto max-w-[85%] rounded-xl border border-fern/60 bg-moss/50 p-5"
                  >
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-sage">
                      You
                    </p>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                  </motion.div>
                )
              )}
              {visibleMessages.length === 0 && (
                <div className="flex items-center gap-3 font-mono text-sm text-sage">
                  <TypingDots />
                  Alex is joining the room…
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendAnswer();
                  }
                }}
                placeholder="Type your answer… (Enter to send, Shift+Enter for a new line)"
                rows={3}
                disabled={streaming || stage === "scoring"}
                className="field flex-1 resize-none disabled:opacity-50"
              />
              <div className="flex flex-col gap-2">
                <button
                  onClick={sendAnswer}
                  disabled={streaming || !draft.trim() || stage === "scoring"}
                  className="btn-amber !px-5 !py-2.5"
                >
                  Send
                </button>
                <button
                  onClick={endAndScore}
                  disabled={streaming || answersGiven === 0 || stage === "scoring"}
                  className="btn-ghost hover:!border-coral hover:!text-coral disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {stage === "scoring" ? "Scoring…" : "End & score"}
                </button>
              </div>
            </div>
          </motion.section>
        )}

        {/* ---------- FEEDBACK ---------- */}
        {stage === "feedback" && feedback && (
          <motion.section
            key="feedback"
            variants={stageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="pb-16"
          >
            <p className="eyebrow mb-6">Step 3 of 3 · Your scorecard</p>
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-center md:gap-10">
              <ScoreRing score={feedback.overallScore} />
              <div className="text-center md:text-left">
                <motion.p
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="font-display text-2xl font-medium leading-snug"
                >
                  {feedback.verdict}
                </motion.p>
              </div>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2">
              {feedback.categories.map((c, i) => (
                <motion.div
                  key={c.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  className="panel p-5"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium">{c.name}</span>
                    <span className="font-mono text-sm text-amber">{c.score}/10</span>
                  </div>
                  <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-moss">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-amber to-honey"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, c.score * 10)}%` }}
                      transition={{ delay: 0.7 + i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <p className="text-sm leading-relaxed text-sage">{c.comment}</p>
                </motion.div>
              ))}
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20, rotate: -1 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: 0.9, duration: 0.5 }}
                className="cue-card p-6"
              >
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-moss">
                  What worked
                </p>
                <ul className="space-y-2 text-sm leading-relaxed">
                  {feedback.strengths.map((s, i) => (
                    <li key={i}>+ {s}</li>
                  ))}
                </ul>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20, rotate: 1 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ delay: 1.0, duration: 0.5 }}
                className="cue-card p-6"
              >
                <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-coral">
                  Work on this
                </p>
                <ul className="space-y-2 text-sm leading-relaxed">
                  {feedback.improvements.map((s, i) => (
                    <li key={i}>→ {s}</li>
                  ))}
                </ul>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <button onClick={resetAll} className="btn-amber mt-10">
                Run another session
              </button>
            </motion.div>
          </motion.section>
        )}
      </AnimatePresence>
    </main>
  );
}
