"use client";

import { motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import {
  useLayoutEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from "react";

/** Animates its own height whenever its content changes size. */
export function AutoHeight({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setHeight(entry.borderBoxSize[0]?.blockSize ?? el.offsetHeight);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <motion.div
      className={className}
      initial={false}
      animate={{ height }}
      transition={{ type: "spring", stiffness: 380, damping: 34 }}
      style={{ overflow: "hidden" }}
    >
      <div ref={inner}>{children}</div>
    </motion.div>
  );
}

/** The pill segmented control used for AM/PM/NOC, Details/Tasks, All/Archived. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  id,
  className = "",
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
  id: string;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={`flex w-full items-center rounded-full bg-white/10 p-1.25 shadow-soft ${className}`}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(opt)}
            className="relative flex flex-1 items-center justify-center rounded-full px-4 py-3"
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-full bg-surface"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span
              className={`relative text-base leading-none transition-colors duration-200 text-trim ${
                active ? "text-brand-deep" : "text-muted hover:text-ink-body"
              }`}
            >
              {opt}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
  loading?: boolean;
};

/** The 24px-radius popover buttons ("Create Shift", "Deny", …). */
export function PopButton({
  variant = "primary",
  loading,
  children,
  className = "",
  ...rest
}: BtnProps) {
  const reduce = useReducedMotion();
  const styles =
    variant === "primary"
      ? "bg-brand text-white hover:bg-brand-bright"
      : "border border-black text-black hover:bg-black hover:text-white";
  return (
    <motion.button
      type="button"
      whileTap={reduce ? undefined : { scale: 0.97 }}
      className={`relative flex flex-1 items-center justify-center overflow-hidden rounded-3xl p-4 text-base leading-none font-medium tracking-ui transition-colors duration-200 disabled:cursor-default ${styles} ${className}`}
      {...(rest as object)}
    >
      <span className={`text-trim transition-opacity ${loading ? "opacity-0" : ""}`}>
        {children}
      </span>
      {loading && <Spinner className="absolute" />}
    </motion.button>
  );
}

export function Spinner({ className = "" }: { className?: string }) {
  return (
    <motion.span
      aria-hidden
      className={`block size-4 rounded-full border-2 border-current border-t-transparent ${className}`}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, ease: "linear", duration: 0.7 }}
    />
  );
}

export function Avatar({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <Image
      src="/assets/avatar-cna.png"
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className}`}
    />
  );
}

/** Uppercase-free section label used in every popover ("Assigned CNA", "Schedule", …). */
export function FieldLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`text-sm leading-normal tracking-ui text-muted text-trim ${className}`}>
      {children}
    </p>
  );
}
