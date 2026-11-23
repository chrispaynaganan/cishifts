"use client";

import { motion, useReducedMotion } from "motion/react";
import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";

export type Placement = "side" | "below" | "center";

type Props = {
  /** Element the popover points at. Looked up again on every resize. */
  anchor: () => HTMLElement | null;
  /** Positioning context (the calendar <main>). */
  container: RefObject<HTMLElement | null>;
  placement?: Placement;
  width?: "md" | "sm";
  children: ReactNode;
  label: string;
};

const GAP = 22; // pointer is 20px wide + a hair of air, as in the Figma frames
const EDGE = 12;
const TOP_PREF = 96;

type Pos = { left: number; top: number; pointerY: number; side: "left" | "right" };

/**
 * The white, 32px-radius card used for every calendar interaction in the design.
 * Sits next to the chip it belongs to, with the little rounded pointer.
 */
export function Popover({ anchor, container, placement = "side", width = "md", children, label }: Props) {
  const card = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<Pos | null>(null);
  const reduce = useReducedMotion();

  useLayoutEffect(() => {
    const el = card.current;
    const root = container.current;
    if (!el || !root) return;

    const place = () => {
      const a = anchor();
      const box = root.getBoundingClientRect();
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const maxTop = Math.max(EDGE, root.clientHeight - h - EDGE);

      if (placement === "center" || !a) {
        setPos({
          left: Math.max(EDGE, (root.clientWidth - w) / 2),
          top: Math.min(maxTop, Math.max(EDGE, root.clientHeight * 0.22)),
          pointerY: -1,
          side: "left",
        });
        return;
      }

      // Use layout size (offsetWidth/Height) around the visual centre so chips that are
      // still mid scale-in animation don't skew the position.
      const r = a.getBoundingClientRect();
      const cx = r.left + r.width / 2 - box.left;
      const cy = r.top + r.height / 2 - box.top;
      const aw = a.offsetWidth || r.width;
      const ah = a.offsetHeight || r.height;
      const ax = { left: cx - aw / 2, right: cx + aw / 2, top: cy - ah / 2, bottom: cy + ah / 2 };

      if (placement === "below") {
        setPos({
          left: Math.min(root.clientWidth - w - EDGE, Math.max(EDGE, ax.right - w)),
          top: Math.min(maxTop, ax.bottom + 12),
          pointerY: -1,
          side: "left",
        });
        return;
      }

      const centerY = (ax.top + ax.bottom) / 2;
      const fitsRight = ax.right + GAP + w <= root.clientWidth - EDGE;
      const side = fitsRight ? "left" : "right"; // which side of the card the pointer is on
      const left = fitsRight ? ax.right + GAP : ax.left - GAP - w;
      // Prefer to stay below the month header when there's room.
      const minTop = h + TOP_PREF + EDGE <= root.clientHeight ? Math.min(TOP_PREF, centerY - 36) : EDGE;
      const top = Math.min(maxTop, Math.max(minTop, EDGE, centerY - h / 2));
      setPos({
        left: Math.max(EDGE, left),
        top,
        pointerY: Math.min(h - 36, Math.max(36, centerY - top)),
        side,
      });
    };

    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    ro.observe(root);
    window.addEventListener("resize", place);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", place);
    };
  }, [anchor, container, placement]);

  const origin = pos
    ? pos.pointerY < 0
      ? placement === "below"
        ? "top right"
        : "center top"
      : `${pos.side === "left" ? "0%" : "100%"} ${pos.pointerY}px`
    : "center";

  return (
    <motion.div
      ref={card}
      role="dialog"
      aria-label={label}
      className={`absolute z-30 ${width === "md" ? "w-86.25" : "w-76"}`}
      style={{ left: pos?.left ?? -9999, top: pos?.top ?? 0, transformOrigin: origin }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.9, filter: "blur(6px)" }}
      animate={pos ? { opacity: 1, scale: 1, filter: "blur(0px)" } : { opacity: 0 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.94, filter: "blur(4px)", transition: { duration: 0.16 } }}
      transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.8 }}
    >
      <motion.div
        layout="position"
        className="relative flex flex-col rounded-4xl bg-white drop-shadow-popover"
        transition={{ type: "spring", stiffness: 380, damping: 34 }}
      >
        {children}
        {pos && pos.pointerY >= 0 && (
          <motion.img
            src="/assets/popover-pointer.svg"
            alt=""
            aria-hidden
            width={23.5}
            height={21.5}
            initial={false}
            animate={{ top: pos.pointerY }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className={`pointer-events-none absolute h-5.5 w-6 -translate-y-1/2 ${
              pos.side === "left" ? "-left-4.5 -rotate-90" : "-right-4.5 rotate-90"
            }`}
          />
        )}
      </motion.div>
    </motion.div>
  );
}

/** Title bar shared by all popovers: label on the left, close × on the right. */
export function PopoverHeader({ title, onClose }: { title: ReactNode; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between rounded-t-3xl border-b border-line p-4">
      <h3 className="text-lg leading-none tracking-ui text-black text-trim">{title}</h3>
      <motion.button
        type="button"
        onClick={onClose}
        aria-label="Close"
        whileHover={{ rotate: 90, scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="-m-2 grid size-7.5 place-items-center rounded-full transition-colors hover:bg-surface"
      >
        <img src="/assets/icon-close.svg" alt="" width={14} height={14} className="size-3.5" />
      </motion.button>
    </div>
  );
}
