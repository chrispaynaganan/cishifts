"use client";

import { motion, useAnimationControls } from "motion/react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export type AuthFieldHandle = { focus: () => void; shake: () => void };

type Props = {
  icon: "user" | "mail" | "lock";
  type?: "text" | "email" | "password";
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  invalid?: boolean;
  /** Forces the focused look while the demo auto-types into the field. */
  highlighted?: boolean;
};

export const AuthField = forwardRef<AuthFieldHandle, Props>(function AuthField(
  { icon, type = "text", placeholder, value, onChange, autoComplete, invalid, highlighted },
  ref,
) {
  const input = useRef<HTMLInputElement>(null);
  const controls = useAnimationControls();
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);
  const active = focused || highlighted;

  useImperativeHandle(ref, () => ({
    focus: () => input.current?.focus(),
    shake: () => {
      controls.start({ x: [0, -8, 7, -5, 3, 0], transition: { duration: 0.42 } });
    },
  }));

  const isPassword = type === "password";

  return (
    <motion.label
      animate={controls}
      className={`flex w-full cursor-text items-center gap-4.75 rounded-full border bg-field px-4 py-2.75 transition-[border-color,box-shadow] duration-200 ${
        invalid
          ? "border-brand shadow-field"
          : active
            ? "border-field-focus shadow-field"
            : "border-transparent"
      }`}
    >
      <img
        src={`/assets/icon-${icon}.svg`}
        alt=""
        width={24}
        height={24}
        className={`size-6 shrink-0 transition-opacity ${active || value ? "opacity-100" : "opacity-70"}`}
      />
      <input
        ref={input}
        type={isPassword && !reveal ? "password" : type === "password" ? "text" : type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-label={placeholder}
        aria-invalid={invalid || undefined}
        className="min-w-0 flex-1 bg-transparent text-base leading-6 tracking-ui text-ink-strong outline-none placeholder:text-placeholder"
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setReveal((r) => !r)}
          aria-label={reveal ? "Hide password" : "Show password"}
          className="relative grid h-4 w-6.5 shrink-0 place-items-center"
        >
          <img src="/assets/icon-eye.svg" alt="" width={25.5} height={16} className="h-4 w-6.5" />
          <motion.span
            aria-hidden
            initial={false}
            animate={{ scaleX: reveal ? 1 : 0 }}
            className="absolute h-0.5 w-7.5 origin-left -rotate-28 rounded-full bg-muted"
          />
        </button>
      )}
    </motion.label>
  );
});

export function passwordStrength(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) || /[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  if (score >= 3) return 3;
  if (score === 2) return 2;
  return 1;
}

const STRENGTH = {
  1: { color: "bg-danger", label: "Weak password" },
  2: { color: "bg-brand-orange", label: "Almost there" },
  3: { color: "bg-success", label: "Strong password" },
} as const;

/** Three-segment strength bar that sits under the password field. */
export function StrengthMeter({ password }: { password: string }) {
  const level = passwordStrength(password);
  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      className="w-full overflow-hidden"
    >
      <div className="flex h-1.25 w-full overflow-hidden rounded-sm bg-field">
        {[1, 2, 3].map((seg) => (
          <div key={seg} className="h-full flex-1 overflow-hidden">
            <motion.div
              className={`h-full origin-left ${level ? STRENGTH[level].color : ""}`}
              initial={false}
              animate={{ scaleX: level >= seg ? 1 : 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 26, delay: (seg - 1) * 0.06 }}
            />
          </div>
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        {level ? STRENGTH[level].label : ""}
      </p>
    </motion.div>
  );
}
