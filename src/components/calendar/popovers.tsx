"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState, type ReactNode } from "react";
import { AutoHeight, FieldLabel, PopButton, Segmented } from "@/components/ui/primitives";
import {
  CELLS,
  END_TIME,
  formatCellDate,
  START_TIME,
  weekdayOf,
  type Period,
  type Shift,
} from "@/lib/calendar-data";
import { CnaCard, CompletionRing, Row, ScheduleBlock, StaffPicker, StarRating, TaskList } from "./parts";
import { PopoverHeader } from "./Popover";
import { ShiftChip } from "./ShiftChip";

export type Actions = {
  close: () => void;
  update: (id: string, patch: Partial<Shift>) => void;
  remove: (id: string) => void;
  add: (shifts: Omit<Shift, "id">[]) => void;
  open: (kind: PopKind, opts?: { shiftId?: string; cell?: number }) => void;
  log: (text: string) => void;
  toast: (msg: ReactNode, opts?: { tone?: "default" | "success" | "info" | "danger"; action?: { label: string; onClick: () => void } }) => void;
  goal: (g: Goal) => void;
  highlight: (ids: string[]) => void;
};

export type PopKind =
  | "open"
  | "details"
  | "completed"
  | "calloff"
  | "new"
  | "template"
  | "timeoff"
  | "availability"
  | "more"
  | "legend"
  | "history";

export type Goal = "open" | "rate" | "resend" | "template" | "timeoff" | "notifs";

const first = (name?: string) => name?.split(" ")[0] ?? "";

function Body({ children }: { children: ReactNode }) {
  return <div className="flex w-full flex-col items-end gap-6 p-4">{children}</div>;
}

function Footer({ children, row }: { children: ReactNode; row?: boolean }) {
  return <div className={`flex w-full gap-4 p-4 ${row ? "items-center" : "flex-col"}`}>{children}</div>;
}

function Swap({ k, children }: { k: string; children: ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={k}
        className="flex w-full flex-col items-end gap-6"
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -12 }}
        transition={{ duration: 0.18 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function Confirmation({ children }: { children: ReactNode }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      className="w-full p-4 text-center text-base leading-normal font-medium tracking-ui text-placeholder italic"
    >
      {children}
    </motion.p>
  );
}

/* ---------------------------------------------------------------- */
/* Open Shift — screen "Facility: Calendar Monthly View Open Shift"  */

export function OpenShiftPopover({ shift, a }: { shift: Shift; a: Actions }) {
  const [period, setPeriod] = useState<Period>(shift.period);
  const [recurrence, setRecurrence] = useState("Never");
  const [listOpen, setListOpen] = useState(false);
  const [assignees, setAssignees] = useState<string[]>([]);
  const [referred, setReferred] = useState(false);
  const [saving, setSaving] = useState(false);
  const isDraft = shift.kind === "draft";

  const submit = () => {
    setSaving(true);
    window.setTimeout(() => {
      const date = formatCellDate(shift.cell, "short");
      if (assignees.length) {
        a.update(shift.id, { kind: "scheduled", period, cna: assignees[0], fresh: true });
        if (assignees.length > 1)
          a.add(assignees.slice(1).map((cna) => ({ cell: shift.cell, kind: "scheduled", period, cna, fresh: true })));
        a.toast(`${period} shift on ${date} assigned to ${assignees.map(first).join(", ")}`, { tone: "success" });
        a.log(`Assigned ${period} shift on ${date} to ${assignees.join(", ")}`);
        a.goal("open");
      } else {
        a.update(shift.id, { kind: "open", period, fresh: true });
        a.toast(
          referred
            ? `${period} shift on ${date} posted to Partner Agencies`
            : `${period} shift on ${date} posted to My Staff`,
          { tone: "info" },
        );
        a.log(`${isDraft ? "Created" : "Re-posted"} open ${period} shift on ${date}${referred ? " (agencies)" : ""}`);
      }
      if (recurrence !== "Never") a.toast(`Repeats ${recurrence.toLowerCase()}`, { tone: "info" });
      a.close();
    }, 650);
  };

  return (
    <>
      <PopoverHeader title="Open Shift" onClose={a.close} />
      <AutoHeight>
        <Body>
          <div className="flex w-full flex-col gap-4">
            <FieldLabel>Time of Shift</FieldLabel>
            <Segmented id={`p-${shift.id}`} options={["AM", "PM", "NOC"] as const} value={period} onChange={setPeriod} />
            <motion.p key={period} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-muted">
              {START_TIME[period]} – {END_TIME[period]} · {weekdayOf(shift.cell)}, {formatCellDate(shift.cell)}
            </motion.p>
          </div>

          <div className="flex w-full flex-col gap-4">
            <FieldLabel>Shift Recurrence</FieldLabel>
            <div className="relative w-full">
              <button
                type="button"
                onClick={() => setListOpen((o) => !o)}
                aria-expanded={listOpen}
                className={`flex w-full items-center rounded-3xl border bg-white p-4 text-left text-base leading-none tracking-ui text-black transition-colors ${
                  listOpen ? "border-black" : "border-input-border hover:border-black"
                }`}
              >
                <span className="flex-1 text-trim">{recurrence}</span>
                <motion.img src="/assets/icon-caret-down.svg" alt="" width={14} height={8} animate={{ rotate: listOpen ? 180 : 0 }} className="h-2 w-3.5" />
              </button>
              <AnimatePresence>
                {listOpen && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2 overflow-hidden rounded-3xl border border-line bg-white p-1"
                  >
                    {["Never", "Daily", "Every weekday", "Weekly", "Monthly"].map((r) => (
                      <li key={r}>
                        <button
                          type="button"
                          onClick={() => {
                            setRecurrence(r);
                            setListOpen(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface ${
                            r === recurrence ? "text-brand" : "text-ink-strong"
                          }`}
                        >
                          {r}
                          {r === recurrence && <span>✓</span>}
                        </button>
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex w-full flex-col gap-4">
            <FieldLabel>Assignee</FieldLabel>
            <div className="flex w-full flex-col items-end gap-4">
              <StaffPicker value={assignees} onChange={setAssignees} />
              <button
                type="button"
                onClick={() => setReferred((r) => !r)}
                className="flex items-center gap-1.5 px-3 py-2 text-sm leading-normal tracking-ui text-black"
              >
                <AnimatePresence initial={false}>
                  {referred && (
                    <motion.span initial={{ scale: 0, width: 0 }} animate={{ scale: 1, width: "auto" }} exit={{ scale: 0, width: 0 }} className="text-success">
                      ✓
                    </motion.span>
                  )}
                </AnimatePresence>
                <span className={`underline decoration-from-font underline-offset-2 transition-colors hover:text-brand text-trim ${referred ? "text-success" : ""}`}>
                  {referred ? "Referred to Partner Agencies" : "Refer to Partner Agencies"}
                </span>
              </button>
            </div>
          </div>
        </Body>
      </AutoHeight>
      <Footer>
        <PopButton onClick={submit} loading={saving} className="w-full">
          Create Shift
        </PopButton>
      </Footer>
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Scheduled / ongoing shift details                                 */

export function ShiftDetailsPopover({ shift, a }: { shift: Shift; a: Actions }) {
  const [tab, setTab] = useState<"Details" | "Tasks">("Details");
  const [confirm, setConfirm] = useState(false);
  const ongoing = shift.kind === "ongoing";

  const del = () => {
    if (!confirm) {
      setConfirm(true);
      return;
    }
    const snapshot = { ...shift };
    a.remove(shift.id);
    a.log(`Deleted ${shift.period} shift for ${shift.cna} on ${formatCellDate(shift.cell, "short")}`);
    a.toast(`Deleted ${first(shift.cna)}’s ${shift.period} shift`, {
      tone: "danger",
      action: { label: "Undo", onClick: () => a.add([{ ...snapshot, fresh: true }]) },
    });
    a.close();
  };

  return (
    <>
      <PopoverHeader title="Shift Details" onClose={a.close} />
      <AutoHeight>
        <Body>
          <Segmented id={`t-${shift.id}`} options={["Details", "Tasks"] as const} value={tab} onChange={setTab} />
          <Swap k={tab}>
            {tab === "Details" ? (
              <>
                <div className="flex w-full flex-col gap-4">
                  <FieldLabel>Assigned CNA</FieldLabel>
                  <CnaCard name={shift.cna ?? "Unassigned"} />
                </div>
                <ScheduleBlock shift={shift} onChangePeriod={ongoing ? undefined : (p) => a.update(shift.id, { period: p })} />
                {ongoing && (
                  <div className="flex w-full items-center gap-2 rounded-2xl bg-chip-live px-4 py-3 text-sm text-chip-live-fg">
                    <span className="relative flex size-2">
                      <span className="absolute inset-0 animate-ping rounded-full bg-chip-live-fg/60" />
                      <span className="relative size-2 rounded-full bg-chip-live-fg" />
                    </span>
                    Clocked in at 6:54 AM · on shift now
                  </div>
                )}
              </>
            ) : (
              <TaskList period={shift.period} doneCount={ongoing ? 2 : 0} />
            )}
          </Swap>
        </Body>
      </AutoHeight>
      {!ongoing && (
        <Footer>
          <PopButton onClick={del} className="w-full">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span key={String(confirm)} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="block">
                {confirm ? "Tap again to delete" : "Delete Shift"}
              </motion.span>
            </AnimatePresence>
          </PopButton>
        </Footer>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Completed shift — rating + completion + biometrics                */

export function CompletedPopover({ shift, a }: { shift: Shift; a: Actions }) {
  const [tab, setTab] = useState<"Details" | "Tasks">("Details");
  const [rating, setRating] = useState(shift.rating ?? 0);
  const [saved, setSaved] = useState(false);
  const date = `${formatCellDate(shift.cell, "short")}, 2023`;

  const rate = (v: number) => {
    setRating(v);
    setSaved(true);
    a.update(shift.id, { rating: v });
    a.log(`Rated ${shift.cna} ${v}/5`);
    a.goal("rate");
  };

  return (
    <>
      <PopoverHeader title="Shift Details" onClose={a.close} />
      <AutoHeight>
        <Body>
          <div className="flex w-full flex-col gap-4 bg-white">
            <p className="text-sm leading-normal text-black">
              This shift has been fulfilled! Rate {first(shift.cna)}’s performance.
            </p>
            <StarRating value={rating} onChange={rate} />
            <AnimatePresence>
              {saved && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="text-center text-xs text-success"
                >
                  Thanks! {first(shift.cna)} will see a {rating}-star rating.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
          <Segmented id={`c-${shift.id}`} options={["Details", "Tasks"] as const} value={tab} onChange={setTab} />
          <Swap k={tab}>
            {tab === "Details" ? (
              <>
                <div className="flex w-full flex-col gap-4">
                  <FieldLabel>Assigned CNA</FieldLabel>
                  <CnaCard name={shift.cna ?? ""} />
                </div>
                <ScheduleBlock shift={shift} />
                <div className="flex w-full flex-col gap-4">
                  <FieldLabel>Task Completion Rate</FieldLabel>
                  <div className="flex w-full items-center gap-4">
                    <CompletionRing percent={100} />
                    <p className="flex-1 text-base leading-normal tracking-ui text-black">
                      You completed every task.
                      <br />
                      Well done!
                    </p>
                  </div>
                </div>
                <div className="flex w-full flex-col gap-4">
                  <FieldLabel>Biometrics</FieldLabel>
                  <div className="flex w-full flex-col gap-4">
                    {[
                      ["Clock In:", `6:58 AM, ${date}`],
                      ["Break:", "Taken at 9:05 AM"],
                      ["Clock Out:", `4:32 PM, ${date}`],
                    ].map(([k, v], i) => (
                      <motion.div
                        key={k}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0, transition: { delay: 0.3 + i * 0.08 } }}
                        className="flex w-full items-center justify-between leading-normal whitespace-nowrap"
                      >
                        <p className="text-sm font-medium text-black text-trim">{k}</p>
                        <p className="text-xs text-muted-2 text-trim">{v}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <TaskList period={shift.period} doneCount={5} readOnly />
            )}
          </Swap>
        </Body>
      </AutoHeight>
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Urgent / called-off shift — "Send Back to My Staff / Agencies"    */

const REASONS = ["Child Care", "Sick Leave", "Transportation Issue", "Family Emergency"];

export function CallOffPopover({ shift, a }: { shift: Shift; a: Actions }) {
  const [tab, setTab] = useState<"Details" | "Tasks">("Details");
  const [assignees, setAssignees] = useState<string[]>([]);
  const [busy, setBusy] = useState<"staff" | "agencies" | null>(null);
  const reason = shift.kind === "urgent" ? "Child Care" : REASONS[Number(shift.id.replace(/\D/g, "")) % REASONS.length];
  const date = formatCellDate(shift.cell, "short");

  const send = (to: "staff" | "agencies") => {
    setBusy(to);
    window.setTimeout(() => {
      a.update(shift.id, { resentTo: to });
      a.log(`Resent ${shift.period} shift on ${date} to ${to === "staff" ? "My Staff" : "Partner Agencies"}`);
      a.goal("resend");
      setBusy(null);
    }, 700);
  };

  const assign = () => {
    a.update(shift.id, { kind: "scheduled", cna: assignees[0], resentTo: undefined, fresh: true });
    if (assignees.length > 1)
      a.add(assignees.slice(1).map((cna) => ({ cell: shift.cell, kind: "scheduled" as const, period: shift.period, cna, fresh: true })));
    a.toast(`Urgent ${shift.period} shift on ${date} filled by ${assignees.map(first).join(", ")}`, { tone: "success" });
    a.log(`Filled urgent ${shift.period} shift on ${date}`);
    a.goal("resend");
    a.close();
  };

  return (
    <>
      <PopoverHeader title="Shift Details" onClose={a.close} />
      <div className="relative flex w-full items-start justify-between overflow-hidden bg-payment px-4 py-2.5 text-sm leading-normal tracking-ui whitespace-nowrap text-white">
        <motion.span
          aria-hidden
          className="absolute inset-0 bg-shimmer animate-shimmer motion-reduce:hidden"
        />
        <p className="relative text-trim">Extra Payment for this Shift:</p>
        <p className="relative font-bold text-trim">$30</p>
      </div>
      <AutoHeight>
        <Body>
          <Segmented id={`u-${shift.id}`} options={["Details", "Tasks"] as const} value={tab} onChange={setTab} />
          <Swap k={tab}>
            {tab === "Details" ? (
              <>
                <div className="flex w-full flex-col gap-4">
                  <FieldLabel>Assignee</FieldLabel>
                  <StaffPicker value={assignees} onChange={setAssignees} />
                </div>
                <ScheduleBlock shift={shift} onChangePeriod={(p) => a.update(shift.id, { period: p })} />
                <div className="flex w-full flex-col gap-4 text-sm tracking-ui">
                  <FieldLabel>Reason for Call-Off:</FieldLabel>
                  <p className="leading-normal text-black text-trim">{reason}</p>
                </div>
              </>
            ) : (
              <TaskList period={shift.period} />
            )}
          </Swap>
        </Body>
        <AnimatePresence mode="wait" initial={false}>
          {assignees.length > 0 ? (
            <motion.div key="assign" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <Footer>
                <PopButton onClick={assign} className="w-full">
                  Assign {assignees.length > 1 ? `${assignees.length} CNAs` : first(assignees[0])}
                </PopButton>
              </Footer>
            </motion.div>
          ) : shift.resentTo ? (
            <Confirmation key="done">
              Shift Invitation was sent back to {shift.resentTo === "staff" ? "My Staff" : "Partner Agencies"}
            </Confirmation>
          ) : (
            <motion.div key="buttons" exit={{ opacity: 0, y: 8, filter: "blur(4px)" }}>
              <Footer>
                <PopButton onClick={() => send("staff")} loading={busy === "staff"} className="w-full">
                  Send Back to My Staff
                </PopButton>
                <PopButton variant="outline" onClick={() => send("agencies")} loading={busy === "agencies"} className="w-full">
                  Send Back to Agencies
                </PopButton>
              </Footer>
            </motion.div>
          )}
        </AnimatePresence>
      </AutoHeight>
    </>
  );
}

/* ---------------------------------------------------------------- */
/* New Shift → Create New / Use Template                             */

export function NewShiftPopover({ shift, a }: { shift: Shift; a: Actions }) {
  const [hover, setHover] = useState<"new" | "template" | null>(null);
  const hot = hover ?? "template";
  const tile =
    "flex size-35.75 flex-col items-center justify-center gap-6 rounded-3xl border px-4 text-base leading-none font-medium tracking-ui transition-colors duration-200";
  return (
    <>
      <PopoverHeader title="New Shift" onClose={a.close} />
      <div className="flex w-full justify-center gap-6 p-4" onMouseLeave={() => setHover(null)}>
        <motion.button
          type="button"
          onMouseEnter={() => setHover("new")}
          onFocus={() => setHover("new")}
          onClick={() => a.open("open", { shiftId: shift.id })}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.96 }}
          className={`${tile} ${hot === "new" ? "border-brand bg-brand/10 text-brand" : "border-dashed border-muted-2 text-muted"}`}
        >
          <motion.img
            src="/assets/icon-plus-grey.svg"
            alt=""
            width={24}
            height={24}
            animate={{ rotate: hot === "new" ? 90 : 0 }}
            className="size-6"
          />
          <span className="text-trim">Create New</span>
        </motion.button>
        <motion.button
          type="button"
          onMouseEnter={() => setHover("template")}
          onFocus={() => setHover("template")}
          onClick={() => a.open("template", { shiftId: shift.id })}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.96 }}
          className={`${tile} ${hot === "template" ? "border-brand bg-brand/10 text-brand" : "border-dashed border-muted-2 text-muted grayscale"}`}
        >
          <motion.img
            src="/assets/icon-template.svg"
            alt=""
            width={28.4}
            height={24}
            animate={hot === "template" ? { x: [0, -2, 2, 0] } : { x: 0 }}
            transition={{ duration: 0.5 }}
            className="h-6 w-7"
          />
          <span className="text-trim">Use Template</span>
        </motion.button>
      </div>
    </>
  );
}

export function TemplatePopover({ shift, a }: { shift: Shift; a: Actions }) {
  const pick = (p: Period) => {
    a.update(shift.id, { kind: "open", period: p, fresh: true });
    const date = formatCellDate(shift.cell, "short");
    a.toast(`${p} Shift template added to ${date}`, { tone: "success" });
    a.log(`Created open ${p} shift on ${date} from template`);
    a.goal("template");
    a.close();
  };
  return (
    <>
      <PopoverHeader title="Select Template" onClose={a.close} />
      <div className="flex w-full flex-col items-end gap-4 p-4">
        {(["AM", "PM", "NOC"] as const).map((p, i) => (
          <motion.button
            key={p}
            type="button"
            onClick={() => pick(p)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            className="group flex w-full flex-col items-start justify-center gap-3 rounded-4xl border border-input-border bg-white px-4.75 py-3.5 text-left leading-normal whitespace-nowrap transition-colors hover:border-brand hover:bg-brand/5"
          >
            <span className="flex w-full items-center justify-between text-base font-medium text-black">
              <span className="text-trim">{p} Shift</span>
              <span className="text-trim">CNA</span>
            </span>
            <span className="flex w-full items-center justify-between text-sm text-muted-2">
              <span className="text-trim">1 Shift</span>
              <span className="text-xs opacity-0 transition-opacity group-hover:opacity-100">
                {START_TIME[p]} – {END_TIME[p]}
              </span>
            </span>
          </motion.button>
        ))}
        <button
          type="button"
          onClick={() => a.open("open", { shiftId: shift.id })}
          className="flex w-full items-center justify-center rounded-4xl bg-surface px-4.75 py-3.5 text-base leading-normal font-medium text-muted-4 transition-colors hover:bg-line hover:text-ink"
        >
          <span className="text-trim">Create New Template</span>
        </button>
      </div>
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Time-off request & availability change (opened from notifications) */

export function TimeOffPopover({ a, decided, onDecide }: { a: Actions; decided: "Accepted" | "Denied" | null; onDecide: (d: "Accepted" | "Denied") => void }) {
  const [busy, setBusy] = useState<"Accepted" | "Denied" | null>(null);
  const decide = (d: "Accepted" | "Denied") => {
    setBusy(d);
    window.setTimeout(() => {
      onDecide(d);
      setBusy(null);
      a.log(`${d} Ivy West’s time-off request (Aug 10–14)`);
      a.goal("timeoff");
    }, 600);
  };
  return (
    <>
      <PopoverHeader title="Time-Off Request" onClose={a.close} />
      <AutoHeight>
        <Body>
          <CnaCard name="Ivy West" />
          <div className="flex w-full flex-col gap-4">
            <FieldLabel>Date of Time-Off</FieldLabel>
            <Row left="Aug 10-14, 2023" right="Monday to Friday" />
          </div>
          <div className="flex w-full flex-col gap-4">
            <FieldLabel>Affected Shifts</FieldLabel>
            <Row left="Aug 10, 2023" right="AM Shift" />
            <Row left="Aug 12, 2023" right="NOC Shift" />
          </div>
          <div className="flex w-full flex-col gap-4 text-sm">
            <FieldLabel>Reason for Time-Off:</FieldLabel>
            <p className="leading-normal tracking-ui text-black text-trim">Family Emergency</p>
          </div>
        </Body>
        <AnimatePresence mode="wait" initial={false}>
          {decided ? (
            <Confirmation key="d">Time-Off Request was {decided}</Confirmation>
          ) : (
            <motion.div key="b" exit={{ opacity: 0, y: 8, filter: "blur(4px)" }}>
              <Footer row>
                <PopButton onClick={() => decide("Accepted")} loading={busy === "Accepted"}>
                  Accept Request
                </PopButton>
                <PopButton variant="outline" onClick={() => decide("Denied")} loading={busy === "Denied"}>
                  Deny
                </PopButton>
              </Footer>
            </motion.div>
          )}
        </AnimatePresence>
      </AutoHeight>
    </>
  );
}

const LEO_WEEK: [string, boolean][] = [
  ["Sunday", false],
  ["Monday", true],
  ["Tuesday", true],
  ["Wednesday", true],
  ["Thursday", true],
  ["Friday", true],
  ["Saturday", false],
];

export function AvailabilityPopover({ a, shifts }: { a: Actions; shifts: Shift[] }) {
  const suggest = () => {
    const ids = shifts
      .filter((s) => s.kind === "open" && !s.overflow && CELLS[s.cell].inMonth && LEO_WEEK[s.cell % 7][1])
      .map((s) => s.id);
    a.highlight(ids);
    a.toast(`${ids.length} open shifts fit Leo’s new availability`, { tone: "info" });
    a.log("Suggested open shifts to Leo Lake");
    a.close();
  };
  return (
    <>
      <PopoverHeader title="Availability Change" onClose={a.close} />
      <Body>
        <CnaCard name="Leo Lake" />
        <div className="flex w-full flex-col gap-4">
          <FieldLabel>Changes Made</FieldLabel>
          <Row left="Monday" right="Available" tone="ok" />
          <Row left="Saturday" right="Unavailable" />
        </div>
        <div className="flex w-full flex-col gap-4">
          <FieldLabel>Full Schedule</FieldLabel>
          {LEO_WEEK.map(([d, ok], i) => (
            <motion.div key={d} className="w-full" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0, transition: { delay: 0.1 + i * 0.035 } }}>
              <Row left={d} right={ok ? "Available" : "Unavailable"} tone={ok ? "ok" : "muted"} />
            </motion.div>
          ))}
        </div>
      </Body>
      <Footer row>
        <PopButton onClick={suggest}>Suggest Shifts</PopButton>
        <PopButton variant="outline" onClick={a.close}>
          Close
        </PopButton>
      </Footer>
    </>
  );
}

/* ---------------------------------------------------------------- */
/* Small utility popovers                                            */

export function MorePopover({ cell, shifts, onPick, a }: { cell: number; shifts: Shift[]; onPick: (s: Shift, el: HTMLElement) => void; a: Actions }) {
  const c = CELLS[cell];
  return (
    <>
      <PopoverHeader title={`${weekdayOf(cell)}, ${c.month} ${c.day}`} onClose={a.close} />
      <div className="flex w-full flex-col gap-1.5 p-4">
        <p className="mb-2 text-xs text-muted">{shifts.length} shifts on this day</p>
        {shifts.map((s, i) => (
          <ShiftChip key={s.id} shift={s} delay={i * 0.03} onClick={(el) => onPick(s, el)} />
        ))}
      </div>
    </>
  );
}

const LEGEND: [Shift["kind"], string][] = [
  ["open", "Posted and waiting for a CNA"],
  ["scheduled", "Filled and confirmed"],
  ["ongoing", "CNA is clocked in right now"],
  ["completed", "Done — ready for a rating"],
  ["called", "CNA called off; needs cover"],
  ["urgent", "Re-opened at the last minute"],
];

export function LegendPopover({ a }: { a: Actions }) {
  return (
    <>
      <PopoverHeader title="Legends" onClose={a.close} />
      <ul className="flex w-full flex-col gap-3 p-4">
        {LEGEND.map(([kind, text], i) => (
          <motion.li key={kind} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { delay: i * 0.04 } }} className="flex items-center gap-3">
            <div className="pointer-events-none w-40 shrink-0">
              <ShiftChip
                shift={{ id: `legend-${kind}`, cell: 0, kind, period: "AM", cna: "Ava Lane" }}
                onClick={() => {}}
              />
            </div>
            <p className="text-xs leading-normal text-muted">{text}</p>
          </motion.li>
        ))}
      </ul>
    </>
  );
}

export function HistoryPopover({ a, entries }: { a: Actions; entries: { id: number; text: string; at: string }[] }) {
  return (
    <>
      <PopoverHeader title="Recent Activity" onClose={a.close} />
      <ol className="scrollbar-none flex max-h-96 w-full flex-col overflow-y-auto p-4">
        <AnimatePresence initial={false}>
          {entries.map((e, i) => (
            <motion.li
              key={e.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0, transition: { delay: i * 0.03 } }}
              className="relative flex gap-3 pb-4 last:pb-0"
            >
              <span className="relative mt-1.5 flex flex-col items-center">
                <span className={`size-2 rounded-full ${i === 0 ? "bg-brand" : "bg-line-grid"}`} />
              </span>
              {i < entries.length - 1 && <span aria-hidden className="absolute top-4 left-0.75 h-full w-px bg-line" />}
              <div className="flex flex-col gap-1">
                <p className="text-sm leading-normal text-ink-strong">{e.text}</p>
                <p className="text-xs text-muted">{e.at}</p>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </>
  );
}
