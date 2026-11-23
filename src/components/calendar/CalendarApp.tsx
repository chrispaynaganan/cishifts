"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ToastProvider, useToast } from "@/components/ui/toast";
import {
  CELLS,
  cellOfDay,
  MONTH_LABEL,
  NEW_ID,
  seedShifts,
  TODAY_CELL,
  WEEKDAYS,
  type Shift,
} from "@/lib/calendar-data";
import { Sidebar, TopNav } from "./Chrome";
import { ExploreGuide } from "./ExploreGuide";
import { NotificationsPanel, seedNotifications, type Notif } from "./Notifications";
import { Popover, type Placement } from "./Popover";
import {
  AvailabilityPopover,
  CallOffPopover,
  CompletedPopover,
  HistoryPopover,
  LegendPopover,
  MorePopover,
  NewShiftPopover,
  OpenShiftPopover,
  ShiftDetailsPopover,
  TemplatePopover,
  TimeOffPopover,
  type Actions,
  type Goal,
  type PopKind,
} from "./popovers";
import { chipLabel, ShiftChip } from "./ShiftChip";

type Pop = { kind: PopKind; shiftId?: string; cell?: number };

const VISIBLE_PER_CELL = 3;

const POP_FOR: Record<Shift["kind"], PopKind> = {
  completed: "completed",
  ongoing: "details",
  scheduled: "details",
  open: "open",
  called: "calloff",
  urgent: "calloff",
  draft: "new",
};

export function CalendarApp() {
  return (
    <ToastProvider>
      <CalendarInner />
    </ToastProvider>
  );
}

function CalendarInner() {
  const toast = useToast();
  const reduce = useReducedMotion();
  const main = useRef<HTMLElement>(null);

  const [shifts, setShifts] = useState<Shift[]>(seedShifts);
  const [pop, setPop] = useState<Pop | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>(seedNotifications);
  const [timeOff, setTimeOff] = useState<"Accepted" | "Denied" | null>(null);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [highlight, setHighlight] = useState<string[]>([]);
  const [goals, setGoals] = useState<Set<Goal>>(new Set());
  const [intro, setIntro] = useState(true);
  const [booting, setBooting] = useState(true);
  const [log, setLog] = useState(() => [
    { id: 3, text: "Leo Lake accepted a re-opened AM shift on Jul 2", at: "3 minutes ago" },
    { id: 2, text: "Ruby Dunn called off — AM shift on Jul 2 re-opened as urgent", at: "7 minutes ago" },
    { id: 1, text: "Ivy West requested time off for Aug 10–14", at: "12 minutes ago" },
  ]);
  const logId = useRef(10);

  useEffect(() => {
    const t = window.setTimeout(() => setIntro(false), reduce ? 0 : 450);
    const b = window.setTimeout(() => setBooting(false), 2500);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(b);
    };
  }, [reduce]);

  // Let freshly-created chips celebrate once, then settle.
  useEffect(() => {
    if (!shifts.some((s) => s.fresh)) return;
    const t = window.setTimeout(() => setShifts((all) => all.map((s) => (s.fresh ? { ...s, fresh: false } : s))), 2400);
    return () => window.clearTimeout(t);
  }, [shifts]);

  useEffect(() => {
    if (!highlight.length) return;
    const t = window.setTimeout(() => setHighlight([]), 9000);
    return () => window.clearTimeout(t);
  }, [highlight]);

  const byId = useCallback((id?: string) => shifts.find((s) => s.id === id), [shifts]);

  const close = useCallback(() => {
    setPop((p) => {
      if (p?.shiftId) setShifts((all) => all.filter((s) => !(s.id === p.shiftId && s.kind === "draft")));
      return null;
    });
  }, []);

  const goal = useCallback(
    (g: Goal) =>
      setGoals((prev) => {
        if (prev.has(g)) return prev;
        const next = new Set(prev);
        next.add(g);
        return next;
      }),
    [],
  );

  const actions: Actions = useMemo(
    () => ({
      close,
      update: (id, patch) => setShifts((all) => all.map((s) => (s.id === id ? { ...s, ...patch } : s))),
      remove: (id) => setShifts((all) => all.filter((s) => s.id !== id)),
      add: (list) => setShifts((all) => [...all, ...list.map((s) => ({ ...s, id: NEW_ID() }))]),
      open: (kind, opts) => setPop({ kind, ...opts }),
      log: (text) => setLog((l) => [{ id: logId.current++, text, at: "Just now" }, ...l]),
      toast,
      goal,
      highlight: setHighlight,
    }),
    [close, toast, goal],
  );

  const openShift = (s: Shift) => {
    setNotifOpen(false);
    setPop({ kind: POP_FOR[s.kind], shiftId: s.id });
  };

  const createDraft = (cell: number) => {
    setNotifOpen(false);
    const id = NEW_ID();
    setShifts((all) => [...all.filter((s) => s.kind !== "draft"), { id, cell, kind: "draft", period: "AM", fresh: true }]);
    setPop({ kind: "new", shiftId: id });
  };

  // Escape closes whatever is open; clicks outside popovers close them too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (pop) close();
      else if (notifOpen) setNotifOpen(false);
      else if (searching) {
        setSearching(false);
        setQuery("");
      }
    };
    const onDown = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest("[role=dialog],[data-shift],[data-cell],[data-keep-pop]")) return;
      if (pop) close();
      if (notifOpen && !t.closest("[aria-label^=Notifications]")) setNotifOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onDown);
    };
  }, [pop, notifOpen, searching, close]);

  const followNotif = (n: Notif) => {
    setNotifOpen(false);
    const m = n.target.shiftMatch;
    if (m) {
      const s = shifts.find(
        (x) => (!m.cna || x.cna === m.cna) && (!m.kind || x.kind === m.kind) && (m.cell === undefined || x.cell === m.cell) && !x.overflow,
      );
      if (s) {
        setPop({ kind: POP_FOR[s.kind], shiftId: s.id });
        return;
      }
      toast("That shift has changed since this notification was sent.");
      return;
    }
    setPop({ kind: n.target.kind });
  };

  const unread = notifs.filter((n) => n.unread && !n.archived).length;
  const q = query.trim().toLowerCase();
  const matches = (s: Shift) => !q || chipLabel(s).join(" ").toLowerCase().includes(q) || s.kind.includes(q);

  /* ---------------- popover rendering ---------------- */

  const current = pop?.shiftId ? byId(pop.shiftId) : undefined;
  let popBody: React.ReactNode = null;
  let placement: Placement = "side";
  let width: "md" | "sm" = "md";
  let anchor: () => HTMLElement | null = () => null;

  if (pop) {
    if (pop.shiftId) {
      const id = pop.shiftId;
      anchor = () =>
        document.querySelector<HTMLElement>(`[data-grid] [data-shift="${id}"]`) ??
        (current ? document.querySelector<HTMLElement>(`[data-more="${current.cell}"]`) : null);
    }
    switch (pop.kind) {
      case "open":
        if (current) popBody = <OpenShiftPopover shift={current} a={actions} />;
        break;
      case "details":
        if (current) popBody = <ShiftDetailsPopover shift={current} a={actions} />;
        break;
      case "completed":
        if (current) popBody = <CompletedPopover shift={current} a={actions} />;
        break;
      case "calloff":
        if (current) popBody = <CallOffPopover shift={current} a={actions} />;
        break;
      case "new":
        if (current) popBody = <NewShiftPopover shift={current} a={actions} />;
        break;
      case "template":
        if (current) popBody = <TemplatePopover shift={current} a={actions} />;
        break;
      case "timeoff":
        placement = "center";
        popBody = (
          <TimeOffPopover
            a={actions}
            decided={timeOff}
            onDecide={(d) => {
              setTimeOff(d);
              setNotifs((l) => l.map((n) => (n.id === "n5" ? { ...n, unread: false, archived: true } : n)));
            }}
          />
        );
        break;
      case "availability":
        placement = "center";
        popBody = <AvailabilityPopover a={actions} shifts={shifts} />;
        break;
      case "more": {
        const cell = pop.cell ?? 0;
        width = "sm";
        anchor = () => document.querySelector<HTMLElement>(`[data-more="${cell}"]`);
        popBody = (
          <MorePopover
            cell={cell}
            shifts={shifts.filter((s) => s.cell === cell)}
            a={actions}
            onPick={(s) => openShift(s)}
          />
        );
        break;
      }
      case "legend":
        anchor = () => document.querySelector<HTMLElement>("[data-anchor=legend]");
        popBody = <LegendPopover a={actions} />;
        break;
      case "history":
        width = "sm";
        placement = "below";
        anchor = () => document.querySelector<HTMLElement>("[data-anchor=history]");
        popBody = <HistoryPopover a={actions} entries={log} />;
        break;
    }
  }
  const popKey = pop ? `${pop.kind}-${pop.shiftId ?? pop.cell ?? ""}` : "none";

  return (
    <div className="flex h-dvh overflow-hidden bg-white">
      <Sidebar />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <TopNav
          unread={unread}
          notifOpen={notifOpen}
          onBell={() => {
            setPop(null);
            setNotifOpen((o) => !o);
            goal("notifs");
          }}
        />
        <AnimatePresence>
          {notifOpen && (
            <NotificationsPanel
              items={notifs}
              setItems={setNotifs}
              onFollow={followNotif}
              onClose={() => setNotifOpen(false)}
            />
          )}
        </AnimatePresence>

        <main ref={main} className="relative flex min-h-0 flex-1 flex-col overflow-x-auto px-8 pt-6.5">
          <div className="flex min-h-0 min-w-275 flex-1 flex-col">
            {/* Month header */}
            <div className="flex h-11.25 w-full shrink-0 items-center justify-between">
              <motion.h2
                initial={reduce ? false : { opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 24 }}
                className="text-month leading-normal font-medium tracking-month text-ink-month"
              >
                {MONTH_LABEL}
              </motion.h2>
              <motion.div
                initial={reduce ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-4"
              >
                <div className="flex items-center" data-keep-pop>
                  <AnimatePresence initial={false}>
                    {searching && (
                      <motion.input
                        autoFocus
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search CNA, shift or status…"
                        initial={{ width: 0, opacity: 0 }}
                        animate={{ width: 240, opacity: 1 }}
                        exit={{ width: 0, opacity: 0 }}
                        className="mr-2 h-11.25 rounded-full border border-line bg-white px-4 text-sm tracking-ui shadow-soft outline-none placeholder:text-placeholder focus:border-field-focus"
                      />
                    )}
                  </AnimatePresence>
                  <IconCircle
                    src="btn-search"
                    label={searching ? "Close search" : "Search shifts"}
                    onClick={() => {
                      setSearching((s) => !s);
                      setQuery("");
                    }}
                  />
                </div>
                <div data-anchor="history" data-keep-pop>
                  <IconCircle
                    src="btn-history"
                    label="Recent activity"
                    onClick={() => setPop((p) => (p?.kind === "history" ? null : { kind: "history" }))}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => toast("The CNA calendar lives in the nurse mobile app — coming next in this case study.")}
                  className="flex min-w-33.5 items-center rounded-full bg-white/10 p-1.25 whitespace-nowrap shadow-soft transition-shadow hover:shadow-md"
                >
                  <span className="flex flex-1 items-center justify-center rounded-full px-4 py-3 text-base leading-none text-ink-pill text-trim">
                    CNA Calendar
                  </span>
                </button>
                <motion.button
                  type="button"
                  data-keep-pop
                  onClick={() => createDraft(cellOfDay(8))}
                  whileHover={{ y: -1.5 }}
                  whileTap={{ scale: 0.96 }}
                  className="group flex h-11.25 w-33.5 items-center justify-center gap-2 rounded-full bg-brand-bright p-1.25 text-base leading-none font-medium tracking-display text-white drop-shadow-sm transition-shadow hover:shadow-lg hover:shadow-brand-bright/30"
                >
                  <img
                    src="/assets/icon-plus-white.svg"
                    alt=""
                    width={12}
                    height={12}
                    className="size-3 transition-transform duration-300 group-hover:rotate-90"
                  />
                  <span className="text-trim">Create Shift</span>
                </motion.button>
              </motion.div>
            </div>

            {/* Weekday labels */}
            <div className="mt-8 flex w-full shrink-0 items-center">
              {WEEKDAYS.map((d, i) => (
                <motion.div
                  key={d}
                  initial={reduce ? false : { opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.03 }}
                  className="flex flex-1 items-center justify-center px-2.5 py-1.5 text-base leading-5 font-medium tracking-ui text-muted"
                >
                  {d}
                </motion.div>
              ))}
            </div>

            {/* Month grid */}
            <div
              data-grid
              className="mt-3.25 grid min-h-155 flex-1 grid-cols-7 grid-rows-5 overflow-hidden rounded-4xl border border-line-grid"
            >
              {CELLS.map((c, cell) => {
                const all = shifts.filter((s) => s.cell === cell);
                const shown = all.filter((s) => !s.overflow).slice(0, VISIBLE_PER_CELL);
                const hidden = all.length - shown.length;
                const row = Math.floor(cell / 7);
                const col = cell % 7;
                const today = cell === TODAY_CELL;
                return (
                  <motion.div
                    key={cell}
                    data-cell={cell}
                    role="button"
                    tabIndex={0}
                    aria-label={`${c.month} ${c.day} — add a shift`}
                    onClick={() => createDraft(cell)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && e.target === e.currentTarget) createDraft(cell);
                    }}
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 + (row + col) * 0.035, duration: 0.4 }}
                    className={`group relative -mr-px -mb-px flex min-h-0 cursor-pointer flex-col items-end gap-1 overflow-hidden border border-line px-2.5 py-2 transition-colors xl:px-4 duration-200 outline-none hover:bg-surface/60 focus-visible:bg-surface ${
                      c.inMonth ? "" : "bg-field/40"
                    }`}
                  >
                    <span className="pointer-events-none absolute top-2.5 left-4 flex items-center gap-1 text-xs text-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                      <span className="grid size-4 place-items-center rounded-full bg-brand/10 text-brand">+</span>
                      Add shift
                    </span>
                    <span
                      className={`relative grid h-6 min-w-6 shrink-0 place-items-center rounded-full text-base leading-5 font-medium tracking-ui ${
                        today ? "bg-brand-today px-0.5 text-white" : c.inMonth ? "text-ink-body" : "text-muted"
                      }`}
                    >
                      {today && <span aria-hidden className="absolute inset-0 animate-ping-slow rounded-full bg-brand-today motion-reduce:hidden" />}
                      <span className="relative">{c.day}</span>
                    </span>
                    <div className="flex w-full min-h-0 flex-col gap-1">
                      <AnimatePresence initial={false}>
                        {shown.map((s, i) => (
                          <ShiftChip
                            key={s.id}
                            shift={s}
                            active={pop?.shiftId === s.id}
                            dimmed={!!q && !matches(s)}
                            glow={highlight.includes(s.id) || (!!q && matches(s))}
                            delay={booting ? 0.85 + (row + col) * 0.04 + i * 0.05 : 0}
                            onClick={() => openShift(s)}
                          />
                        ))}
                      </AnimatePresence>
                      {hidden > 0 && (
                        <button
                          type="button"
                          data-more={cell}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPop({ kind: "more", cell });
                          }}
                          className="flex w-full items-center justify-center py-2 text-2xs leading-5 font-medium tracking-ui text-ink-body transition-colors hover:text-brand"
                        >
                          View {hidden} more shift{hidden > 1 ? "s" : ""}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <div className="flex shrink-0 pt-4.75 pb-8.75">
              <button
                type="button"
                data-anchor="legend"
                data-keep-pop
                onClick={() => setPop((p) => (p?.kind === "legend" ? null : { kind: "legend" }))}
                className="text-sm leading-6 tracking-ui text-legend underline decoration-from-font underline-offset-2 transition-colors hover:text-brand"
              >
                View Legends
              </button>
            </div>
          </div>

          <AnimatePresence>
            {pop && popBody && (
              <Popover key={popKey} anchor={anchor} container={main} placement={placement} width={width} label={pop.kind}>
                {popBody}
              </Popover>
            )}
          </AnimatePresence>
        </main>
      </div>

      <ExploreGuide done={goals} quiet={!!pop || notifOpen} />

      <AnimatePresence>
        {intro && (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-white"
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            <motion.div exit={{ scale: 0.6, opacity: 0, y: -20 }} transition={{ duration: 0.45 }}>
              <Image src="/assets/logo.png" alt="" width={200} height={79} priority />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function IconCircle({ src, label, onClick }: { src: string; label: string; onClick: () => void }) {
  return (
    <motion.button
      type="button"
      aria-label={label}
      onClick={onClick}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.92 }}
      className="relative block size-11.25 shrink-0"
    >
      <img src={`/assets/${src}.svg`} alt="" width={57} height={57} className="absolute -top-1 -left-1.5 size-14.25 max-w-none" />
    </motion.button>
  );
}
