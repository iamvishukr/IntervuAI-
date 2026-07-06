"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";

const SAMPLE_QUESTIONS = [
  "Your resume says you cut form setup time by 40%. Walk me through how you measured that.",
  "Tell me about a time a project went sideways. What did you do in the first 24 hours?",
  "This role is heavy on stakeholder work. Where does that show up in your experience?",
];

const steps = [
  {
    n: "01",
    title: "Brief the interviewer",
    body: "Upload your resume and paste the job description. The AI reads both and builds questions aimed at your exact experience — including the gaps.",
  },
  {
    n: "02",
    title: "Take the interview",
    body: "A realistic interviewer asks one question at a time, reacts to your answers, and follows up when you're vague — with responses streamed live.",
  },
  {
    n: "03",
    title: "Read your scorecard",
    body: "End the session to get an honest scorecard: communication, technical depth, STAR structure, and role fit — with specific fixes.",
  },
];

function TypedQuestion() {
  const reduce = useReducedMotion();
  const [qIndex, setQIndex] = useState(0);
  const [chars, setChars] = useState(reduce ? SAMPLE_QUESTIONS[0].length : 0);

  useEffect(() => {
    if (reduce) return;
    const full = SAMPLE_QUESTIONS[qIndex];
    if (chars < full.length) {
      const t = setTimeout(() => setChars((c) => c + 1), 34);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => {
      setChars(0);
      setQIndex((i) => (i + 1) % SAMPLE_QUESTIONS.length);
    }, 3800);
    return () => clearTimeout(t);
  }, [chars, qIndex, reduce]);

  return (
    <p className="min-h-[7.5rem] font-display text-xl font-medium leading-snug text-ink">
      &ldquo;{SAMPLE_QUESTIONS[qIndex].slice(0, chars)}
      {chars >= SAMPLE_QUESTIONS[qIndex].length && "\u201D"}
      <span className="ml-0.5 inline-block h-5 w-[2px] animate-blinkCursor bg-amber align-middle" />
    </p>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Home() {
  return (
    <main className="grain min-h-screen overflow-x-hidden">
      {/* Drifting spotlight */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 animate-spotlightDrift"
        style={{
          background:
            "radial-gradient(700px 500px at 70% 20%, rgba(242,179,61,0.06), transparent 65%)",
        }}
      />

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6"
      >
        <span className="font-display text-xl font-semibold tracking-tight">
          Intervu<span className="text-amber">AI</span>
        </span>
        <Link href="/prep" className="btn-ghost">
          Start a session
        </Link>
      </motion.nav>

      {/* Hero */}
      <section className="mx-auto grid max-w-5xl gap-12 px-6 pb-24 pt-14 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}
        >
          <motion.p variants={fadeUp} className="eyebrow mb-5">
            Mock interviews, taken seriously
          </motion.p>
          <motion.h1
            variants={fadeUp}
            className="font-display text-5xl font-semibold leading-[1.05] md:text-7xl"
          >
            Walk in
            <br />
            <span className="relative inline-block">
              ready.
              <motion.span
                aria-hidden="true"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.9, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className="absolute -bottom-1 left-0 h-[5px] w-full origin-left rounded-full bg-amber/80"
              />
            </span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-6 max-w-md text-lg leading-relaxed text-sage">
            IntervuAI reads the job description and your resume, then interviews
            you the way a real hiring panel would — and tells you the truth
            about how it went.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-9 flex flex-wrap items-center gap-5">
            <Link href="/prep" className="btn-amber">
              Start your mock interview
              <span aria-hidden="true">→</span>
            </Link>
            <span className="font-mono text-xs text-sage">No sign-up · ~10 minutes</span>
          </motion.div>
        </motion.div>

        {/* Signature: stacked cue cards, ON AIR light, live typing */}
        <motion.div
          initial={{ opacity: 0, y: 30, rotate: 2 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ duration: 0.8, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto w-full max-w-sm"
          aria-hidden="true"
        >
          <div className="cue-card absolute -left-3 top-4 h-full w-full rotate-[-4deg] opacity-40" />
          <div className="cue-card absolute -right-2 top-2 h-full w-full rotate-[3deg] opacity-60" />
          <motion.div
            whileHover={{ rotate: -1.5, y: -6 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="cue-card relative animate-floatSlow p-7"
          >
            <div className="mb-5 flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-moss">
                Question 3 of 6 · Behavioral
              </span>
              <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-coral">
                <span className="h-2 w-2 animate-pulseDot rounded-full bg-coral" />
                On air
              </span>
            </div>
            <TypedQuestion />
            <div className="mt-6 border-t border-parchment pt-4 font-mono text-[11px] text-moss">
              Alex · Interviewer
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* How it works */}
      <section className="border-t border-moss/40 bg-pine/40">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            className="eyebrow mb-10"
          >
            How a session runs
          </motion.p>
          <div className="grid gap-10 md:grid-cols-3">
            {steps.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.55, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="font-mono text-sm text-amber">{s.n}</span>
                <h2 className="mt-3 font-display text-2xl font-medium">{s.title}</h2>
                <p className="mt-3 leading-relaxed text-sage">{s.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-5xl px-6 py-24 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="font-display text-4xl font-semibold"
        >
          The worst place to practice
          <br className="hidden md:block" /> is the real interview.
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.15 }}
        >
          <Link href="/prep" className="btn-amber mt-8 inline-flex">
            Rehearse now
          </Link>
        </motion.div>
      </section>

      <footer className="border-t border-moss/40 py-8 text-center font-mono text-xs text-sage">
        IntervuAI · Built with ❤️ by Vishal
      </footer>
    </main>
  );
}
