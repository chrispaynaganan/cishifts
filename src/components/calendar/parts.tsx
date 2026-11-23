"use client";

import { AnimatePresence, animate, motion, useMotionValue, useTransform } from "motion/react";
import { useEffect, useState } from "react";
import { Avatar, FieldLabel, Segmented } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { CNA_TASKS, formatCellDate, START_TIME, STAFF, type Period, type Shift } from "@/lib/calendar-data";

export function CnaCard({ name }: { name: string }) {
  const toast = useToast();
  return (
    <div className="flex w-full items-center justify-between rounded-4xl border border-line p-4">
      <div className="flex items-center gap-4">
        <Avatar size={32} className="size-8" />
        <div className="flex flex-col gap-3 leading-normal whitespace-nowrap">
          <p className="text-base font-medium text-ink-strong text-trim">{name}</p>
          <p className="text-2xs text-muted italic text-trim">Certified Nursing Assistant</p>
        </div>
      </div>
      <div className="relative h-4.75 w-14.5">
        <img src="/assets/contact-actions.svg" alt="" width={58} height={19} className="h-4.75 w-14.5" />
        <button
          type="button"
          aria-label={`Message ${name}`}
          onClick={() => toast(`Chat with ${name.split(" ")[0]} opens in the full app.`)}
          className="absolute inset-y-0 left-0 w-1/2 rounded-md transition-colors hover:bg-black/5"
        />
        <button
          type="button"
          aria-label={`View ${name}'s profile`}
          onClick={() => toast(`${name}'s CNA profile opens in the full app.`)}
          className="absolute inset-y-0 right-0 w-1/2 rounded-md transition-colors hover:bg-black/5"
        />
      </div>
    </div>
  );
}

/** "Schedule — Edit" block. Edit swaps the summary for an inline AM/PM/NOC switch. */
export function ScheduleBlock({
  shift,
  onChangePeriod,
}: {
  shift: Shift;
  onChangePeriod?: (p: Period) => void;
}) {
  const [editing, setEditing] = useState(false);
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-start justify-between text-sm tracking-ui">
        <FieldLabel>Schedule</FieldLabel>
        {onChangePeriod && (
          <button
            type="button"
            onClick={() => setEditing((e) => !e)}
            className="leading-normal text-ink-soft underline decoration-from-font underline-offset-2 transition-colors hover:text-brand text-trim"
          >
            {editing ? "Done" : "Edit"}
          </button>
        )}
      </div>
      <AnimatePresence mode="popLayout" initial={false}>
        {editing && onChangePeriod ? (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <Segmented
              id={`edit-${shift.id}`}
              options={["AM", "PM", "NOC"] as const}
              value={shift.period}
              onChange={onChangePeriod}
            />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div className="flex w-full flex-col items-end gap-3 leading-normal whitespace-nowrap">
        <div className="flex w-full items-start justify-between text-base">
          <motion.p key={shift.period} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="text-black text-trim">
            {shift.period} Shift
          </motion.p>
          <p className="text-muted text-trim">{formatCellDate(shift.cell)}</p>
        </div>
        <p className="text-xs text-muted italic text-trim">Starts at {START_TIME[shift.period]}</p>
      </div>
    </div>
  );
}

/** Dashed "Add assignees from My Staff" box that expands into a staff picker. */
export function StaffPicker({
  value,
  onChange,
  exclude = [],
}: {
  value: string[];
  onChange: (v: string[]) => void;
  exclude?: string[];
}) {
  const [open, setOpen] = useState(false);
  const toggle = (n: string) =>
    onChange(value.includes(n) ? value.filter((x) => x !== n) : [...value, n]);

  return (
    <div className="flex w-full flex-col gap-3">
      <AnimatePresence initial={false}>
        {value.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap gap-2"
          >
            <AnimatePresence initial={false}>
              {value.map((n) => (
                <motion.button
                  key={n}
                  type="button"
                  layout
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  onClick={() => toggle(n)}
                  className="group flex items-center gap-2 rounded-full bg-chip-sched py-1 pr-2.5 pl-1 text-sm text-chip-sched-fg"
                >
                  <Avatar size={20} className="size-5" />
                  {n}
                  <span className="text-chip-sched-fg/60 transition-colors group-hover:text-brand">×</span>
                </motion.button>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`flex w-full items-center justify-center gap-2 rounded-4xl border border-dashed border-brand bg-brand-tint px-4 transition-[padding,background-color] duration-300 hover:bg-brand/15 ${
          value.length ? "py-3.5" : "py-6.75"
        }`}
      >
        <motion.img
          src="/assets/icon-plus-red.svg"
          alt=""
          width={13}
          height={13}
          animate={{ rotate: open ? 45 : 0 }}
          className="size-3.25"
        />
        <span className="text-sm leading-normal text-brand text-trim">
          {open ? "Done adding" : value.length ? "Add more from My Staff" : "Add assignees from My Staff"}
        </span>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="scrollbar-none -mx-1 max-h-52 overflow-y-auto"
          >
            {STAFF.filter((n) => !exclude.includes(n)).map((n, i) => {
              const on = value.includes(n);
              return (
                <motion.li
                  key={n}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0, transition: { delay: i * 0.025 } }}
                >
                  <button
                    type="button"
                    onClick={() => toggle(n)}
                    className={`flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left text-sm transition-colors ${
                      on ? "bg-surface" : "hover:bg-surface"
                    }`}
                  >
                    <Avatar size={24} className="size-6" />
                    <span className="flex-1 text-ink-strong">{n}</span>
                    <span
                      className={`grid size-5 place-items-center rounded-full border transition-colors ${
                        on ? "border-brand bg-brand text-white" : "border-line-grid"
                      }`}
                    >
                      {on && (
                        <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
                          <motion.path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />
                        </svg>
                      )}
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

/** CNA checklist used on the "Tasks" tab. */
export function TaskList({ period, doneCount = 0, readOnly }: { period: Period; doneCount?: number; readOnly?: boolean }) {
  const [done, setDone] = useState<boolean[]>(() => CNA_TASKS[period].map((_, i) => i < doneCount));
  const count = done.filter(Boolean).length;
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex items-center justify-between">
        <FieldLabel>Tasks for this shift</FieldLabel>
        <span className="text-xs text-muted tabular-nums">
          {count}/{done.length} done
        </span>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface">
        <motion.div className="h-full rounded-full bg-success-ring" animate={{ width: `${(count / done.length) * 100}%` }} />
      </div>
      <ul className="flex flex-col gap-1">
        {CNA_TASKS[period].map((t, i) => (
          <motion.li key={t} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }}>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))}
              className="flex w-full items-center gap-3 rounded-2xl px-2 py-2 text-left text-sm transition-colors enabled:hover:bg-surface"
            >
              <span
                className={`grid size-4.5 shrink-0 place-items-center rounded-check border-[1.5px] transition-colors ${
                  done[i] ? "border-success bg-success text-white" : "border-input-border"
                }`}
              >
                {done[i] && (
                  <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
                    <motion.path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />
                  </svg>
                )}
              </span>
              <span className={`transition-colors ${done[i] ? "text-muted line-through" : "text-ink-strong"}`}>{t}</span>
            </button>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/** Five stars with half-star precision, hover preview and a little pop on select. */
export function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value;
  return (
    <div className="flex w-full items-center justify-center" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, shown - (n - 1)));
        const pick = (e: React.MouseEvent<HTMLButtonElement>) => {
          const r = e.currentTarget.getBoundingClientRect();
          return e.clientX - r.left < r.width / 2 ? n - 0.5 : n;
        };
        return (
          <div key={n} className="flex flex-1 items-center justify-center">
            <motion.button
              type="button"
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
              onMouseMove={(e) => setHover(pick(e))}
              onClick={(e) => onChange(pick(e))}
              whileHover={{ scale: 1.12, rotate: -6 }}
              whileTap={{ scale: 0.85 }}
              animate={value >= n - 0.5 && hover === null ? { scale: [1, 1.25, 1] } : undefined}
              transition={{ duration: 0.3, delay: (n - 1) * 0.05 }}
              className="relative size-10"
            >
              <img src="/assets/star-empty.svg" alt="" width={38} height={36} className="absolute top-0 left-0.5 h-9 w-9.5" />
              <span
                className="absolute top-0 left-0.5 h-9 overflow-hidden transition-[width] duration-150"
                style={{ width: `${fill * 100}%` }}
              >
                <img src="/assets/star-1.svg" alt="" width={38} height={36} className="h-9 w-9.5 max-w-none" />
              </span>
            </motion.button>
          </div>
        );
      })}
    </div>
  );
}

/** The green "100%" badge, drawn as an animated ring that counts up. */
export function CompletionRing({ percent }: { percent: number }) {
  const mv = useMotionValue(0);
  const label = useTransform(mv, (v) => `${Math.round(v)}%`);
  const dash = useTransform(mv, (v) => v / 100);
  useEffect(() => {
    const c = animate(mv, percent, { duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.2 });
    return () => c.stop();
  }, [mv, percent]);
  return (
    <div className="relative grid size-13.75 shrink-0 place-items-center">
      <svg viewBox="0 0 56 56" className="absolute inset-0 -rotate-90" aria-hidden>
        <circle cx="28" cy="28" r="27" fill="none" strokeWidth="2" className="stroke-success-ring/15" />
        <motion.circle
          cx="28"
          cy="28"
          r="27"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          className="stroke-success-ring"
          style={{ pathLength: dash }}
        />
      </svg>
      <motion.span className="text-base tracking-ui text-success tabular-nums">{label}</motion.span>
    </div>
  );
}

/** Two-column row used in Time-Off, Availability and Biometrics. */
export function Row({ left, right, tone = "muted" }: { left: string; right: string; tone?: "muted" | "ok" }) {
  return (
    <div className="flex w-full items-start justify-between text-base leading-normal whitespace-nowrap">
      <p className="text-black text-trim">{left}</p>
      <p className={`text-trim ${tone === "ok" ? "text-available" : "text-muted"}`}>{right}</p>
    </div>
  );
}
