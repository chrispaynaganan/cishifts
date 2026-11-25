"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import type { NurseShift } from "@/lib/nurse-data";

/** iOS status bar from the frames: 9:41 on the left, signal/wifi/battery on the right. */
export function StatusBar() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex h-13.25 items-start justify-between pt-5.75 pr-8.75 pl-15.75">
      <img src="/nurse/status-left.svg" alt="" width={36} height={14} className="h-3.5 w-9" />
      <img src="/nurse/status-right.svg" alt="" width={93} height={14} className="h-3.5 w-23.25" />
    </div>
  );
}

export function HomeIndicator() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex h-8.5 items-end justify-center bg-white pb-2">
      <span className="h-1.25 w-33.5 rounded-full bg-black" />
    </div>
  );
}

/** Round, softly shadowed 36px icon button (back, filter, download). */
export function CircleIcon({
  src,
  label,
  onClick,
}: {
  src: "btn-back" | "btn-filter" | "btn-download";
  label: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileTap={{ scale: 0.88 }}
      whileHover={{ scale: 1.06 }}
      className="relative size-9 shrink-0 rounded-full bg-white shadow-icon"
    >
      <img src={`/nurse/${src}.svg`} alt="" width={56} height={56} className="absolute -inset-x-2.5 -top-1.5 -bottom-3.5 size-14 max-w-none" />
    </motion.button>
  );
}

/** 151px header: back button, centred title, optional right action. */
export function ScreenHeader({
  title,
  onBack,
  right,
}: {
  title: string;
  onBack?: () => void;
  right?: ReactNode;
}) {
  return (
    <header className="relative z-20 flex h-37.75 shrink-0 items-center border-b border-line bg-white px-4 pt-17.5">
      <div className="flex w-18 justify-start">{onBack && <CircleIcon src="btn-back" label="Back" onClick={onBack} />}</div>
      <h1 className="flex-1 text-center text-title leading-normal font-medium tracking-heading text-black">{title}</h1>
      <div className="flex w-18 justify-end">{right}</div>
    </header>
  );
}

const TABS = [
  { key: "home", label: "Home", icon: "tab-home" },
  { key: "shifts", label: "Shifts", icon: "tab-shifts" },
  { key: "chatter", label: "Chatter", icon: "tab-chatter" },
  { key: "logs", label: "Logs", icon: "tab-logs" },
  { key: "profile", label: "Profile", icon: "tab-profile" },
] as const;
export type TabKey = (typeof TABS)[number]["key"];

/** Floating pill tab bar. Icons are masks so the active one can turn orange. */
export function TabBar({ active, onSelect }: { active: TabKey; onSelect: (t: TabKey) => void }) {
  return (
    <nav className="absolute inset-x-4 bottom-8.5 z-30 flex h-13 items-start rounded-full bg-white/90 py-px shadow-tabbar backdrop-blur-md">
      {TABS.map((t) => {
        const on = t.key === active;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onSelect(t.key)}
            aria-current={on ? "page" : undefined}
            className="relative flex h-full flex-1 flex-col items-center justify-center gap-0.5 py-0.5"
          >
            <motion.span
              aria-hidden
              animate={on ? { y: [0, -3, 0], scale: [1, 1.12, 1] } : { y: 0, scale: 1 }}
              transition={{ duration: 0.35 }}
              className={`block size-7.5 transition-colors duration-200 ${on ? "bg-brand-orange" : "bg-n-tab"}`}
              style={{
                maskImage: `url(/nurse/${t.icon}.svg)`,
                WebkitMaskImage: `url(/nurse/${t.icon}.svg)`,
                maskSize: "contain",
                WebkitMaskSize: "contain",
              }}
            />
            <span className={`text-2xs leading-none tracking-ui transition-colors text-trim ${on ? "text-brand-orange" : "text-n-tab"}`}>
              {t.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "disabled" };

/** The 18px, pill-shaped buttons pinned above the tab bar (Accept / Decline / Clock In…). */
export function BigButton({ variant = "primary", className = "", children, ...rest }: BtnProps) {
  const reduce = useReducedMotion();
  const style =
    variant === "primary"
      ? "bg-brand-orange text-white hover:brightness-105"
      : variant === "outline"
        ? "border border-black bg-white text-black hover:bg-black hover:text-white"
        : "bg-n-disabled text-muted-2";
  return (
    <motion.button
      type="button"
      layout
      whileTap={reduce ? undefined : { scale: 0.96 }}
      className={`flex flex-1 items-center justify-center rounded-full px-4 py-3.5 text-lg leading-none font-medium tracking-heading whitespace-nowrap transition-colors duration-200 ${style} ${className}`}
      {...(rest as object)}
    >
      <span className="text-trim">{children}</span>
    </motion.button>
  );
}

/** White fade + the pair of buttons above the tab bar. */
export function ActionBar({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-20 bg-linear-to-t from-white from-75% to-white/0 px-4 pt-8 pb-25.75">
      <div className="flex items-center gap-4">{children}</div>
    </div>
  );
}

export function Tag({ children, tone = "orange" }: { children: ReactNode; tone?: "orange" | "soft" | "urgent" }) {
  const s =
    tone === "urgent"
      ? "bg-n-urgent/10 text-n-urgent font-medium px-2.25"
      : tone === "soft"
        ? "bg-n-tag-soft text-brand-orange px-1.5 text-3xs"
        : "bg-n-tag text-brand-orange px-1.75";
  return (
    <span className={`inline-flex w-fit items-center rounded-full py-1.5 text-xs leading-none whitespace-nowrap ${s}`}>
      <span className="text-trim">{children}</span>
    </span>
  );
}

/** Small home-screen shift card with "Accept this shift" + heart. */
export function MiniShiftCard({
  shift,
  saved,
  cta,
  onCta,
  onOpen,
  onSave,
  index = 0,
}: {
  shift: NurseShift;
  saved?: boolean;
  cta: string;
  onCta: () => void;
  onOpen: () => void;
  onSave?: () => void;
  index?: number;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0, transition: { delay: 0.1 + index * 0.06, type: "spring", stiffness: 300, damping: 28 } }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex w-62.75 shrink-0 snap-start flex-col gap-3.25 rounded-2xl border border-n-card bg-white p-2"
    >
      <button type="button" onClick={onOpen} className="flex w-full flex-col gap-4 text-left">
        <span className="flex h-9 flex-col gap-2">
          <Tag tone="soft">{shift.unit}</Tag>
          <span className="text-base leading-none tracking-snug whitespace-nowrap text-black text-trim">{shift.facility}</span>
        </span>
        <span className="flex items-center gap-2 text-3xs leading-none tracking-snug text-muted">
          <span className="text-trim">{shift.period} Shift</span>
          <img src="/nurse/dot.svg" alt="" width={3} height={3} className="size-0.75" />
          <span className="text-trim">{shift.date}</span>
          <img src="/nurse/dot.svg" alt="" width={3} height={3} className="size-0.75" />
          <span className="text-trim">{shift.miles} Miles</span>
        </span>
      </button>
      <div className="flex w-full items-start gap-2.5">
        <motion.button
          type="button"
          onClick={onCta}
          whileTap={{ scale: 0.96 }}
          className="flex flex-1 items-center justify-center rounded-full bg-brand-orange p-2.5 text-sm leading-none tracking-ui text-white transition hover:brightness-105"
        >
          <span className="text-trim">{cta}</span>
        </motion.button>
        {onSave && (
          <motion.button
            type="button"
            aria-label={saved ? "Remove from saved" : "Save shift"}
            aria-pressed={saved}
            onClick={onSave}
            whileTap={{ scale: 0.8 }}
            className="relative size-7.5 shrink-0"
          >
            <img src="/nurse/btn-heart.svg" alt="" width={30} height={30} className="size-7.5" />
            <AnimatePresence>
              {saved && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  transition={{ type: "spring", stiffness: 600, damping: 16 }}
                  className="absolute inset-0 grid place-items-center rounded-full bg-brand-orange text-sm text-white"
                >
                  ♥
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/** Row in the Open Shifts / My Shifts list. */
export function ShiftRow({ shift, onOpen, index = 0 }: { shift: NurseShift; onOpen: () => void; index?: number }) {
  return (
    <motion.button
      type="button"
      layout
      onClick={onOpen}
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.05, type: "spring", stiffness: 300, damping: 28 } }}
      exit={{ opacity: 0, height: 0, paddingTop: 0, paddingBottom: 0 }}
      whileTap={{ backgroundColor: "#fafafa" }}
      className="flex w-full flex-col gap-4 border-b border-line p-4 text-left last:border-b-0 hover:bg-n-chip/60"
    >
      {(shift.isNew || shift.urgent) && <Tag tone={shift.urgent ? "urgent" : "orange"}>{shift.urgent ? "URGENT" : "NEW"}</Tag>}
      <span className="flex w-full items-center justify-between whitespace-nowrap">
        <span className="text-lg leading-none font-medium tracking-snug text-n-ink text-trim">{shift.facility}</span>
        {shift.urgent ? (
          <span className="text-base leading-none font-semibold text-n-urgent italic text-trim">${shift.bonus} Bonus</span>
        ) : (
          <span className="text-xs leading-none tracking-snug text-muted text-trim">Just Now</span>
        )}
      </span>
      <span className="grid w-full grid-cols-2 gap-x-2.25 gap-y-3 text-xs leading-none tracking-snug text-muted">
        <Meta icon="icon-clock">{shift.period} Shift</Meta>
        <Meta icon="icon-calendar">{shift.date}</Meta>
        <Meta icon="icon-unit">{shift.unit}</Meta>
        <Meta icon="icon-role">{shift.role}</Meta>
      </span>
    </motion.button>
  );
}

function Meta({ icon, children }: { icon: string; children: ReactNode }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <img src={`/nurse/${icon}.svg`} alt="" width={20} height={20} className="size-5 shrink-0" />
      <span className="truncate text-trim">{children}</span>
    </span>
  );
}

/** Push-notification style toast that drops in from the top of the phone. */
export function PhoneToast({
  title,
  body,
  actions,
  onDismiss,
}: {
  title: string;
  body: string;
  actions?: { label: string; primary?: boolean; onClick: () => void }[];
  onDismiss: () => void;
}) {
  return (
    <motion.div
      role="status"
      initial={{ y: -140, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -140, opacity: 0, transition: { duration: 0.25 } }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={{ top: 0.6, bottom: 0.1 }}
      onDragEnd={(_, i) => i.offset.y < -30 && onDismiss()}
      className="absolute inset-x-3 top-13.25 z-50 cursor-grab rounded-4xl bg-white drop-shadow-toast active:cursor-grabbing"
    >
      <div className={`flex items-center gap-4 ${actions ? "px-4 py-4.75" : "p-5"}`}>
        <Image src="/nurse/toast-avatar.png" alt="" width={34} height={34} className="size-8.5 shrink-0 rounded-full" />
        <div className={`flex min-w-0 flex-1 flex-col ${actions ? "gap-4.75" : "gap-3"}`}>
          <div className={`flex flex-col leading-normal ${actions ? "gap-2.75" : "gap-3"}`}>
            <p className={`font-medium tracking-snug text-black text-trim ${actions ? "text-base" : "text-lg"}`}>{title}</p>
            <p className={`tracking-snug text-muted text-trim ${actions ? "text-xs" : "text-sm"}`}>{body}</p>
          </div>
          {actions && (
            <div className="flex items-center gap-2.75">
              {actions.map((a) => (
                <motion.button
                  key={a.label}
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={a.onClick}
                  className={`flex flex-1 items-center justify-center px-1.25 py-1.75 text-xs leading-none ${
                    a.primary ? "rounded-xl bg-brand-orange font-semibold text-white" : "rounded-lg bg-n-pill font-medium text-ink-body"
                  }`}
                >
                  <span className="text-trim">{a.label}</span>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
