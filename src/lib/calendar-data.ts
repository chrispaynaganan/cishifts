export type Period = "AM" | "PM" | "NOC";

export type ShiftKind =
  | "completed"
  | "ongoing"
  | "scheduled"
  | "open"
  | "called"
  | "urgent"
  | "draft";

export type Shift = {
  id: string;
  cell: number; // 0..34, left-to-right, top-to-bottom
  kind: ShiftKind;
  period: Period;
  cna?: string;
  /** Hidden behind the "View N more shifts" link in the month grid. */
  overflow?: boolean;
  /** Urgent / called-off follow-up that has already been handled. */
  resentTo?: "staff" | "agencies";
  rating?: number;
  /** Set when a shift was just created so the chip can celebrate. */
  fresh?: boolean;
};

export const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const MONTH_LABEL = "July 2023";
export const TODAY_CELL = 2; // Tuesday, July 1

export type CellDate = {
  day: number;
  month: "June" | "July" | "August";
  inMonth: boolean;
};

/** The 5×7 grid shown in the design: July 2023 with Tuesday the 1st. */
export const CELLS: CellDate[] = Array.from({ length: 35 }, (_, i) => {
  if (i === 0) return { day: 29, month: "June", inMonth: false };
  if (i === 1) return { day: 30, month: "June", inMonth: false };
  const day = i - 1;
  if (day > 31) return { day: day - 31, month: "August", inMonth: false };
  return { day, month: "July", inMonth: true };
});

export function cellOfDay(day: number) {
  return CELLS.findIndex((c) => c.inMonth && c.day === day);
}

export function formatCellDate(cell: number, style: "long" | "short" = "long") {
  const c = CELLS[cell];
  const dd = String(c.day).padStart(2, "0");
  if (style === "short") return `${c.month.slice(0, 3)} ${c.day}`;
  return `${c.month} ${dd}, 2023`;
}

export function weekdayOf(cell: number) {
  return WEEKDAYS[cell % 7];
}

export const START_TIME: Record<Period, string> = {
  AM: "7:00 AM",
  PM: "3:00 PM",
  NOC: "11:00 PM",
};

export const END_TIME: Record<Period, string> = {
  AM: "3:00 PM",
  PM: "11:00 PM",
  NOC: "7:00 AM",
};

export const STAFF = [
  "Ava Lane",
  "Ivy West",
  "Leo Lake",
  "Ruby Dunn",
  "Max Brooks",
  "Luke Green",
  "Isa Garcia",
  "Mia Fox",
  "Liam Ford",
] as const;

let seq = 0;
const s = (
  day: number | [number],
  kind: ShiftKind,
  period: Period,
  cna?: string,
  extra: Partial<Shift> = {},
): Shift => ({
  id: `s${++seq}`,
  cell: Array.isArray(day) ? day[0] : cellOfDay(day),
  kind,
  period,
  cna,
  ...extra,
});

/** Seed data — mirrors the "Facility: Calendar Monthly View" frame. */
export function seedShifts(): Shift[] {
  seq = 0;
  return [
    s([0], "completed", "AM", "Isa Garcia", { rating: 4 }),
    s([1], "completed", "AM", "Ivy West", { rating: 5 }),
    s([1], "completed", "PM", "Ava Lane"),
    s(1, "ongoing", "AM", "Leo Lake"),
    s(1, "ongoing", "AM", "Ruby Dunn"),
    s(2, "scheduled", "AM", "Leo Lake"),
    s(2, "scheduled", "AM", "Ava Lane"),
    s(2, "urgent", "AM", undefined),
    s(2, "scheduled", "PM", "Max Brooks", { overflow: true }),
    s(2, "scheduled", "PM", "Mia Fox", { overflow: true }),
    s(2, "open", "PM", undefined, { overflow: true }),
    s(2, "scheduled", "NOC", "Liam Ford", { overflow: true }),
    s(2, "scheduled", "NOC", "Isa Garcia", { overflow: true }),
    s(4, "scheduled", "AM", "Ivy West"),
    s(4, "urgent", "NOC"),
    s(5, "scheduled", "AM", "Liam Ford"),
    s(6, "urgent", "PM"),
    s(8, "scheduled", "AM", "Max Brooks"),
    s(8, "scheduled", "AM", "Ava Lane"),
    s(9, "scheduled", "AM", "Luke Green"),
    s(13, "scheduled", "AM", "Isa Garcia"),
    s(13, "scheduled", "AM", "Mia Fox"),
    s(14, "urgent", "PM"),
    s(15, "called", "AM"),
    s(15, "open", "AM"),
    s(17, "called", "PM"),
    s(19, "open", "AM"),
    s(19, "called", "AM"),
    s(20, "scheduled", "PM", "Ava Lane"),
    s(22, "open", "AM"),
    s(22, "open", "AM"),
    s(23, "scheduled", "PM", "Leo Lake"),
    s(24, "called", "AM"),
    s(24, "open", "AM"),
    s(25, "scheduled", "NOC", "Ivy West"),
    s(25, "scheduled", "NOC", "Ruby Dunn"),
    s(28, "scheduled", "AM", "Ava Lane"),
    s(28, "scheduled", "AM", "Ivy West"),
    s(28, "scheduled", "PM", "Leo Lake", { overflow: true }),
    s(28, "scheduled", "PM", "Ruby Dunn", { overflow: true }),
    s(28, "open", "PM", undefined, { overflow: true }),
    s(28, "scheduled", "NOC", "Luke Green", { overflow: true }),
    s(28, "open", "NOC", undefined, { overflow: true }),
    s(29, "called", "PM"),
    s(30, "open", "NOC"),
    s([33], "open", "AM"),
    s([34], "scheduled", "NOC", "Liam Ford"),
    s([34], "open", "AM"),
  ];
}

export const NEW_ID = () =>
  `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export const CNA_TASKS: Record<Period, string[]> = {
  AM: [
    "Morning vitals for rooms 101–108",
    "Assist residents with breakfast",
    "Medication reminders at 9:00 AM",
    "Two-hour repositioning rounds",
    "Hand-off notes to PM shift",
  ],
  PM: [
    "Afternoon vitals check",
    "Assist with dinner and hydration",
    "Evening hygiene and bedtime routine",
    "Fall-risk rounds every two hours",
    "Hand-off notes to NOC shift",
  ],
  NOC: [
    "Overnight safety rounds",
    "Incontinence care checks",
    "Respond to call lights",
    "Early-morning vitals at 5:00 AM",
    "Hand-off notes to AM shift",
  ],
};
