"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useToast } from "@/components/ui/toast";

const NAV = [
  { key: "dashboard", label: "Dashboard", icon: "nav-dashboard" },
  { key: "calendar", label: "Calendar", icon: "nav-calendar" },
  { key: "agencies", label: "Partner Agencies", icon: "nav-agencies" },
  { key: "management", label: "Management", icon: "nav-management", children: ["My Staff", "Shift Templates", "Facilities"] },
  { key: "recruitment", label: "Recruitment", icon: "nav-recruitment" },
] as const;

/** 280px left rail from the Figma "Frame 2608949". */
export function Sidebar() {
  const toast = useToast();
  const reduce = useReducedMotion();
  const [expanded, setExpanded] = useState(false);
  const notHere = (label: string) =>
    toast(`${label} isn’t part of this case study — the Calendar is where the action is.`);

  return (
    <motion.aside
      initial={reduce ? false : { x: -24, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="hidden h-full w-sidebar shrink-0 flex-col justify-between border-r border-line-side pb-7.5 lg:flex"
    >
      <div className="flex w-full flex-col gap-5.5">
        <div className="flex h-20 w-full flex-col justify-center overflow-hidden px-6.5">
          <Image src="/assets/logo.png" alt="CIShifts" width={160} height={64} priority className="h-16 w-40 object-cover" />
        </div>
        <nav className="flex w-full flex-col gap-4 px-4">
          {NAV.map((item, i) => {
            const active = item.key === "calendar";
            const hasKids = "children" in item;
            return (
              <motion.div
                key={item.key}
                initial={reduce ? false : { x: -16, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.06, type: "spring", stiffness: 300, damping: 28 }}
              >
                <button
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => (hasKids ? setExpanded((e) => !e) : active ? undefined : notHere(item.label))}
                  className={`group relative flex h-10.5 w-full items-center justify-between rounded-full px-4 py-1.25 text-base tracking-ui transition-colors duration-200 ${
                    active ? "text-brand-bright" : "text-muted hover:bg-surface hover:text-ink-body"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full bg-brand-bright/10"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    />
                  )}
                  <span className="relative flex items-center gap-3">
                    <img
                      src={`/assets/${item.icon}.svg`}
                      alt=""
                      width={32}
                      height={32}
                      className="size-8 transition-transform duration-300 group-hover:scale-110"
                    />
                    <span className="leading-normal text-trim">{item.label}</span>
                  </span>
                  {hasKids && (
                    <motion.img
                      src="/assets/icon-chevron.svg"
                      alt=""
                      width={9}
                      height={16}
                      animate={{ rotate: expanded ? 270 : 90 }}
                      className="relative h-4 w-2.25"
                    />
                  )}
                </button>
                {hasKids && (
                  <AnimatePresence initial={false}>
                    {expanded && (
                      <motion.ul
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pl-15"
                      >
                        {item.children.map((c) => (
                          <li key={c}>
                            <button
                              type="button"
                              onClick={() => notHere(c)}
                              className="w-full rounded-full px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-surface hover:text-ink-body"
                            >
                              {c}
                            </button>
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                )}
              </motion.div>
            );
          })}
        </nav>
      </div>
      <div className="flex w-full items-center justify-between pr-6.25 pl-9.25">
        <button type="button" onClick={() => notHere("Settings")} className="group flex items-center gap-2.75 text-base tracking-ui text-ink">
          <img src="/assets/icon-settings.svg" alt="" width={24} height={24} className="size-6 transition-transform duration-500 group-hover:rotate-90" />
          <span className="leading-normal text-trim">Settings</span>
        </button>
        <button type="button" aria-label="Help" onClick={() => notHere("Help Center")} className="transition-transform hover:scale-110">
          <img src="/assets/icon-help.svg" alt="" width={24} height={24} className="size-6" />
        </button>
      </div>
    </motion.aside>
  );
}

/** "Calendar of Shifts" bar with chat, bell and the scheduler's avatar. */
export function TopNav({
  unread,
  notifOpen,
  onBell,
}: {
  unread: number;
  notifOpen: boolean;
  onBell: () => void;
}) {
  const toast = useToast();
  const router = useRouter();
  const [menu, setMenu] = useState(false);
  const reduce = useReducedMotion();

  return (
    <header className="relative z-40 flex h-20 shrink-0 items-center justify-between border-b border-line bg-white px-8 py-4">
      <motion.h1
        initial={reduce ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl leading-normal font-medium tracking-title text-ink"
      >
        Calendar of Shifts
      </motion.h1>
      <div className="flex items-center gap-6.25">
        <motion.button
          type="button"
          aria-label="Messages"
          whileHover={{ scale: 1.1, rotate: -6 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => toast("Messaging lives in the full product — this demo focuses on scheduling.")}
        >
          <img src="/assets/icon-chat.svg" alt="" width={26} height={24} className="h-6 w-6.5" />
        </motion.button>
        <motion.button
          type="button"
          aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
          aria-expanded={notifOpen}
          onClick={onBell}
          whileTap={{ scale: 0.9 }}
          animate={unread && !notifOpen && !reduce ? { rotate: [0, -14, 12, -8, 6, 0] } : { rotate: 0 }}
          transition={{ delay: 1.6, duration: 0.7, repeat: unread && !notifOpen ? Infinity : 0, repeatDelay: 6 }}
          className="relative origin-top"
        >
          <img src="/assets/icon-bell.svg" alt="" width={22} height={24} className="h-6 w-5.5" />
          <AnimatePresence>
            {unread > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-1.5 -right-2 grid h-4 min-w-4 place-items-center rounded-full bg-brand-today px-1 text-2xs leading-none font-medium text-white ring-2 ring-white"
              >
                {unread}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
        <div className="relative">
          <motion.button
            type="button"
            aria-label="Account menu"
            aria-expanded={menu}
            onClick={() => setMenu((m) => !m)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="block rounded-full ring-brand/30 transition-shadow hover:ring-4"
          >
            <Image src="/assets/avatar-admin.png" alt="" width={48} height={48} className="size-12 rounded-full" />
          </motion.button>
          <AnimatePresence>
            {menu && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.95 }}
                className="absolute top-14 right-0 w-60 origin-top-right rounded-3xl bg-white p-2 shadow-panel"
              >
                <div className="border-b border-line px-3 pt-2 pb-3">
                  <p className="text-sm font-medium text-ink">Scheduler</p>
                  <p className="text-xs text-muted">scheduler@acme.com · Acme Care</p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="mt-1 w-full rounded-2xl px-3 py-2.5 text-left text-sm text-brand transition-colors hover:bg-brand/5"
                >
                  Log out
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
