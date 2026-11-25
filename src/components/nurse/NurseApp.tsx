"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { CALL_OFF_REASONS, DUTIES, HOURS, OPEN_SHIFTS, hms, type NurseShift } from "@/lib/nurse-data";
import {
  ActiveShiftScreen,
  CallOffModal,
  HomeScreen,
  ShiftDetailsScreen,
  ShiftListScreen,
  SummaryScreen,
  type Active,
} from "./screens";
import { HomeIndicator, PhoneToast, StatusBar, TabBar, type TabKey } from "./ui";

type Screen =
  | { name: "home" }
  | { name: "open" }
  | { name: "mine" }
  | { name: "details"; id: string; readOnly?: boolean }
  | { name: "active" }
  | { name: "summary" };

type Toast =
  | { kind: "info"; title: string; body: string }
  | { kind: "urgent" };

type Goal = "accept" | "clockin" | "break" | "summary" | "calloff" | "urgent";

const GOALS: { key: Goal; text: string }[] = [
  { key: "accept", text: "Accept an open shift" },
  { key: "clockin", text: "Clock in (use the skip-ahead link)" },
  { key: "break", text: "Take a meal break" },
  { key: "summary", text: "Clock out and download the summary" },
  { key: "calloff", text: "Call off a shift you accepted" },
  { key: "urgent", text: "Grab the urgent shift from the notification" },
];

const now = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
/** The shift's own date ("Jan 13, 2023"), so every summary timestamp lines up with the schedule. */
const dayOf = (s: NurseShift) => new Date(s.longDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export function NurseApp() {
  const reduce = useReducedMotion();
  const [stack, setStack] = useState<Screen[]>([{ name: "home" }]);
  const [dir, setDir] = useState(1);
  const [open, setOpen] = useState<NurseShift[]>(OPEN_SHIFTS);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<Active | null>(null);
  const [history, setHistory] = useState<NurseShift[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [callOff, setCallOff] = useState(false);
  const [goals, setGoals] = useState<Set<Goal>>(new Set());
  const pinged = useRef(false);
  const journalId = useRef(1);

  const screen = stack[stack.length - 1];
  const tab: TabKey = screen.name === "home" ? "home" : "shifts";

  const goal = (g: Goal) => setGoals((p) => (p.has(g) ? p : new Set(p).add(g)));
  const push = (s: Screen) => {
    setDir(1);
    setStack((st) => [...st, s]);
  };
  const pop = () => {
    setDir(-1);
    setStack((st) => (st.length > 1 ? st.slice(0, -1) : st));
  };
  const reset = (s: Screen = { name: "home" }) => {
    setDir(-1);
    setStack([s]);
  };
  const info = useCallback((title: string, body: string) => setToast({ kind: "info", title, body }), []);

  // Auto-dismiss toasts.
  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), toast.kind === "urgent" ? 9000 : 4200);
    return () => window.clearTimeout(t);
  }, [toast]);

  // A colleague "calls off" a few seconds after the first visit to Home.
  useEffect(() => {
    if (screen.name !== "home" || pinged.current) return;
    const t = window.setTimeout(() => {
      pinged.current = true;
      if (open.some((s) => s.urgent)) setToast({ kind: "urgent" });
    }, 4500);
    return () => window.clearTimeout(t);
  }, [screen.name, open]);

  // One ticking clock drives the countdown, the shift timer and the break timer.
  useEffect(() => {
    if (!active) return;
    const t = window.setInterval(() => {
      setActive((a) => {
        if (!a) return a;
        if (a.phase === "waiting") return { ...a, startsIn: Math.max(0, a.startsIn - 1) };
        if (a.phase === "clocked") return { ...a, elapsed: a.elapsed + 1 };
        if (a.breakLeft <= 1) return { ...a, phase: "clocked", breakLeft: 0, elapsed: a.elapsed + 1 };
        return { ...a, breakLeft: a.breakLeft - 1, elapsed: a.elapsed + 1 };
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [active?.shift.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active?.justAccepted) return;
    const t = window.setTimeout(() => setActive((a) => (a ? { ...a, justAccepted: false } : a)), 2600);
    return () => window.clearTimeout(t);
  }, [active?.justAccepted]);

  /* ---------------- actions ---------------- */

  const accept = (s: NurseShift) => {
    if (active) {
      info("You already have a shift today", `Finish or call off ${active.shift.facility} first.`);
      return;
    }
    setActive({
      shift: s,
      phase: "waiting",
      startsIn: 3 * 3600 + 2 * 60 + 32,
      elapsed: 0,
      breakLeft: 0,
      mealTaken: false,
      justAccepted: true,
      done: DUTIES.map(() => false),
      journal: [],
    });
    setOpen((o) => o.filter((x) => x.id !== s.id));
    setSaved((p) => {
      const n = new Set(p);
      n.delete(s.id);
      return n;
    });
    goal("accept");
    if (s.urgent) goal("urgent");
    setDir(1);
    setStack((st) => [...st.filter((x) => x.name !== "details"), { name: "active" }]);
  };

  const decline = (s: NurseShift) => {
    setOpen((o) => o.filter((x) => x.id !== s.id));
    pop();
    info("Shift declined", `${s.facility} won’t show this ${s.period} shift to you again.`);
  };

  const clockIn = () => {
    if (!active) return;
    if (active.startsIn > 300) {
      setToast({ kind: "info", title: "You cannot clock in yet", body: "Make sure to clock in 5 minutes before your shift or have you near as 5 miles away from the facility." });
      return;
    }
    setActive({ ...active, phase: "clocked", justAccepted: false, clockedInAt: `${now()}, ${dayOf(active.shift)}` });
    goal("clockin");
  };

  const finish = () => {
    if (!active) return;
    const a = active;
    const lines = [
      "CIShifts — Shift Summary",
      "",
      `${a.shift.facility} · ${a.shift.unit}`,
      `${a.shift.period} Shift · ${a.shift.longDate} · ${HOURS[a.shift.period]}`,
      "",
      `Clocked in: ${a.clockedInAt ?? "—"}`,
      `Meal break: ${a.mealTaken ? `Taken at ${a.breakAt}` : "Skipped"}`,
      `Clocked out: ${now()}, ${dayOf(a.shift)}`,
      `Time on the clock: ${hms(a.elapsed)}`,
      "",
      "Duties:",
      ...DUTIES.map((d, i) => `  [${a.done[i] ? "x" : " "}] ${d.title}`),
      "",
      ...(a.journal.length ? ["Journal:", ...a.journal.map((j) => `  ${j.at} — ${j.text}`)] : []),
      "Prototype by Chris Paynaganan · cishifts.vercel.app",
    ];
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/plain" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `cishifts-shift-summary-${a.shift.id}.txt`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setHistory((h) => [a.shift, ...h]);
    setActive(null);
    goal("summary");
    reset();
    info("Shift complete — nice work, Grace!", "Your summary was downloaded and sent to the facility.");
  };

  const submitCallOff = (reason: string) => {
    if (!active) return;
    const s = active.shift;
    setCallOff(false);
    setActive(null);
    setOpen((o) => [{ ...s, urgent: true, bonus: 30, isNew: false }, ...o.filter((x) => x.id !== s.id)]);
    goal("calloff");
    reset();
    info("You’ve called off this shift", `Reason: ${reason}. ${s.facility} has been notified and it’s back up as urgent.`);
  };

  const selectTab = (t: TabKey) => {
    if (t === "home") reset();
    else if (t === "shifts") {
      if (screen.name !== "open") reset({ name: "open" });
    } else info(`${t[0].toUpperCase()}${t.slice(1)} isn’t in this prototype`, "This preview covers finding, accepting and working a shift.");
  };

  /* ---------------- render ---------------- */

  const detailsShift = screen.name === "details" ? [...open, ...history, ...OPEN_SHIFTS].find((s) => s.id === screen.id) : undefined;

  let view: ReactNode = null;
  switch (screen.name) {
    case "home":
      view = (
        <HomeScreen
          active={active}
          history={history}
          open={open}
          saved={saved}
          onSave={(id) =>
            setSaved((p) => {
              const n = new Set(p);
              if (n.has(id)) n.delete(id);
              else n.add(id);
              return n;
            })
          }
          onAccept={accept}
          onOpenShift={(s) => push({ name: "details", id: s.id, readOnly: history.includes(s) })}
          onOpenActive={() => push({ name: "active" })}
          onInbox={(w) => info(w === "inbox" ? "No new messages" : "You’re all caught up", "Messages from facilities land here in the full app.")}
        />
      );
      break;
    case "open":
    case "mine":
      view = (
        <ShiftListScreen
          key={screen.name}
          mode={screen.name}
          open={open}
          active={active}
          history={history}
          onBack={() => (stack.length > 1 ? pop() : reset())}
          onOpenShift={(s) => push({ name: "details", id: s.id, readOnly: history.includes(s) })}
          onOpenActive={() => push({ name: "active" })}
          onMyShifts={() => push({ name: "mine" })}
        />
      );
      break;
    case "details":
      view = detailsShift ? (
        <ShiftDetailsScreen
          key={detailsShift.id}
          shift={detailsShift}
          readOnly={screen.readOnly || !open.some((s) => s.id === detailsShift.id)}
          onBack={pop}
          onAccept={() => accept(detailsShift)}
          onDecline={() => decline(detailsShift)}
          onCopy={() => {
            navigator.clipboard?.writeText(detailsShift.address).catch(() => {});
            info("Address copied", detailsShift.address);
          }}
        />
      ) : null;
      break;
    case "active":
      view = active ? (
        <ActiveShiftScreen
          active={active}
          onBack={() => (stack.length > 1 ? pop() : reset())}
          onClockIn={clockIn}
          onClockOut={() => push({ name: "summary" })}
          onBreak={() => {
            setActive({ ...active, phase: "break", breakLeft: 30 * 60, mealTaken: true, breakAt: `${now()}, ${dayOf(active.shift)}` });
            goal("break");
          }}
          onEndBreak={() => setActive({ ...active, phase: "clocked" })}
          onCallOff={() => setCallOff(true)}
          onSkip={() => setActive({ ...active, startsIn: 4 * 60 + 30, justAccepted: false })}
          onToggleDuty={(i) => {
            if (active.phase === "waiting") {
              info("Clock in first", "Duties can be ticked off once your shift has started.");
              return;
            }
            setActive({ ...active, done: active.done.map((v, j) => (j === i ? !v : v)) });
          }}
          onJournal={(text) => setActive({ ...active, journal: [{ id: journalId.current++, text, at: `${now()}, ${dayOf(active.shift)}` }, ...active.journal] })}
          onFilter={() => info("Shift options", "Swap, share or report this shift from here in the full app.")}
        />
      ) : null;
      break;
    case "summary":
      view = active ? <SummaryScreen active={active} onBack={pop} onConfirm={finish} /> : null;
      break;
  }

  const phone = (
    <>
      <AnimatePresence initial={false} custom={dir} mode="popLayout">
        <motion.div
          key={`${stack.length}-${screen.name}-${"id" in screen ? screen.id : ""}`}
          custom={dir}
          variants={{
            enter: (d: number) => (reduce ? { opacity: 0 } : { x: d > 0 ? "100%" : "-28%", opacity: d > 0 ? 1 : 0.6 }),
            center: { x: 0, opacity: 1 },
            exit: (d: number) => (reduce ? { opacity: 0 } : { x: d > 0 ? "-28%" : "100%", opacity: d > 0 ? 0.6 : 1 }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 340, damping: 36 }}
          className="absolute inset-0 bg-white"
        >
          {view}
        </motion.div>
      </AnimatePresence>
      <StatusBar />
      <TabBar active={tab} onSelect={selectTab} />
      <HomeIndicator />
      <AnimatePresence>
        {callOff && <CallOffModal reasons={CALL_OFF_REASONS} onClose={() => setCallOff(false)} onSubmit={submitCallOff} />}
      </AnimatePresence>
      <AnimatePresence>
        {toast?.kind === "info" && <PhoneToast key={`i-${toast.title}`} title={toast.title} body={toast.body} onDismiss={() => setToast(null)} />}
        {toast?.kind === "urgent" && (
          <PhoneToast
            key="urgent"
            title="Hey! Someone has just cancelled off their shift!"
            body="Grab this opportunity today to earn an urgent bonus before anyone gets it."
            onDismiss={() => setToast(null)}
            actions={[
              {
                label: "Accept",
                primary: true,
                onClick: () => {
                  setToast(null);
                  const u = open.find((s) => s.urgent);
                  if (u) accept(u);
                },
              },
              {
                label: "View Shift Details",
                onClick: () => {
                  setToast(null);
                  const u = open.find((s) => s.urgent);
                  if (u) push({ name: "details", id: u.id });
                },
              },
            ]}
          />
        )}
      </AnimatePresence>
    </>
  );

  return <PhoneShell goals={goals} phone={phone} />;
}

/* ------------------------------------------------------------------ */

/** On desktop: a device frame beside a short guide. On phones: the app, full screen. */
function PhoneShell({ phone, goals }: { phone: ReactNode; goals: Set<Goal> }) {
  const [mode, setMode] = useState<"framed" | "full" | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const fit = () => {
      const full = window.innerWidth < 640;
      setMode(full ? "full" : "framed");
      setScale(Math.min(1, (window.innerHeight - 48) / 956));
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  if (mode === null) return <div className="h-dvh bg-field" />;

  if (mode === "full") {
    return <div className="fixed inset-0 overflow-hidden bg-white font-sans">{phone}</div>;
  }

  const done = GOALS.filter((g) => goals.has(g.key)).length;

  return (
    <main className="flex min-h-dvh items-center justify-center gap-16 bg-field px-8 py-6">
      <motion.aside
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="hidden w-80 shrink-0 flex-col gap-6 lg:flex"
      >
        <img src="/assets/logo.png" alt="CIShifts" width={150} height={60} className="h-15 w-37.5 object-cover object-left" />
        <div className="flex flex-col gap-3">
          <p className="text-xs font-medium tracking-wide text-brand-orange uppercase">Nurse mobile app · preview</p>
          <h1 className="text-display leading-tight font-medium tracking-display text-ink">Pick up a shift, work it, wrap it up.</h1>
          <p className="text-sm leading-relaxed text-muted">
            This is the CNA side of CIShifts. Clinics post shifts on the{" "}
            <Link href="/calendar" className="text-brand underline decoration-from-font">
              facility calendar
            </Link>
            ; nurses find them here, accept, clock in and hand off.
          </p>
        </div>
        <div className="rounded-3xl bg-white p-5 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-ink">Things to try</p>
            <p className="text-xs text-muted tabular-nums">
              {done}/{GOALS.length}
            </p>
          </div>
          <ul className="flex flex-col gap-2.5">
            {GOALS.map((g) => {
              const on = goals.has(g.key);
              return (
                <li key={g.key} className="flex items-center gap-3 text-sm">
                  <motion.span
                    animate={on ? { scale: [1, 1.35, 1] } : { scale: 1 }}
                    className={`grid size-5 shrink-0 place-items-center rounded-full border transition-colors ${on ? "border-brand-orange bg-brand-orange text-white" : "border-line-grid"}`}
                  >
                    {on && (
                      <svg viewBox="0 0 12 12" className="size-3" aria-hidden>
                        <motion.path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />
                      </svg>
                    )}
                  </motion.span>
                  <span className={on ? "text-muted line-through" : "text-ink-strong"}>{g.text}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <Link href="/calendar" className="group flex w-fit items-center gap-2 text-sm font-medium text-ink">
          <span className="transition-transform group-hover:-translate-x-1">←</span> Switch to the clinic dashboard
        </Link>
      </motion.aside>

      <motion.div
        initial={{ opacity: 0, y: 40, rotate: -2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        style={{ width: 454 * scale, height: 956 * scale }}
        className="relative shrink-0"
      >
        <div style={{ transform: `scale(${scale})` }} className="absolute top-0 left-0 h-239 w-113.5 origin-top-left rounded-device bg-ink p-3 shadow-device">
          <div className="relative h-full w-full overflow-hidden rounded-screen bg-white">{phone}</div>
        </div>
      </motion.div>
    </main>
  );
}
