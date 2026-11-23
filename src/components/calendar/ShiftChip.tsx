"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Shift } from "@/lib/calendar-data";

const STYLE: Record<Shift["kind"], string> = {
  completed: "bg-chip-done text-chip-done-fg",
  ongoing: "bg-chip-live text-chip-live-fg",
  scheduled: "bg-chip-sched text-chip-sched-fg",
  open: "bg-chip-open text-chip-open-fg",
  called: "bg-chip-called text-chip-called-fg",
  urgent: "bg-chip-urgent text-chip-urgent-fg",
  draft: "border border-line-grid bg-white text-muted",
};

const RING: Record<Shift["kind"], string> = {
  completed: "ring-chip-done-fg/40",
  ongoing: "ring-chip-live-fg/40",
  scheduled: "ring-chip-sched-fg/40",
  open: "ring-chip-open-fg/40",
  called: "ring-chip-called-fg/40",
  urgent: "ring-chip-urgent-fg/40",
  draft: "ring-muted/30",
};

export function chipLabel(s: Shift): [string, string] {
  switch (s.kind) {
    case "completed":
      return [s.cna ?? "", "COMPLETED"];
    case "ongoing":
      return [s.cna ?? "", "ONGOING"];
    case "scheduled":
      return [`${s.period} Shift`, s.cna ?? ""];
    case "open":
      return [`${s.period} Shift`, "OPEN"];
    case "called":
      return [`${s.period} Shift`, "Called Off"];
    case "urgent":
      return [s.period, "Urgent"];
    case "draft":
      return ["New Shift", ""];
  }
}

type Props = {
  shift: Shift;
  active?: boolean;
  dimmed?: boolean;
  glow?: boolean;
  delay?: number;
  onClick: (el: HTMLElement) => void;
};

/** One pill in the month grid — colour-coded by shift status, as in the design legend. */
export function ShiftChip({ shift, active, dimmed, glow, delay = 0, onClick }: Props) {
  const reduce = useReducedMotion();
  const [left, right] = chipLabel(shift);
  const italicStatus = shift.kind === "ongoing" || shift.kind === "urgent";
  const strongStatus = ["completed", "ongoing", "open", "urgent"].includes(shift.kind);

  return (
    <motion.button
      type="button"
      layout="position"
      data-shift={shift.id}
      onClick={(e) => {
        e.stopPropagation();
        onClick(e.currentTarget);
      }}
      initial={reduce ? false : { opacity: 0, y: 8, scale: shift.fresh ? 0.6 : 0.96 }}
      animate={{
        opacity: dimmed ? 0.22 : 1,
        y: 0,
        scale: 1,
        transition: shift.fresh
          ? { type: "spring", stiffness: 520, damping: 18 }
          : { delay, type: "spring", stiffness: 380, damping: 28 },
      }}
      exit={{ opacity: 0, scale: 0.8, height: 0, marginTop: -4, transition: { duration: 0.25 } }}
      whileHover={reduce ? undefined : { y: -1.5, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`relative flex w-full shrink-0 items-center justify-between gap-2 rounded-full px-3 py-2 text-2xs 2xl:px-4 leading-none tracking-ui whitespace-nowrap transition-shadow duration-200 hover:shadow-soft ${STYLE[shift.kind]} ${
        active || glow ? `ring-2 ${RING[shift.kind]}` : ""
      }`}
    >
      {(shift.fresh || glow) && !reduce && (
        <motion.span
          aria-hidden
          className={`absolute inset-0 rounded-full ring-2 ${RING[shift.kind]}`}
          initial={{ opacity: 0.9, scale: 1 }}
          animate={{ opacity: 0, scale: 1.25 }}
          transition={{ duration: 1.1, repeat: glow ? Infinity : 2, ease: "easeOut" }}
        />
      )}
      <span className="flex min-w-0 items-center gap-1.5 truncate text-trim">
        {shift.kind === "urgent" && (
          <img src="/assets/icon-urgent.svg" alt="" width={11} height={10} className="h-2.5 w-2.75 shrink-0" />
        )}
        {left}
      </span>
      {right && (
        <span
          className={`truncate text-trim ${strongStatus ? "font-medium" : ""} ${italicStatus ? "italic" : ""}`}
        >
          {right}
        </span>
      )}
      {shift.resentTo && (
        <span aria-label="Resent" className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-payment ring-2 ring-white" />
      )}
    </motion.button>
  );
}
