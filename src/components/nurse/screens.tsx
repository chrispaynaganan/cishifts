"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Segmented } from "@/components/ui/primitives";
import { DUTIES, HOURS, dhms, hms, type NurseShift } from "@/lib/nurse-data";
import { ActionBar, BigButton, CircleIcon, MiniShiftCard, ScreenHeader, ShiftRow, Tag } from "./ui";

export type Active = {
  shift: NurseShift;
  phase: "waiting" | "clocked" | "break";
  startsIn: number;
  elapsed: number;
  breakLeft: number;
  mealTaken: boolean;
  justAccepted: boolean;
  clockedInAt?: string;
  breakAt?: string;
  done: boolean[];
  journal: { id: number; text: string; at: string }[];
};

const fade = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.2 },
};

/** Scrollable body under a 151px header; leaves room for the action bar + tab bar. */
function Body({ children, roomy = true, top = "detail" }: { children: ReactNode; roomy?: boolean; top?: "list" | "detail" | "banner" }) {
  const pt = top === "list" ? "pt-5" : top === "banner" ? "pt-2.5" : "pt-8";
  return (
    <div className={`scrollbar-none min-h-0 flex-1 overflow-y-auto px-4 ${pt} ${roomy ? "pb-52" : "pb-32"}`}>{children}</div>
  );
}

function FacilityTitle({ shift }: { shift: NurseShift }) {
  return (
    <motion.div layout="position" className="flex w-full flex-col gap-3">
      <Tag>{shift.unit}</Tag>
      <h2 className="text-month leading-normal font-medium tracking-tightest text-black text-trim">{shift.facility}</h2>
    </motion.div>
  );
}

/* ================================================================== */
/* Home                                                               */

export function HomeScreen({
  active,
  history,
  open,
  saved,
  onSave,
  onAccept,
  onOpenShift,
  onOpenActive,
  onInbox,
}: {
  active: Active | null;
  history: NurseShift[];
  open: NurseShift[];
  saved: Set<string>;
  onSave: (id: string) => void;
  onAccept: (s: NurseShift) => void;
  onOpenShift: (s: NurseShift) => void;
  onOpenActive: () => void;
  onInbox: (what: "inbox" | "bell") => void;
}) {
  const [mine, setMine] = useState<"Upcoming" | "History">("Upcoming");
  const [pool, setPool] = useState<"All Shifts" | "Applied">("All Shifts");
  const count = active ? 1 : 0;
  const poolList = pool === "All Shifts" ? open : open.filter((s) => saved.has(s.id));

  return (
    <div className="scrollbar-none h-full overflow-y-auto pb-32">
      <div className="mt-13.25 flex h-24.5 items-center px-8">
        <Image src="/nurse/avatar-grace.png" alt="Grace" width={44} height={44} className="size-11 rounded-full" />
        <div className="flex flex-1 items-center justify-end gap-4">
          <motion.button type="button" aria-label="Inbox" whileTap={{ scale: 0.85 }} onClick={() => onInbox("inbox")}>
            <img src="/nurse/icon-inbox.svg" alt="" width={32} height={32} className="size-8" />
          </motion.button>
          <motion.button
            type="button"
            aria-label="Notifications"
            whileTap={{ scale: 0.85 }}
            animate={{ rotate: [0, -12, 10, -6, 0] }}
            transition={{ delay: 1.2, duration: 0.6, repeat: Infinity, repeatDelay: 7 }}
            onClick={() => onInbox("bell")}
            className="relative origin-top"
          >
            <img src="/nurse/icon-bell.svg" alt="" width={32} height={32} className="size-8" />
            <span className="absolute top-1.5 right-1 size-2 rounded-full bg-brand-orange ring-2 ring-white" />
          </motion.button>
        </div>
      </div>

      <div className="px-4">
        <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4 text-xl tracking-heading text-muted text-trim">
          Hey, Grace!
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="mt-2 text-greeting font-medium tracking-tightest"
        >
          <span className="block text-n-greeting">You’ve got</span>
          <span className="block text-brand-orange">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={count}
                className="inline-block"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -30, opacity: 0 }}
              >
                {count}
              </motion.span>
            </AnimatePresence>{" "}
            Shifts today!
          </span>
        </motion.h1>

        <h2 className="mt-10.5 text-xl font-medium text-black text-trim">My Shifts</h2>
        <Segmented id="home-mine" className="mt-4" options={["Upcoming", "History"] as const} value={mine} onChange={setMine} />
        <div className="mt-6 min-h-26.5">
          <AnimatePresence mode="wait" initial={false}>
            {mine === "Upcoming" ? (
              active ? (
                <motion.div key="up" {...fade}>
                  <MiniShiftCard shift={active.shift} cta={active.phase === "waiting" ? "View this shift" : "Back to my shift"} onCta={onOpenActive} onOpen={onOpenActive} />
                </motion.div>
              ) : (
                <motion.div key="empty" {...fade} className="flex h-26.5 flex-col items-center justify-center gap-5.5 rounded-2xl border border-line">
                  <motion.img
                    src="/nurse/empty-sahara.svg"
                    alt=""
                    width={108}
                    height={40}
                    className="h-10 w-27"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <p className="text-sm tracking-heading text-muted text-trim">Wow! It’s as dry as the Sahara!</p>
                </motion.div>
              )
            ) : (
              <motion.div key="hist" {...fade} className="scrollbar-none -mx-4 flex snap-x gap-3 overflow-x-auto px-4">
                {history.length ? (
                  history.map((s, i) => (
                    <MiniShiftCard key={`${s.id}-${i}`} shift={s} cta="Completed ✓" onCta={() => onOpenShift(s)} onOpen={() => onOpenShift(s)} index={i} />
                  ))
                ) : (
                  <p className="flex h-26.5 w-full items-center justify-center rounded-2xl border border-line text-sm text-muted">
                    Finished shifts show up here.
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <h2 className="mt-6 text-xl font-medium tracking-snug text-n-ink-2 text-trim">Open Shifts</h2>
        <Segmented id="home-pool" className="mt-4" options={["All Shifts", "Applied"] as const} value={pool} onChange={setPool} />
      </div>
      <div className="scrollbar-none mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {poolList.length ? (
            poolList.map((s, i) => (
              <MiniShiftCard
                key={s.id}
                shift={s}
                index={i}
                saved={saved.has(s.id)}
                cta="Accept this shift"
                onCta={() => onAccept(s)}
                onOpen={() => onOpenShift(s)}
                onSave={() => onSave(s.id)}
              />
            ))
          ) : (
            <motion.p key="none" {...fade} className="flex h-26.5 w-full items-center justify-center rounded-2xl border border-line px-6 text-center text-sm text-muted">
              Tap the heart on a shift to keep it here.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ================================================================== */
/* Open Shifts / My Shifts lists                                      */

export function ShiftListScreen({
  mode,
  open,
  active,
  history,
  onBack,
  onOpenShift,
  onOpenActive,
  onMyShifts,
}: {
  mode: "open" | "mine";
  open: NurseShift[];
  active: Active | null;
  history: NurseShift[];
  onBack: () => void;
  onOpenShift: (s: NurseShift) => void;
  onOpenActive: () => void;
  onMyShifts: () => void;
}) {
  const tabs = mode === "open" ? (["All Shifts", "Accepted"] as const) : (["Active Shifts", "History"] as const);
  const [tab, setTab] = useState<string>(tabs[0]);
  const [q, setQ] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<Set<string>>(new Set());

  const source: NurseShift[] =
    tab === "All Shifts" ? open : tab === "History" ? history : active ? [active.shift] : [];
  const list = source.filter((s) => {
    const hay = `${s.facility} ${s.unit} ${s.role} ${s.period}`.toLowerCase();
    if (q && !hay.includes(q.toLowerCase())) return false;
    if (!filters.size) return true;
    return filters.has(s.period) || (filters.has("Urgent") && !!s.urgent);
  });
  const toggle = (f: string) =>
    setFilters((prev) => {
      const n = new Set(prev);
      if (n.has(f)) n.delete(f);
      else n.add(f);
      return n;
    });

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader
        title={mode === "open" ? "Open Shifts" : "My Shifts"}
        onBack={onBack}
        right={
          mode === "open" ? (
            <button type="button" onClick={onMyShifts} className="text-base leading-none font-medium whitespace-nowrap text-brand-orange text-trim">
              My Shifts
            </button>
          ) : (
            <CircleIcon src="btn-filter" label="Filters" onClick={() => setFiltersOpen((o) => !o)} />
          )
        }
      />
      <Body roomy={false} top="list">
        <Segmented id={`list-${mode}`} options={tabs} value={tab} onChange={setTab} />
        <div className="mt-4 flex items-center gap-3">
          <label className="flex flex-1 items-center gap-4 rounded-3xl bg-n-search px-4 py-2.75">
            <img src="/nurse/icon-search.svg" alt="" width={18} height={18} className="size-4.5" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Open Shifts"
              className="min-w-0 flex-1 bg-transparent text-base leading-6 tracking-snug text-black outline-none placeholder:text-n-search-text"
            />
          </label>
          {mode === "open" && (
            <motion.button
              type="button"
              aria-label="Filters"
              aria-expanded={filtersOpen}
              whileTap={{ scale: 0.88 }}
              onClick={() => setFiltersOpen((o) => !o)}
              className={`grid size-10 place-items-center rounded-full drop-shadow-btn transition-colors ${filtersOpen || filters.size ? "bg-n-tag" : "bg-white"}`}
            >
              <img src="/nurse/icon-filter.svg" alt="" width={19} height={16} className="h-4 w-4.75" />
            </motion.button>
          )}
        </div>
        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="flex flex-wrap gap-2 pt-4">
                {["AM", "PM", "NOC", "Urgent"].map((f) => (
                  <motion.button
                    key={f}
                    type="button"
                    whileTap={{ scale: 0.92 }}
                    onClick={() => toggle(f)}
                    className={`rounded-full border px-3.5 py-2 text-xs font-medium transition-colors ${
                      filters.has(f) ? "border-brand-orange bg-n-tag text-brand-orange" : "border-line bg-white text-n-chip-text"
                    }`}
                  >
                    {f === "Urgent" ? "Urgent only" : `${f} Shift`}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-4 overflow-hidden rounded-3xl border border-n-card-2">
          <AnimatePresence initial={false} mode="popLayout">
            {list.length ? (
              list.map((s, i) => (
                <ShiftRow
                  key={s.id}
                  shift={s}
                  index={i}
                  onOpen={() => (active && active.shift.id === s.id ? onOpenActive() : onOpenShift(s))}
                />
              ))
            ) : (
              <motion.p key="empty" {...fade} className="p-8 text-center text-sm text-muted">
                {tab === "History" ? "Your finished shifts will appear here." : tab === "All Shifts" ? "No shifts match that search." : "You haven’t accepted a shift yet."}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </Body>
    </div>
  );
}

/* ================================================================== */
/* Shift Details before accepting                                     */

const DETAIL_TABS = ["Schedule", "Location", "Match Criteria", "Facility"] as const;

export function ShiftDetailsScreen({
  shift,
  readOnly,
  onBack,
  onAccept,
  onDecline,
  onCopy,
}: {
  shift: NurseShift;
  readOnly?: boolean;
  onBack: () => void;
  onAccept: () => void;
  onDecline: () => void;
  onCopy: () => void;
}) {
  const [tab, setTab] = useState<(typeof DETAIL_TABS)[number]>("Schedule");
  const [urgentOpen, setUrgentOpen] = useState(true);
  const [uTab, setUTab] = useState<"Duties" | "Journal">("Duties");
  const maps = encodeURIComponent(`${shift.clinic}, ${shift.address}`);

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Shift Details" onBack={onBack} />
      <Body top={shift.urgent && urgentOpen ? "banner" : "detail"}>
        <div className="flex flex-col gap-8">
          <AnimatePresence initial={false}>
            {shift.urgent && urgentOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, height: 0, marginBottom: -32 }}
                className="relative -mb-3 flex flex-col gap-4 overflow-hidden rounded-2xl bg-n-urgent-bg p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-2xl leading-none font-medium tracking-heading text-brand-deep text-trim">Urgent Shift</p>
                  <motion.button type="button" aria-label="Dismiss" whileTap={{ scale: 0.85 }} onClick={() => setUrgentOpen(false)} className="relative size-8.5">
                    <img src="/nurse/btn-close-urgent.svg" alt="" width={42} height={42} className="absolute -inset-x-1 top-0 -bottom-2 size-10.5 max-w-none" />
                  </motion.button>
                </div>
                <p className="text-xs leading-normal tracking-snug text-n-urgent-text">
                  Grab this opportunity now and earn a ${shift.bonus ?? 30} incentive! Act fast and secure your spot for this urgent shift. Don’t miss out on this chance to earn extra cash quickly.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          <FacilityTitle shift={shift} />

          {shift.urgent ? (
            <>
              <Segmented id="u-tabs" options={["Duties", "Journal"] as const} value={uTab} onChange={setUTab} />
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={uTab} {...fade}>
                  {uTab === "Duties" ? <Duties done={DUTIES.map(() => false)} locked /> : <Journal entries={[]} locked />}
                </motion.div>
              </AnimatePresence>
            </>
          ) : (
            <>
              <div role="tablist" className="flex w-full items-center gap-3.75 text-base leading-none font-medium tracking-heading whitespace-nowrap">
                {DETAIL_TABS.map((t) => (
                  <button
                    key={t}
                    role="tab"
                    type="button"
                    aria-selected={t === tab}
                    onClick={() => setTab(t)}
                    className={`relative pb-2 transition-colors ${t === tab ? "text-black" : "text-n-tab-idle hover:text-muted"}`}
                  >
                    <span className="text-trim">{t}</span>
                    {t === tab && <motion.span layoutId="detail-tab" className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-brand-orange" />}
                  </button>
                ))}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={tab} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.18 }}>
                  {tab === "Schedule" && (
                    <div className="flex w-full items-start gap-8">
                      <div className="flex flex-1 flex-col gap-4">
                        <div className="flex flex-col gap-2.5 leading-normal">
                          <p className="text-base font-medium tracking-heading text-black text-trim">{shift.period} Shift</p>
                          <p className="text-xs tracking-heading text-placeholder text-trim">{HOURS[shift.period]}</p>
                        </div>
                        <p className="text-3xs leading-normal tracking-heading text-placeholder italic">
                          Please be at the facility at least 30 minutes before your shift.{" "}
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${maps}`}
                            target="_blank"
                            rel="noopener"
                            className="font-medium text-brand-orange underline decoration-from-font"
                          >
                            Calculate your travel time
                          </a>
                        </p>
                      </div>
                      <p className="text-xs leading-normal font-medium tracking-heading whitespace-nowrap text-black text-trim">{shift.longDate}</p>
                    </div>
                  )}
                  {tab === "Location" && (
                    <div className="flex flex-col items-center gap-4">
                      <div className="flex w-full items-center gap-4 rounded-3xl border border-n-card-2 bg-white p-2.5">
                        <div className="relative size-22.5 shrink-0 overflow-hidden rounded-2xl">
                          <Image src="/nurse/map.png" alt="Map of the facility" fill sizes="90px" className="object-cover" />
                          <motion.span
                            className="absolute top-1/2 left-1/2 size-3 -translate-1/2 rounded-full bg-brand-orange ring-4 ring-brand-orange/30"
                            animate={{ scale: [1, 1.3, 1] }}
                            transition={{ duration: 1.6, repeat: Infinity }}
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-4 leading-normal">
                          <p className="text-base font-medium tracking-heading text-black text-trim">{shift.clinic}</p>
                          <p className="text-xs tracking-heading text-muted">{shift.address}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3.5 text-xs font-medium tracking-heading whitespace-nowrap text-black">
                        <button type="button" onClick={onCopy} className="underline decoration-from-font hover:text-brand-orange">
                          Copy Address
                        </button>
                        <span className="h-4.25 w-px bg-line-grid" />
                        <a href={`https://www.google.com/maps/search/?api=1&query=${maps}`} target="_blank" rel="noopener" className="underline decoration-from-font hover:text-brand-orange">
                          View on Google Maps
                        </a>
                        <span className="h-4.25 w-px bg-line-grid" />
                        <a href={`https://maps.apple.com/?q=${maps}`} target="_blank" rel="noopener" className="underline decoration-from-font hover:text-brand-orange">
                          View on Apple Maps
                        </a>
                      </div>
                    </div>
                  )}
                  {tab === "Match Criteria" && (
                    <div className="flex flex-wrap gap-3">
                      {shift.criteria.map((c, i) => (
                        <motion.span
                          key={c}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1, transition: { delay: i * 0.05 } }}
                          className="rounded-full bg-n-chip px-3.5 py-3 text-xs leading-none font-medium tracking-heading text-n-chip-text"
                        >
                          <span className="block text-trim">{c}</span>
                        </motion.span>
                      ))}
                    </div>
                  )}
                  {tab === "Facility" && (
                    <div className="flex flex-col gap-4 leading-normal">
                      {[
                        ["Address", shift.address],
                        ["Email", "scheduler@acme.com"],
                        ["Contact Person", "Jane Doe Smith"],
                        ["Contact Number", "+1 234 566 7890"],
                      ].map(([k, v]) => (
                        <div key={k} className="flex flex-col gap-3">
                          <p className="text-xs font-medium tracking-heading text-muted text-trim">{k}</p>
                          <p className="text-base tracking-heading text-ink-pill text-trim">{v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </Body>
      {!readOnly && (
        <ActionBar>
          <BigButton onClick={onAccept}>Accept</BigButton>
          <BigButton variant="outline" onClick={onDecline}>
            Decline
          </BigButton>
        </ActionBar>
      )}
    </div>
  );
}

/* ================================================================== */
/* Duties & Journal                                                   */

export function Duties({
  done,
  onToggle,
  locked,
}: {
  done: boolean[];
  onToggle?: (i: number) => void;
  locked?: boolean;
}) {
  const [filter, setFilter] = useState<"All" | "Today" | "Completed">("All");
  const completed = done.filter(Boolean).length;
  const counts = { All: DUTIES.length, Today: DUTIES.length, Completed: completed };
  const rows = DUTIES.map((d, i) => ({ ...d, i })).filter((d) => filter !== "Completed" || done[d.i]);

  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex w-full items-center justify-end gap-2 text-2xs leading-none tracking-heading whitespace-nowrap">
        {(["All", "Today", "Completed"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 rounded-full border p-1.5 transition-colors ${
              filter === f ? "border-brand-orange bg-n-tag text-brand-orange" : "border-n-filter text-brand-orange"
            }`}
          >
            <span className="text-trim">{f}</span>
            <motion.span key={counts[f]} initial={{ y: -6, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-trim">
              {counts[f]}
            </motion.span>
          </button>
        ))}
      </div>
      <motion.div layout className="flex w-full flex-col gap-2.5">
        <AnimatePresence initial={false} mode="popLayout">
          {rows.map((d, k) => (
            <motion.button
              key={d.title}
              type="button"
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0, transition: { delay: k * 0.04 } }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => onToggle?.(d.i)}
              className={`flex w-full items-center gap-3 rounded-3xl border px-4 py-5.5 text-left transition-colors ${
                done[d.i] ? "border-n-filter bg-n-tag-soft" : "border-line bg-white"
              }`}
            >
              <span className="flex flex-1 flex-col gap-3 leading-normal">
                <span className={`text-base font-medium tracking-heading transition-colors text-trim ${done[d.i] ? "text-muted line-through" : "text-black"}`}>
                  {d.title}
                </span>
                <span className="text-sm tracking-heading text-muted text-trim">{d.body}</span>
              </span>
              <span className="relative grid size-6 shrink-0 place-items-center">
                <img src="/nurse/task-circle.svg" alt="" width={24} height={24} className="size-6" />
                <AnimatePresence>
                  {done[d.i] && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 600, damping: 18 }}
                      className="absolute inset-0 grid place-items-center rounded-full bg-brand-orange text-white"
                    >
                      <svg viewBox="0 0 12 12" className="size-3.5" aria-hidden>
                        <motion.path d="M2.5 6.2 5 8.6l4.6-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} />
                      </svg>
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
        {rows.length === 0 && <p className="py-6 text-center text-sm text-muted">{locked ? "Duties unlock once you clock in." : "Tick off a duty and it lands here."}</p>}
      </motion.div>
    </div>
  );
}

export function Journal({
  entries,
  onAdd,
  locked,
}: {
  entries: { id: number; text: string; at: string }[];
  onAdd?: (text: string) => void;
  locked?: boolean;
}) {
  const [text, setText] = useState("");
  return (
    <div className="flex w-full flex-col gap-4">
      {!locked && (
        <div className="flex flex-col gap-3 rounded-3xl border border-line p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Notes for the next shift, a resident update, anything worth handing off…"
            className="resize-none bg-transparent text-sm leading-normal text-black outline-none placeholder:text-placeholder"
          />
          <motion.button
            type="button"
            whileTap={{ scale: 0.96 }}
            disabled={!text.trim()}
            onClick={() => {
              onAdd?.(text.trim());
              setText("");
            }}
            className="self-end rounded-full bg-brand-orange px-4 py-2 text-sm font-medium text-white transition-opacity disabled:opacity-40"
          >
            Add entry
          </motion.button>
        </div>
      )}
      <AnimatePresence initial={false}>
        {entries.map((e) => (
          <motion.div key={e.id} layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl bg-n-chip p-4">
            <p className="text-sm leading-normal text-black">{e.text}</p>
            <p className="mt-2 text-2xs text-muted italic">{e.at}</p>
          </motion.div>
        ))}
      </AnimatePresence>
      {entries.length === 0 && (
        <p className="py-4 text-center text-sm text-muted">{locked ? "The journal opens once this shift is yours." : "No entries yet."}</p>
      )}
    </div>
  );
}

/* ================================================================== */
/* Accepted / clocked-in shift                                        */

export function ActiveShiftScreen({
  active,
  onBack,
  onClockIn,
  onClockOut,
  onBreak,
  onEndBreak,
  onCallOff,
  onSkip,
  onToggleDuty,
  onJournal,
  onFilter,
}: {
  active: Active;
  onBack: () => void;
  onClockIn: () => void;
  onClockOut: () => void;
  onBreak: () => void;
  onEndBreak: () => void;
  onCallOff: () => void;
  onSkip: () => void;
  onToggleDuty: (i: number) => void;
  onJournal: (t: string) => void;
  onFilter: () => void;
}) {
  const onShift = active.phase !== "waiting";
  const tabs = useMemo(() => (onShift ? (["Clock", "Duties", "Journal"] as const) : (["Duties", "Journal"] as const)), [onShift]);
  const [tab, setTab] = useState<string>(onShift ? "Clock" : "Duties");
  // Jump to the timer whenever the shift starts, a break starts, or the break ends.
  useEffect(() => {
    if (active.phase !== "waiting") setTab("Clock");
  }, [active.phase]);
  const current = (tabs as readonly string[]).includes(tab) ? tab : tabs[0];
  const canClockIn = active.startsIn <= 300;
  const mealReady = active.elapsed >= 10 && !active.mealTaken;

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Shift Details" onBack={onBack} right={<CircleIcon src="btn-filter" label="Shift options" onClick={onFilter} />} />
      <Body top={onShift ? "detail" : "banner"}>
        <div className="flex flex-col gap-8">
          <AnimatePresence mode="popLayout" initial={false}>
            {!onShift && (
              <motion.div key={active.justAccepted ? "ok" : "count"} layout className="-mb-2.5" initial={{ opacity: 0, y: -10, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}>
                <div
                  className={`relative overflow-hidden rounded-3xl p-2.5 text-center text-sm leading-none font-medium tracking-heading text-white ${
                    active.justAccepted ? "bg-n-accepted" : "bg-brand-orange"
                  }`}
                >
                  {!active.justAccepted && (
                    <motion.span aria-hidden className="absolute inset-0 bg-shimmer animate-shimmer motion-reduce:hidden" />
                  )}
                  <span className="relative block tabular-nums text-trim">
                    {active.justAccepted
                      ? "You have accepted this shift!"
                      : active.startsIn > 0
                        ? `Your shift starts at ${dhms(active.startsIn)}`
                        : "Your shift has started — clock in!"}
                  </span>
                </div>
                {!active.justAccepted && active.startsIn > 300 && (
                  <button type="button" onClick={onSkip} className="mx-auto mt-2 block text-2xs text-muted underline decoration-from-font hover:text-brand-orange">
                    Demo: skip to 5 minutes before the shift ⏩
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <FacilityTitle shift={active.shift} />
          <motion.div layout="position">
            <Segmented id={`active-${tabs.length}`} options={tabs} value={current} onChange={setTab} />
          </motion.div>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={current} {...fade}>
              {current === "Clock" && <ClockCard active={active} />}
              {current === "Duties" && <Duties done={active.done} onToggle={onToggleDuty} locked={!onShift} />}
              {current === "Journal" && <Journal entries={active.journal} onAdd={onJournal} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </Body>
      <ActionBar>
        {active.phase === "waiting" && (
          <>
            <BigButton variant={canClockIn ? "primary" : "disabled"} onClick={onClockIn} aria-disabled={!canClockIn}>
              Clock In
            </BigButton>
            <BigButton variant="outline" onClick={onCallOff}>
              Call Off
            </BigButton>
          </>
        )}
        {active.phase === "clocked" && (
          <>
            <BigButton variant={mealReady ? "primary" : "disabled"} onClick={mealReady ? onBreak : undefined} aria-disabled={!mealReady}>
              Meal Break
            </BigButton>
            <BigButton variant="outline" onClick={onClockOut}>
              Clock Out
            </BigButton>
          </>
        )}
        {active.phase === "break" && (
          <>
            <BigButton onClick={onEndBreak}>Clock In</BigButton>
            <BigButton variant="outline" onClick={onClockOut}>
              Clock Out
            </BigButton>
          </>
        )}
      </ActionBar>
    </div>
  );
}

function ClockCard({ active }: { active: Active }) {
  const onBreak = active.phase === "break";
  const digits = onBreak ? hms(active.breakLeft) : hms(active.elapsed);
  return (
    <motion.div layout className="flex w-full flex-col items-center gap-6 rounded-3xl border border-line p-4">
      <div className="flex items-center justify-center gap-3">
        <AnimatePresence mode="wait" initial={false}>
          <motion.img
            key={onBreak ? "coffee" : "case"}
            src={onBreak ? "/nurse/icon-coffee.svg" : "/nurse/icon-briefcase.svg"}
            alt=""
            width={24}
            height={20}
            initial={{ rotate: -20, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 20, opacity: 0 }}
            className={onBreak ? "h-4 w-5.5" : "h-5 w-6"}
          />
        </AnimatePresence>
        <p className="text-base leading-none tracking-heading whitespace-nowrap text-muted text-trim">
          {onBreak ? "Your break will end at" : "You are now clocked in"}
        </p>
      </div>
      <p className={`flex text-6xl leading-none font-medium tabular-nums transition-colors duration-500 text-trim ${onBreak ? "text-n-break" : "text-black"}`}>
        {digits.split("").map((ch, i) => (
          <span key={i} className="relative inline-block overflow-hidden">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={ch + i}
                className="inline-block"
                initial={{ y: onBreak ? "-100%" : "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: onBreak ? "100%" : "-100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              >
                {ch}
              </motion.span>
            </AnimatePresence>
          </span>
        ))}
      </p>
    </motion.div>
  );
}

/* ================================================================== */
/* Shift Summary                                                      */

export function SummaryScreen({
  active,
  onBack,
  onConfirm,
}: {
  active: Active;
  onBack: () => void;
  onConfirm: () => void;
}) {
  const s = active.shift;
  const done = active.done.filter(Boolean).length;
  const sections: { title: string; rows: [string, string, string?][] }[] = [
    { title: "Schedule", rows: [[`${s.period} Shift`, s.date, `Time of Shift: ${HOURS[s.period].replace(" - ", " to ")}`]] },
    {
      title: "Biometrics",
      rows: [
        ["Clock in status:", "On time"],
        ["Clocked in at:", active.clockedInAt ?? "—"],
        ["Location:", "Blumentritt, California"],
        ["Break status:", active.mealTaken ? "Taken" : "Skipped"],
        ["Taken at:", active.breakAt ?? "—"],
        ["Clock out status:", "On time"],
        ["Clocked out at:", `${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}, ${new Date(s.longDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`],
        ["Location:", "Blumentritt, California"],
      ],
    },
    {
      title: "Tasks",
      rows: DUTIES.map((d, i) => [d.title, active.done[i] ? "Completed" : "Not done", active.done[i] ? "Logged during this shift" : undefined] as [string, string, string?]),
    },
    { title: "Mileage", rows: [["Purchase Medication", "1.23 Miles", "Logged during this shift"]] },
    { title: "Expenses/Credits", rows: [["Gasoline Fee", "$50.00", "Logged during this shift"]] },
    { title: "SafeShift", rows: [["Did you have a safe shift today?", "Yes"]] },
  ];

  return (
    <div className="flex h-full flex-col">
      <ScreenHeader title="Shift Summary" onBack={onBack} right={<CircleIcon src="btn-download" label="Download summary" onClick={onConfirm} />} />
      <Body>
        <div className="flex flex-col gap-8">
          <FacilityTitle shift={s} />
          <p className="-mt-4 rounded-2xl bg-n-tag-soft px-4 py-3 text-xs text-brand-deep">
            {done}/{DUTIES.length} duties done · {hms(active.elapsed)} on the clock
          </p>
          {sections.map((sec, si) => (
            <motion.section
              key={sec.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0, transition: { delay: 0.05 + si * 0.06 } }}
              className="flex flex-col gap-5"
            >
              <h3 className="text-xl leading-none font-medium tracking-heading text-black text-trim">{sec.title}</h3>
              <div className="flex flex-col gap-4">
                {sec.rows.map(([k, v, sub], i) => (
                  <div key={`${k}-${i}`} className="flex flex-col gap-3 text-xs leading-normal tracking-heading">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-black text-trim">{k}</p>
                      <p className={`text-right whitespace-nowrap text-trim ${v === "Not done" ? "text-n-urgent" : "text-muted-2"}`}>{v}</p>
                    </div>
                    {sub && <p className="text-2xs text-muted-2 italic text-trim">{sub}</p>}
                  </div>
                ))}
              </div>
            </motion.section>
          ))}
        </div>
      </Body>
      <ActionBar>
        <BigButton onClick={onConfirm}>Confirm and Download</BigButton>
      </ActionBar>
    </div>
  );
}

/* ================================================================== */
/* Calling Off Reasons modal                                          */

export function CallOffModal({ onClose, onSubmit, reasons }: { onClose: () => void; onSubmit: (r: string) => void; reasons: string[] }) {
  const [picked, setPicked] = useState<string | null>(null);
  return (
    <motion.div className="absolute inset-0 z-40 flex items-center justify-center bg-black/30 px-4 backdrop-blur-xs" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
      <motion.div
        role="dialog"
        aria-label="Calling Off Reasons"
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 60, scale: 0.92, opacity: 0 }}
        animate={{ y: 0, scale: 1, opacity: 1 }}
        exit={{ y: 40, scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", stiffness: 380, damping: 30 }}
        className="flex w-full flex-col overflow-hidden rounded-4xl bg-white shadow-modal"
      >
        <div className="flex items-center justify-center border-b border-line px-8 py-4.5">
          <p className="text-2xl leading-none font-medium text-black text-trim">Calling Off Reasons</p>
        </div>
        <div className="flex flex-col items-center gap-8 p-6">
          <div className="flex w-full flex-col gap-4">
            {reasons.map((r, i) => (
              <motion.button
                key={r}
                type="button"
                onClick={() => setPicked(r)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.05 + i * 0.035 } }}
                whileTap={{ scale: 0.98 }}
                className={`w-full rounded-3xl border px-4 py-5 text-center text-lg leading-none transition-colors ${
                  picked === r ? "border-brand-orange bg-n-tag text-brand-deep" : "border-line text-black hover:bg-n-chip"
                }`}
              >
                <span className="text-trim">{r}</span>
              </motion.button>
            ))}
          </div>
          <motion.button
            type="button"
            disabled={!picked}
            onClick={() => picked && onSubmit(picked)}
            animate={{ backgroundColor: picked ? "#ff5702" : "#eaeaea", color: picked ? "#ffffff" : "#696969" }}
            whileTap={picked ? { scale: 0.97 } : undefined}
            className="flex h-12.5 w-full items-center justify-center rounded-3xl text-base font-medium"
          >
            Submit
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}
