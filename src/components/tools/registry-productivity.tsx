"use client";

import type { ToolComponent } from "./registry";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CopyButton,
  DownloadButton,
  ErrorNote,
  Field,
  OkNote,
  PrimaryButton,
  ResetButton,
  SecondaryButton,
  TextArea,
  inputCls,
  labelCls,
} from "./ui";
import { cn, downloadText } from "@/lib/utils";

/* ════════════════════════════════════════════════════════════════
   Shared helpers: crypto randomness + Web Audio alarm + formatting
   ════════════════════════════════════════════════════════════════ */

/** Uniform random integer in [0, maxExclusive) via rejection sampling. */
function randomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) throw new Error("Range must be positive.");
  const limit = Math.floor(4294967296 / maxExclusive) * maxExclusive;
  const buf = new Uint32Array(1);
  let v: number;
  do {
    crypto.getRandomValues(buf);
    v = buf[0];
  } while (v >= limit);
  return v % maxExclusive;
}

/** Fisher–Yates shuffle using the cryptographic random source. */
function shuffled<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
  return arr;
}

/* ── Web Audio alarm (no external audio files) ────────────────── */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  try {
    if (!audioCtx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      audioCtx = new Ctor();
    }
    if (audioCtx.state === "suspended") void audioCtx.resume();
    return audioCtx;
  } catch {
    return null;
  }
}

/** Play a short sequence of beeps. Safe to call anywhere. */
function playBeep(times = 3, intervalSec = 0.35, freq = 880): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const t0 = ctx.currentTime + 0.05;
    for (let i = 0; i < times; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const start = t0 + i * intervalSec;
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.4, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + Math.min(0.3, intervalSec * 0.8));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + Math.min(0.35, intervalSec * 0.85));
    }
  } catch {
    /* Audio unavailable — the visual cues still fire. */
  }
}

/* ── Time formatting ──────────────────────────────────────────── */

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

/** mm:ss (or h:mm:ss) clock, optionally with hundredths of a second. */
function fmtClock(ms: number, hundredths = false): string {
  const clamped = Math.max(0, ms);
  const totalSec = Math.floor(clamped / 1000);
  const hours = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  const base = hours > 0 ? `${hours}:${pad2(mins)}:${pad2(secs)}` : `${pad2(mins)}:${pad2(secs)}`;
  if (!hundredths) return base;
  const hh = Math.floor((clamped % 1000) / 10);
  return `${base}.${pad2(hh)}`;
}

function usePageTitle(title: string | null): void {
  const prevRef = useRef<string | null>(null);
  useEffect(() => {
    if (prevRef.current === null) prevRef.current = document.title;
    return () => {
      document.title = prevRef.current ?? "";
    };
  }, []);
  useEffect(() => {
    if (title === null) {
      if (prevRef.current !== null) document.title = prevRef.current;
    } else {
      document.title = title;
    }
  }, [title]);
}

/* ════════════════════════════════════════════════════════════════
   Pomodoro Timer
   ════════════════════════════════════════════════════════════════ */

type Phase = "work" | "short" | "long";

const PHASE_LABEL: Record<Phase, string> = {
  work: "Focus",
  short: "Short Break",
  long: "Long Break",
};

function PomodoroTimer() {
  const [workMin, setWorkMin] = useState(25);
  const [shortMin, setShortMin] = useState(5);
  const [longMin, setLongMin] = useState(15);
  const [sessionsBeforeLong, setSessionsBeforeLong] = useState(4);
  const [autoStartBreaks, setAutoStartBreaks] = useState(true);
  const [autoStartWork, setAutoStartWork] = useState(false);

  const [phase, setPhase] = useState<Phase>("work");
  const [running, setRunning] = useState(false);
  const [remaining, setRemaining] = useState(25 * 60000);
  const [completed, setCompleted] = useState(0);

  const endAtRef = useRef<number | null>(null);
  const remainingRef = useRef(25 * 60000);
  const phaseRef = useRef<Phase>("work");
  const completedRef = useRef(0);
  const cfgRef = useRef({ workMin, shortMin, longMin, sessionsBeforeLong, autoStartBreaks, autoStartWork });

  useEffect(() => {
    cfgRef.current = { workMin, shortMin, longMin, sessionsBeforeLong, autoStartBreaks, autoStartWork };
  });

  const durationFor = (p: Phase): number => {
    const cfg = cfgRef.current;
    const mins = p === "work" ? cfg.workMin : p === "short" ? cfg.shortMin : cfg.longMin;
    return Math.max(1, Math.round(mins)) * 60000;
  };

  const switchPhase = (next: Phase, autoStart: boolean) => {
    const dur = durationFor(next);
    phaseRef.current = next;
    setPhase(next);
    remainingRef.current = dur;
    setRemaining(dur);
    if (autoStart) {
      endAtRef.current = Date.now() + dur;
      setRunning(true);
    } else {
      endAtRef.current = null;
      setRunning(false);
    }
  };

  const completePhase = (countSession: boolean) => {
    if (countSession) playBeep(3);
    const wasWork = phaseRef.current === "work";
    let next: Phase;
    if (wasWork) {
      if (countSession) {
        completedRef.current += 1;
        setCompleted(completedRef.current);
      }
      next = completedRef.current % cfgRef.current.sessionsBeforeLong === 0 ? "long" : "short";
      switchPhase(next, countSession ? cfgRef.current.autoStartBreaks : cfgRef.current.autoStartWork);
    } else {
      next = "work";
      switchPhase(next, countSession ? cfgRef.current.autoStartWork : false);
    }
  };

  // Ticker: timestamp math keeps the timer accurate across tab switches.
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const end = endAtRef.current;
      if (end === null) return;
      const rem = end - Date.now();
      if (rem <= 0) {
        completePhase(true);
      } else {
        remainingRef.current = rem;
        setRemaining(rem);
      }
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  usePageTitle(running ? `${fmtClock(remaining)} · ${PHASE_LABEL[phase]} — Pomodoro` : null);

  const startPause = () => {
    if (running) {
      const end = endAtRef.current;
      remainingRef.current = end === null ? remainingRef.current : Math.max(0, end - Date.now());
      setRemaining(remainingRef.current);
      endAtRef.current = null;
      setRunning(false);
    } else {
      endAtRef.current = Date.now() + remainingRef.current;
      setRunning(true);
    }
  };

  const resetPhase = () => {
    const dur = durationFor(phaseRef.current);
    remainingRef.current = dur;
    setRemaining(dur);
    endAtRef.current = null;
    setRunning(false);
  };

  const skipPhase = () => completePhase(false);

  const changeConfig = (mins: number, setter: (v: number) => void) => {
    setter(mins);
    // Re-arm the current phase when settings change while paused.
    if (!running) {
      const dur =
        Math.max(1, Math.round(phaseRef.current === "work" ? mins : Number.NaN)) * 60000;
      if (Number.isFinite(dur) && phaseRef.current === "work") {
        remainingRef.current = dur;
        setRemaining(dur);
      }
    }
  };

  // The authoritative clock lives in refs (accurate across tab throttling);
  // the render reads them deliberately for the live display.
  // eslint-disable-next-line react-hooks/refs -- live timer display
  const total = durationFor(phase);
  const progress = total > 0 ? 1 - remaining / total : 0;
  const dotsDone = completed % Math.max(1, sessionsBeforeLong);
  const dots = Array.from({ length: Math.max(1, sessionsBeforeLong) }, (_, i) => i < dotsDone);
  const accent = phase === "work" ? "bg-lime" : "bg-sky-400";

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex justify-center gap-2">
        {(["work", "short", "long"] as Phase[]).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => switchPhase(p, false)}
            className={cn(
              "rounded-lg border px-4 py-1.5 text-sm font-medium transition",
              phase === p
                ? "border-[#163D2B]/60 bg-[#163D2B]/10 text-[#163D2B]"
                : "border-[#121212]/15 text-muted hover:text-cream",
            )}
          >
            {PHASE_LABEL[p]}
          </button>
        ))}
      </div>

      <div className="mt-8 text-center">
        <div className={cn("font-mono text-7xl font-semibold tabular-nums", phase === "work" ? "text-[#163D2B]" : "text-sky-300")}>
          {fmtClock(remaining)}
        </div>
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#121212]/5">
          <div
            className={cn("h-full rounded-full transition-[width] duration-200", accent)}
            style={{ width: `${Math.min(100, Math.max(0, progress * 100)).toFixed(1)}%` }}
          />
        </div>
        <div className="mt-4 flex items-center justify-center gap-2">
          {dots.map((done, i) => (
            <span
              key={i}
              className={cn("h-2.5 w-2.5 rounded-full", done ? "bg-lime" : "bg-[#121212]/10")}
              aria-label={done ? "Session completed" : "Session pending"}
            />
          ))}
          <span className="ml-2 text-xs text-muted">
            {completed} session{completed === 1 ? "" : "s"} completed
          </span>
        </div>
      </div>

      <div className="mt-8 flex items-center justify-center gap-3">
        <PrimaryButton onClick={startPause} className="!px-8">
          {/* eslint-disable-next-line react-hooks/refs -- live timer display */}
          {running ? "Pause" : remainingRef.current < durationFor(phaseRef.current) ? "Resume" : "Start"}
        </PrimaryButton>
        <SecondaryButton onClick={skipPhase}>Skip</SecondaryButton>
        <ResetButton onClick={resetPhase} />
      </div>

      <div className="mt-8 grid gap-4 rounded-xl border border-[#121212]/12 bg-[#f6f1e6] p-5 sm:grid-cols-2">
        <Field label="Focus length (minutes)">
          <input
            type="number"
            min={1}
            max={180}
            value={workMin}
            onChange={(e) => changeConfig(Math.max(1, Number(e.target.value) || 1), setWorkMin)}
            className={inputCls}
          />
        </Field>
        <Field label="Short break (minutes)">
          <input
            type="number"
            min={1}
            max={60}
            value={shortMin}
            onChange={(e) => setShortMin(Math.max(1, Number(e.target.value) || 1))}
            className={inputCls}
          />
        </Field>
        <Field label="Long break (minutes)">
          <input
            type="number"
            min={1}
            max={90}
            value={longMin}
            onChange={(e) => setLongMin(Math.max(1, Number(e.target.value) || 1))}
            className={inputCls}
          />
        </Field>
        <Field label="Long break after N sessions">
          <input
            type="number"
            min={1}
            max={12}
            value={sessionsBeforeLong}
            onChange={(e) => setSessionsBeforeLong(Math.max(1, Number(e.target.value) || 1))}
            className={inputCls}
          />
        </Field>
        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-cream">
          <input type="checkbox" checked={autoStartBreaks} onChange={(e) => setAutoStartBreaks(e.target.checked)} className="h-4 w-4 accent-lime" />
          Auto-start breaks
        </label>
        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-cream">
          <input type="checkbox" checked={autoStartWork} onChange={(e) => setAutoStartWork(e.target.checked)} className="h-4 w-4 accent-lime" />
          Auto-start next focus session
        </label>
      </div>
      <p className="mt-3 text-xs text-muted">
        The timer uses wall-clock timestamps, so it stays accurate when the tab is backgrounded. A
        short Web Audio beep plays when each phase ends, and the tab title shows the live countdown.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Stopwatch
   ════════════════════════════════════════════════════════════════ */

interface Lap {
  index: number;
  split: number;
  total: number;
}

function Stopwatch() {
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<Lap[]>([]);
  const startRef = useRef(0);
  const accRef = useRef(0);

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    const id = window.setInterval(() => {
      setElapsed(accRef.current + (performance.now() - startRef.current));
    }, 31);
    return () => window.clearInterval(id);
  }, [running]);

  // eslint-disable-next-line react-hooks/refs, react-hooks/purity -- live stopwatch display
  const current = running ? accRef.current + (performance.now() - startRef.current) : elapsed;

  const startPause = () => {
    if (running) {
      accRef.current += performance.now() - startRef.current;
      setElapsed(accRef.current);
      setRunning(false);
    } else {
      setRunning(true);
    }
  };

  const recordLap = () => {
    const total = current;
    const last = laps.length > 0 ? (laps[0] as Lap).total : 0;
    setLaps((prev) => [{ index: prev.length + 1, split: total - last, total }, ...prev]);
  };

  const reset = () => {
    setRunning(false);
    accRef.current = 0;
    setElapsed(0);
    setLaps([]);
  };

  const downloadLaps = () => {
    const lines = ["Lap,Split,Total"];
    for (const l of [...laps].reverse()) {
      lines.push(`${l.index},${fmtClock(l.split, true)},${fmtClock(l.total, true)}`);
    }
    downloadText(lines.join("\n") + "\n", "stopwatch-laps.csv", "text/csv");
  };

  return (
    <div className="mx-auto max-w-xl">
      <div className="text-center">
        <div className="font-mono text-7xl font-semibold tabular-nums text-[#163D2B]">
          {fmtClock(current, true)}
        </div>
        <div className="mt-8 flex items-center justify-center gap-3">
          <PrimaryButton onClick={startPause} className="!px-8">
            {running ? "Pause" : current > 0 ? "Resume" : "Start"}
          </PrimaryButton>
          <SecondaryButton onClick={recordLap} disabled={!running}>
            Lap
          </SecondaryButton>
          <ResetButton onClick={reset} />
        </div>
      </div>

      {laps.length > 0 && (
        <div className="mt-8">
          <div className="mb-2 flex items-center justify-between">
            <label className={labelCls + " !mb-0"}>Laps — {laps.length}</label>
            <CopyButton
              label="Copy all"
              text={laps
                .slice()
                .reverse()
                .map((l) => `Lap ${l.index}: ${fmtClock(l.split, true)} (total ${fmtClock(l.total, true)})`)
                .join("\n")}
            />
          </div>
          <div className="max-h-72 overflow-auto rounded-xl border border-[#121212]/12 bg-[#f6f1e6]">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[#121212]/40 backdrop-blur">
                <tr className="text-left text-xs uppercase tracking-wider text-muted">
                  <th className="px-4 py-2">Lap</th>
                  <th className="px-4 py-2 text-right">Split</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {laps.map((l) => (
                  <tr key={l.index} className="border-t border-white/5">
                    <td className="px-4 py-2 font-medium text-[#163D2B]">#{l.index}</td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums text-cream">
                      {fmtClock(l.split, true)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums text-muted">
                      {fmtClock(l.total, true)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            <DownloadButton onClick={downloadLaps} label="Download laps (.csv)" />
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">
        Measured with <code className="font-mono text-cream">performance.now()</code> — accurate to
        hundredths of a second and unaffected by system clock changes.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Countdown Timer
   ════════════════════════════════════════════════════════════════ */

function CountdownTimer() {
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("5");
  const [seconds, setSeconds] = useState("0");
  const [remaining, setRemaining] = useState(5 * 60000);
  const [running, setRunning] = useState(false);
  const [alarm, setAlarm] = useState(false);
  const endAtRef = useRef<number | null>(null);
  const remainingRef = useRef(5 * 60000);

  const inputTotal = () => {
    const h = Math.max(0, Number(hours) || 0);
    const m = Math.max(0, Number(minutes) || 0);
    const s = Math.max(0, Number(seconds) || 0);
    return Math.round((h * 3600 + m * 60 + s) * 1000);
  };

  const setPreset = (mins: number) => {
    stopAlarm();
    setRunning(false);
    endAtRef.current = null;
    remainingRef.current = mins * 60000;
    setRemaining(mins * 60000);
    setHours("0");
    setMinutes(String(mins));
    setSeconds("0");
  };

  const stopAlarm = () => setAlarm(false);

  const startPause = () => {
    if (alarm) stopAlarm();
    if (running) {
      const end = endAtRef.current;
      // eslint-disable-next-line react-hooks/purity -- timestamp math inside an event handler
      remainingRef.current = end === null ? remainingRef.current : Math.max(0, end - Date.now());
      setRemaining(remainingRef.current);
      endAtRef.current = null;
      setRunning(false);
    } else {
      const target = remainingRef.current > 0 ? remainingRef.current : inputTotal();
      if (target <= 0) return;
      remainingRef.current = target;
      setRemaining(target);
      // eslint-disable-next-line react-hooks/purity -- timestamp math inside an event handler
      endAtRef.current = Date.now() + target;
      setRunning(true);
    }
  };

  const reset = () => {
    stopAlarm();
    setRunning(false);
    endAtRef.current = null;
    remainingRef.current = inputTotal();
    setRemaining(remainingRef.current);
  };

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const end = endAtRef.current;
      if (end === null) return;
      const rem = end - Date.now();
      if (rem <= 0) {
        remainingRef.current = 0;
        setRemaining(0);
        setRunning(false);
        endAtRef.current = null;
        setAlarm(true);
        playBeep(6, 0.4);
      } else {
        remainingRef.current = rem;
        setRemaining(rem);
      }
    }, 200);
    return () => window.clearInterval(id);
  }, [running]);

  usePageTitle(
    running ? `${fmtClock(remaining)} — Countdown` : alarm ? "Time's up! — Countdown" : null,
  );

  const totalInput = inputTotal();
  // eslint-disable-next-line react-hooks/refs -- live timer display
  const invalid = remainingRef.current <= 0 && totalInput <= 0;
  const fraction = remaining > 0 && totalInput > 0 ? remaining / Math.max(totalInput, remaining) : 0;

  return (
    <div className="mx-auto max-w-xl">
      {alarm && (
        <div className="mb-5 flex items-center justify-between rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          <span className="font-semibold">Time is up!</span>
          <SecondaryButton onClick={stopAlarm} className="!border-red-400/40 !text-red-200 !px-3 !py-1.5 text-xs">
            Dismiss
          </SecondaryButton>
        </div>
      )}

      <div className="text-center">
        <div
          className={cn(
            "font-mono text-7xl font-semibold tabular-nums",
            alarm ? "text-red-400" : running ? "text-[#163D2B]" : "text-cream",
          )}
        >
          {fmtClock(remaining, alarm || (!running && remaining === 0))}
        </div>
        <div className="mx-auto mt-4 h-2 w-64 overflow-hidden rounded-full bg-[#121212]/5">
          <div
            className="h-full rounded-full bg-lime transition-[width] duration-200"
            style={{ width: `${Math.min(100, Math.max(0, fraction * 100)).toFixed(1)}%` }}
          />
        </div>
        <div className="mt-6 flex items-center justify-center gap-3">
          <PrimaryButton onClick={startPause} disabled={invalid} className="!px-8">
            {/* eslint-disable-next-line react-hooks/refs -- live timer display */}
            {running ? "Pause" : remainingRef.current > 0 && remainingRef.current < totalInput ? "Resume" : "Start"}
          </PrimaryButton>
          <ResetButton onClick={reset} />
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
          {[1, 3, 5, 10, 15, 25].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setPreset(m)}
              className="rounded-lg border border-[#121212]/15 px-3 py-1.5 text-xs font-medium text-muted transition hover:border-[#163D2B]/50 hover:text-[#163D2B]"
            >
              {m} min
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-3 gap-4 rounded-xl border border-[#121212]/12 bg-[#f6f1e6] p-5">
        <Field label="Hours">
          <input
            type="number"
            min={0}
            max={99}
            value={hours}
            onChange={(e) => {
              stopAlarm();
              setHours(e.target.value);
              setRunning(false);
              endAtRef.current = null;
              remainingRef.current = 0;
              setRemaining(0);
            }}
            className={inputCls + " text-center"}
          />
        </Field>
        <Field label="Minutes">
          <input
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={(e) => {
              stopAlarm();
              setMinutes(e.target.value);
              setRunning(false);
              endAtRef.current = null;
              remainingRef.current = 0;
              setRemaining(0);
            }}
            className={inputCls + " text-center"}
          />
        </Field>
        <Field label="Seconds">
          <input
            type="number"
            min={0}
            max={59}
            value={seconds}
            onChange={(e) => {
              stopAlarm();
              setSeconds(e.target.value);
              setRunning(false);
              endAtRef.current = null;
              remainingRef.current = 0;
              setRemaining(0);
            }}
            className={inputCls + " text-center"}
          />
        </Field>
      </div>
      <p className="mt-3 text-xs text-muted">
        The countdown is anchored to wall-clock timestamps, so it stays exact even if the tab is
        throttled in the background. A Web Audio alarm plays when it reaches zero, and the tab title
        counts down live.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Calendar Generator
   ════════════════════════════════════════════════════════════════ */

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DOW_SUN_FIRST = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DOW_MON_FIRST = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

interface MonthGrid {
  year: number;
  month: number;
  cells: Array<{ day: number; weekday: number } | null>;
  trailing: number;
}

function buildMonthGrid(year: number, month: number, mondayFirst: boolean): MonthGrid {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDow = new Date(year, month, 1).getDay(); // 0 = Sunday
  const offset = mondayFirst ? (firstDow + 6) % 7 : firstDow;
  const cells: Array<{ day: number; weekday: number } | null> = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, weekday: (offset + d - 1) % 7 });
  }
  const trailing = (7 - (cells.length % 7)) % 7;
  return { year, month, cells, trailing };
}

function calendarPageHtml(year: number, month: number | null, mondayFirst: boolean): string {
  const headers = mondayFirst ? DOW_MON_FIRST : DOW_SUN_FIRST;
  const weekendIdx = mondayFirst ? new Set([5, 6]) : new Set([0, 6]);
  const monthTable = (m: number, y: number, mini = false) => {
    const g = buildMonthGrid(y, m, mondayFirst);
    const rows: Array<MonthGrid["cells"]> = [];
    for (let i = 0; i < g.cells.length + g.trailing; i += 7) {
      rows.push(g.cells.slice(i, i + 7));
    }
    const cellSize = mini ? "22px" : "64px";
    const body = rows
      .map(
        (row) =>
          "<tr>" +
          row
            .map((cell) => {
              if (!cell) return `<td style="border:1px solid #ccc;height:${cellSize};"></td>`;
              const isWeekend = weekendIdx.has(cell.weekday);
              return `<td style="border:1px solid #ccc;height:${cellSize};text-align:center;vertical-align:top;${isWeekend ? "color:#b91c1c;" : ""}">${cell.day}</td>`;
            })
            .join("") +
          "</tr>",
      )
      .join("");
    return `<table style="border-collapse:collapse;width:${mini ? "100%" : "100%"};table-layout:fixed;${mini ? "font-size:10px;" : ""}">
      <thead><tr>${headers.map((h) => `<th style="border:1px solid #ccc;background:#f3f4f6;padding:3px;font-weight:600;">${h}</th>`).join("")}</tr></thead>
      <tbody>${body}</tbody>
    </table>`;
  };

  const title =
    month !== null
      ? `${MONTHS[month]} ${year}`
      : String(year);

  const content =
    month !== null
      ? monthTable(month, year)
      : `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">
          ${MONTHS.map((_, m) => `<div><div style="text-align:center;font-weight:bold;margin-bottom:4px;">${MONTHS[m]}</div>${monthTable(m, year, true)}</div>`).join("")}
        </div>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>Calendar — ${title}</title>
<style>
  @page { margin: 12mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; background: #fff; margin: 0; }
  h1 { font-size: 22px; margin: 0 0 16px; text-align: center; }
</style>
</head>
<body>
<h1>${title}</h1>
${content}
</body>
</html>`;
}

function CalendarGenerator() {
  const [mode, setMode] = useState<"month" | "year">("month");
  const [year, setYear] = useState(2026);
  const [month, setMonth] = useState(0);
  const [mondayFirst, setMondayFirst] = useState(true);
  // Time is read after mount so prerendering never sees an unstable value.
  const [today, setToday] = useState<Date | null>(null);
  useEffect(() => {
    const d = new Date();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount-only client init
    setToday(d);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  }, []);

  const grid = useMemo(
    () => buildMonthGrid(year, month, mondayFirst),
    [year, month, mondayFirst],
  );

  const headers = mondayFirst ? DOW_MON_FIRST : DOW_SUN_FIRST;
  const weekendIdx = mondayFirst ? new Set([5, 6]) : new Set([0, 6]);

  const isToday = (day: number) =>
    !!today && today.getFullYear() === year && today.getMonth() === month && today.getDate() === day;

  const prevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else setMonth(month - 1);
  };
  const nextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else setMonth(month + 1);
  };

  const rows: Array<MonthGrid["cells"]> = [];
  for (let i = 0; i < grid.cells.length + grid.trailing; i += 7) {
    rows.push(grid.cells.slice(i, i + 7));
  }

  const print = () => printCalendar(calendarPageHtml(year, mode === "month" ? month : null, mondayFirst));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          {(["month", "year"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={cn(
                "rounded-lg border px-4 py-1.5 text-sm font-medium capitalize transition",
                mode === m
                  ? "border-[#163D2B]/60 bg-[#163D2B]/10 text-[#163D2B]"
                  : "border-[#121212]/15 text-muted hover:text-cream",
              )}
            >
              {m} view
            </button>
          ))}
        </div>
        <Field label="Year" className="w-28">
          <input
            type="number"
            min={1}
            max={9999}
            value={year}
            onChange={(e) => setYear(Math.max(1, Math.min(9999, Number(e.target.value) || 2026)))}
            className={inputCls}
          />
        </Field>
        {mode === "month" && (
          <Field label="Month" className="w-44">
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className={inputCls}
            >
              {MONTHS.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
        )}
        <Field label="Week starts" className="w-40">
          <select
            value={mondayFirst ? "mon" : "sun"}
            onChange={(e) => setMondayFirst(e.target.value === "mon")}
            className={inputCls}
          >
            <option value="mon">Monday</option>
            <option value="sun">Sunday</option>
          </select>
        </Field>
        <div className="flex items-center gap-3 pb-2.5">
          {mode === "month" && (
            <>
              <SecondaryButton onClick={prevMonth} className="!px-3 !py-1.5">
                ←
              </SecondaryButton>
              <SecondaryButton onClick={nextMonth} className="!px-3 !py-1.5">
                →
              </SecondaryButton>
            </>
          )}
          <PrimaryButton onClick={print}>Print</PrimaryButton>
          <ResetButton
            onClick={() => {
              setYear((today ?? new Date(2026, 0, 1)).getFullYear());
              setMonth((today ?? new Date(2026, 0, 1)).getMonth());
            }}
          />
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">
        The Print button opens a clean, black-on-white calendar sized for paper — use your
        browser’s “Save as PDF” in the print dialog to get a PDF.
      </p>

      {/* Month grid */}
      <div className="mt-5 rounded-xl border border-[#121212]/12 bg-[#f6f1e6] p-4">
        <h3 className="mb-3 text-center text-lg font-semibold text-[#163D2B]">
          {MONTHS[month]} {year}
        </h3>
        <table className="w-full table-fixed border-collapse">
          <thead>
            <tr>
              {headers.map((h) => (
                <th key={h} className="border border-[#121212]/12 px-1 py-2 text-xs font-semibold uppercase tracking-wider text-muted">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => {
                  const isWeekend = cell !== null && weekendIdx.has(cell.weekday);
                  return (
                    <td
                      key={ci}
                      className={cn(
                        "h-14 border border-[#121212]/12 px-1.5 py-1 text-sm align-top",
                        cell === null
                          ? "bg-white/[0.02]"
                          : isWeekend
                            ? "text-red-300/90"
                            : "text-cream",
                        cell !== null && isToday(cell.day) && "bg-[#163D2B]/10 font-bold text-[#163D2B]",
                      )}
                    >
                      {cell?.day ?? ""}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Year grid */}
      {mode === "year" && (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MONTHS.map((name, m) => {
            const g = buildMonthGrid(year, m, mondayFirst);
            const yr: Array<MonthGrid["cells"]> = [];
            for (let i = 0; i < g.cells.length + g.trailing; i += 7) yr.push(g.cells.slice(i, i + 7));
            return (
              <div key={name} className="rounded-xl border border-[#121212]/12 bg-[#f6f1e6] p-3">
                <div className="mb-2 text-center text-sm font-semibold text-[#163D2B]">{name}</div>
                <table className="w-full table-fixed border-collapse text-xs">
                  <thead>
                    <tr>
                      {headers.map((h) => (
                        <th key={h} className="pb-1 text-[10px] font-medium text-muted">
                          {h[0]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {yr.map((row, ri) => (
                      <tr key={ri}>
                        {row.map((cell, ci) => {
                          const isWeekend = cell !== null && weekendIdx.has(cell.weekday);
                          return (
                            <td
                              key={ci}
                              className={cn(
                                "h-7 text-center",
                                cell === null ? "" : isWeekend ? "text-red-300/80" : "text-cream",
                                cell !== null && isToday(cell.day) && "rounded-full bg-lime/25 font-bold text-[#163D2B]",
                              )}
                            >
                              {cell?.day ?? ""}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* Local print helper (hidden iframe → browser print dialog). */
function printCalendar(html: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.srcdoc = html;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (win) {
      win.focus();
      win.print();
    }
    window.setTimeout(() => iframe.remove(), 3000);
  };
}

/* ════════════════════════════════════════════════════════════════
   Random Number Generator
   ════════════════════════════════════════════════════════════════ */

type SortMode = "none" | "asc" | "desc";

function RandomNumberGenerator() {
  const [min, setMin] = useState("1");
  const [max, setMax] = useState("100");
  const [count, setCount] = useState("5");
  const [unique, setUnique] = useState(false);
  const [sort, setSort] = useState<SortMode>("none");
  const [results, setResults] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generate = () => {
    setError(null);
    const lo = Math.floor(Number(min));
    const hi = Math.floor(Number(max));
    const n = Math.floor(Number(count));
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
      setError("Min and max must be whole numbers.");
      setResults(null);
      return;
    }
    if (lo > hi) {
      setError("Min must be less than or equal to max.");
      setResults(null);
      return;
    }
    if (!Number.isFinite(n) || n < 1 || n > 10000) {
      setError("How many must be between 1 and 10,000.");
      setResults(null);
      return;
    }
    const rangeSize = hi - lo + 1;
    if (unique && n > rangeSize) {
      setError(`Cannot draw ${n} unique numbers from a range of only ${rangeSize}.`);
      setResults(null);
      return;
    }
    const out: number[] = [];
    if (unique) {
      if (rangeSize <= 1_000_000 && n > rangeSize / 4) {
        // Dense draws: shuffle a candidate slice.
        const pool: number[] = [];
        for (let v = lo; v <= hi; v++) pool.push(v);
        const sh = shuffled(pool);
        for (let i = 0; i < n; i++) out.push(sh[i] as number);
      } else {
        const seen = new Set<number>();
        while (seen.size < n) {
          seen.add(lo + randomInt(rangeSize));
        }
        out.push(...seen);
      }
    } else {
      for (let i = 0; i < n; i++) out.push(lo + randomInt(rangeSize));
    }
    if (sort === "asc") out.sort((a, b) => a - b);
    if (sort === "desc") out.sort((a, b) => b - a);
    setResults(out);
  };

  const text = results ? results.join("\n") : "";

  return (
    <div className="mx-auto max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Min">
          <input type="number" value={min} onChange={(e) => setMin(e.target.value)} className={inputCls} placeholder="1" />
        </Field>
        <Field label="Max">
          <input type="number" value={max} onChange={(e) => setMax(e.target.value)} className={inputCls} placeholder="100" />
        </Field>
        <Field label="How many">
          <input type="number" min={1} value={count} onChange={(e) => setCount(e.target.value)} className={inputCls} placeholder="5" />
        </Field>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-cream">
          <input
            type="checkbox"
            checked={unique}
            onChange={(e) => setUnique(e.target.checked)}
            className="h-4 w-4 accent-lime"
          />
          Unique draws (no repeats)
        </label>
        <Field label="Sort results" className="w-44">
          <select value={sort} onChange={(e) => setSort(e.target.value as SortMode)} className={inputCls}>
            <option value="none">No sorting</option>
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </Field>
        <div className="flex items-center gap-3 pb-2">
          <PrimaryButton onClick={generate}>Generate</PrimaryButton>
          <ResetButton
            onClick={() => {
              setResults(null);
              setError(null);
            }}
          />
        </div>
      </div>

      {error && <ErrorNote>{error}</ErrorNote>}

      {results && (
        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <label className={labelCls + " !mb-0"}>
              {results.length} number{results.length === 1 ? "" : "s"} — crypto.getRandomValues()
            </label>
            <CopyButton text={text} label="Copy all" />
          </div>
          <div className="flex flex-wrap gap-2 rounded-xl border border-[#121212]/12 bg-[#f6f1e6] p-4">
            {results.map((n, i) => (
              <span
                key={i}
                className="rounded-lg border border-[#163D2B]/30 bg-[#163D2B]/10 px-3 py-1.5 font-mono text-sm text-[#163D2B]"
              >
                {n}
              </span>
            ))}
          </div>
          <div className="mt-3">
            <DownloadButton onClick={() => downloadText(text + "\n", "random-numbers.txt", "text/plain")} label="Download .txt" />
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-muted">
        Values come from the browser’s cryptographic random source with rejection sampling, so
        every number in the range is equally likely (no modulo bias). Integers only.
      </p>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Random Name Picker
   ════════════════════════════════════════════════════════════════ */

function RandomNamePicker() {
  const [namesText, setNamesText] = useState("");
  const [winnerCount, setWinnerCount] = useState("1");
  const [prizesText, setPrizesText] = useState("");
  const [removeWinners, setRemoveWinners] = useState(false);
  const [winners, setWinners] = useState<string[]>([]);
  const [pickCount, setPickCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const names = useMemo(
    () =>
      namesText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s !== ""),
    [namesText],
  );

  const prizeLabels = useMemo(
    () =>
      prizesText
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter((s) => s !== ""),
    [prizesText],
  );

  const excluded = useMemo(() => new Set(removeWinners ? winners : []), [removeWinners, winners]);
  const pool = useMemo(() => names.filter((n) => !excluded.has(n)), [names, excluded]);

  const pick = () => {
    setError(null);
    const n = Math.floor(Number(winnerCount));
    if (pool.length === 0) {
      setError("Add at least one name first (one name per line).");
      setWinners([]);
      return;
    }
    if (!Number.isFinite(n) || n < 1) {
      setError("Winners must be at least 1.");
      return;
    }
    if (n > pool.length) {
      setError(`Only ${pool.length} name${pool.length === 1 ? "" : "s"} available in the pool.`);
      return;
    }
    setWinners(shuffled(pool).slice(0, n));
    setPickCount((c) => c + 1);
    playBeep(2, 0.25, 660);
  };

  const resultText = winners
    .map((w, i) => `${prizeLabels[i] ?? `Winner ${i + 1}`}: ${w}`)
    .join("\n");

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div>
        <Field label="Names — one per line">
          <TextArea
            value={namesText}
            onChange={setNamesText}
            rows={10}
            placeholder={"Alice\nBob\nCarol\nDave"}
          />
        </Field>
        <p className="mt-2 text-xs text-muted">
          {names.length} name{names.length === 1 ? "" : "s"} loaded
          {removeWinners && winners.length > 0
            ? ` · ${pool.length} left after removing ${winners.length} winner${winners.length === 1 ? "" : "s"}`
            : ""}
          {names.length !== new Set(names.map((n) => n.toLowerCase())).size
            ? " · duplicates are drawn separately"
            : ""}
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="How many winners">
            <input
              type="number"
              min={1}
              value={winnerCount}
              onChange={(e) => setWinnerCount(e.target.value)}
              className={inputCls}
              placeholder="1"
            />
          </Field>
          <Field label="Prize labels (one per line, optional)">
            <TextArea
              value={prizesText}
              onChange={setPrizesText}
              rows={3}
              placeholder={"1st Prize\n2nd Prize\n3rd Prize"}
            />
          </Field>
        </div>
        <p className="mt-1 text-xs text-muted">
          Optional prize labels are matched to winners in order; any winner without a label gets a
          plain “Winner N” caption.
        </p>
        <label className="mt-3 flex cursor-pointer select-none items-center gap-2 text-sm text-cream">
          <input
            type="checkbox"
            checked={removeWinners}
            onChange={(e) => setRemoveWinners(e.target.checked)}
            className="h-4 w-4 accent-lime"
          />
          Remove winners from the pool for the next draw
        </label>
        <div className="mt-4 flex items-center gap-3">
          <PrimaryButton onClick={pick} disabled={names.length === 0}>
            {pickCount === 0 ? "Pick winners" : "Pick again"}
          </PrimaryButton>
          <ResetButton
            onClick={() => {
              setWinners([]);
              setPickCount(0);
              setError(null);
            }}
          />
        </div>
        {error && <ErrorNote>{error}</ErrorNote>}
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className={labelCls + " !mb-0"}>Winners</label>
          {winners.length > 0 && <CopyButton text={resultText} />}
        </div>
        {winners.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#121212]/15 bg-[#f6f1e6] px-6 py-12 text-center text-sm text-muted">
            Winners appear here — every draw uses crypto.getRandomValues(), so all names in the
            pool are equally likely.
          </div>
        ) : (
          <div className="space-y-3">
            {winners.map((w, i) => (
              <div
                key={`${pickCount}-${i}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#163D2B]/30 bg-[#163D2B]/10 px-4 py-3"
              >
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-[#163D2B]">
                    {prizeLabels[i] ?? `Winner ${i + 1}`}
                  </div>
                  <div className="mt-0.5 text-lg font-semibold text-cream">{w}</div>
                </div>
                <span className="text-2xl" aria-hidden>
                  🎉
                </span>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-3">
              <DownloadButton
                onClick={() => downloadText(resultText + "\n", "winners.txt", "text/plain")}
                label="Download .txt"
              />
              <SecondaryButton onClick={() => setWinners([])}>Clear</SecondaryButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   Registry
   ════════════════════════════════════════════════════════════════ */

export const productivityTools: Record<string, ToolComponent> = {
  "pomodoro-timer": PomodoroTimer,
  stopwatch: Stopwatch,
  "countdown-timer": CountdownTimer,
  "calendar-generator": CalendarGenerator,
  "random-number-generator": RandomNumberGenerator,
  "random-name-picker": RandomNamePicker,
};
