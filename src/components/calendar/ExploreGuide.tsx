"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { Goal } from "./popovers";

const GOALS: { key: Goal; text: string }[] = [
  { key: "notifs", text: "Check the notifications bell" },
  { key: "open", text: "Fill a blue OPEN shift with a CNA" },
  { key: "template", text: "Click an empty day and use a template" },
  { key: "resend", text: "Send a red Urgent shift back to staff" },
  { key: "rate", text: "Rate a grey COMPLETED shift" },
  { key: "timeoff", text: "Review Ivy’s time-off request" },
];

/** Floating checklist so first-time visitors know what to poke at. */
export function ExploreGuide({ done, quiet }: { done: Set<Goal>; quiet?: boolean }) {
  const [open, setOpen] = useState(false);
  const count = GOALS.filter((g) => done.has(g.key)).length;
  const all = count === GOALS.length;

  useEffect(() => {
    const t = window.setTimeout(() => setOpen(true), 2600);
    return () => window.clearTimeout(t);
  }, []);

  // Step out of the way while the visitor is busy with a popover.
  useEffect(() => {
    if (quiet) setOpen(false);
  }, [quiet]);

  return (
    <div className="fixed right-6 bottom-6 z-40 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
            className="w-80 origin-bottom-right rounded-4xl bg-white p-5 shadow-panel"
          >
            <div className="mb-1 flex items-center justify-between">
              <p className="text-base font-medium text-ink">{all ? "You’ve seen it all 🎉" : "Things to try"}</p>
              <button type="button" onClick={() => setOpen(false)} aria-label="Hide checklist" className="grid size-7 place-items-center rounded-full text-muted transition-colors hover:bg-surface">
                <img src="/assets/icon-close.svg" alt="" width={14} height={14} className="size-3" />
              </button>
            </div>
            <p className="mb-4 text-xs leading-normal text-muted">
              Every screen from the CIShifts facility designs is live here. A few places to start:
            </p>
            <ul className="flex flex-col gap-2.5">
              {GOALS.map((g) => {
                const on = done.has(g.key);
                return (
                  <li key={g.key} className="flex items-center gap-3 text-sm">
                    <motion.span
                      animate={on ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                      className={`grid size-5 shrink-0 place-items-center rounded-full border transition-colors duration-300 ${
                        on ? "border-success-ring bg-success-ring text-white" : "border-line-grid"
                      }`}
                    >
                      {on && (
                        <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
                          <motion.path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />
                        </svg>
                      )}
                    </motion.span>
                    <span className={`transition-colors ${on ? "text-muted line-through" : "text-ink-strong"}`}>{g.text}</span>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        className="flex items-center gap-3 rounded-full bg-ink py-2.5 pr-4 pl-2.5 text-sm text-white shadow-panel"
      >
        <span className="relative grid size-7 place-items-center">
          <svg viewBox="0 0 28 28" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="14" cy="14" r="12" fill="none" strokeWidth="2.5" className="stroke-white/15" />
            <motion.circle
              cx="14"
              cy="14"
              r="12"
              fill="none"
              strokeWidth="2.5"
              strokeLinecap="round"
              className="stroke-brand-orange"
              initial={false}
              animate={{ pathLength: count / GOALS.length }}
              transition={{ type: "spring", stiffness: 120, damping: 20 }}
            />
          </svg>
          <span className="text-2xs tabular-nums">{count}</span>
        </span>
        Explore the prototype
      </motion.button>
    </div>
  );
}
