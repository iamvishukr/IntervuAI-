"use client";

import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  value: string;
  onChange: (text: string) => void;
}

type UploadState =
  | { kind: "idle" }
  | { kind: "uploading"; filename: string }
  | { kind: "done"; filename: string; words: number }
  | { kind: "error"; message: string };

const ACCEPT = ".pdf,.docx,.txt,.md";

export default function ResumeUpload({ value, onChange }: Props) {
  const [state, setState] = useState<UploadState>({ kind: "idle" });
  const [dragOver, setDragOver] = useState(false);
  const [pasteMode, setPasteMode] = useState(false);
  const [showText, setShowText] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setState({ kind: "uploading", filename: file.name });
      setShowText(false);
      try {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/parse-resume", { method: "POST", body: form });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Couldn't read that file.");
        onChange(data.text);
        setState({ kind: "done", filename: data.filename, words: data.words });
      } catch (e) {
        onChange("");
        setState({
          kind: "error",
          message: e instanceof Error ? e.message : "Couldn't read that file.",
        });
      }
    },
    [onChange]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  function clear() {
    onChange("");
    setState({ kind: "idle" });
    setShowText(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  if (pasteMode) {
    return (
      <div>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste your resume text here…"
          rows={12}
          className="field resize-y"
        />
        <button
          type="button"
          onClick={() => {
            setPasteMode(false);
            if (state.kind !== "done") onChange("");
          }}
          className="focus-ring mt-2 rounded font-mono text-[11px] uppercase tracking-widest text-sage underline-offset-4 hover:text-amber hover:underline"
        >
          ← Upload a file instead
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        id="resume-file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      <AnimatePresence mode="wait" initial={false}>
        {state.kind === "done" ? (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 22 }}
            className="cue-card p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <motion.span
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15, delay: 0.1 }}
                  className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-moss text-ivory"
                  aria-hidden="true"
                >
                  ✓
                </motion.span>
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{state.filename}</p>
                  <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-moss">
                    Resume read · {state.words.toLocaleString()} words
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clear}
                aria-label="Remove resume"
                className="focus-ring shrink-0 rounded-full px-2 py-0.5 font-mono text-sm text-moss transition-colors hover:bg-parchment hover:text-coral"
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              onClick={() => setShowText((s) => !s)}
              className="focus-ring mt-3 rounded font-mono text-[11px] uppercase tracking-widest text-moss underline-offset-4 hover:underline"
            >
              {showText ? "Hide extracted text" : "Review extracted text"}
            </button>
            <AnimatePresence>
              {showText && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    rows={8}
                    className="focus-ring mt-3 w-full resize-y rounded-lg border border-parchment bg-white/60 p-3 text-xs leading-relaxed text-ink"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ) : state.kind === "uploading" ? (
          <motion.div
            key="uploading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex h-[210px] flex-col items-center justify-center rounded-xl border border-dashed border-amber/60 bg-pine/50 px-6 text-center"
            aria-live="polite"
          >
            <div className="flex gap-1.5" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="h-2.5 w-2.5 animate-dotBounce rounded-full bg-amber"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <p className="mt-4 text-sm text-sage">
              Reading <span className="text-ivory">{state.filename}</span>…
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="idle"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.label
              htmlFor="resume-file"
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={onDrop}
              animate={{
                scale: dragOver ? 1.02 : 1,
                borderColor: dragOver ? "#F2B33D" : "rgba(31,64,51,1)",
                backgroundColor: dragOver ? "rgba(242,179,61,0.08)" : "rgba(22,48,38,0.5)",
              }}
              transition={{ duration: 0.18 }}
              className="flex h-[210px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 text-center"
            >
              <motion.div
                animate={{ y: dragOver ? -4 : 0 }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-moss/80 text-xl"
                aria-hidden="true"
              >
                📄
              </motion.div>
              <p className="mt-4 text-sm font-medium text-ivory">
                {dragOver ? "Drop it here" : "Drop your resume here, or click to browse"}
              </p>
              <p className="mt-1.5 font-mono text-[11px] uppercase tracking-widest text-sage/70">
                PDF · Word (.docx) · TXT
              </p>
            </motion.label>

            <div className="mt-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setPasteMode(true)}
                className="focus-ring rounded font-mono text-[11px] uppercase tracking-widest text-sage underline-offset-4 hover:text-amber hover:underline"
              >
                Paste text instead
              </button>
              {state.kind === "error" && (
                <motion.p
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  role="alert"
                  className="max-w-[70%] text-right text-xs text-coral"
                >
                  {state.message}
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
