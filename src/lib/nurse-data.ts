export type NurseShift = {
  id: string;
  facility: string;
  unit: string;
  period: "AM" | "PM" | "NOC";
  date: string; // MM/DD/YYYY
  longDate: string;
  role: string;
  miles: string;
  isNew?: boolean;
  urgent?: boolean;
  bonus?: number;
  address: string;
  clinic: string;
  criteria: string[];
};

const ACME = {
  clinic: "Sunrise Health Clinic",
  address: "742 Evergreen Terrace, Springfield, CA 90210",
};

/** Open shifts the nurse can pick up — mirrors the Home and Open Shifts frames. */
export const OPEN_SHIFTS: NurseShift[] = [
  {
    id: "acme-am",
    facility: "ACME Facility",
    unit: "Skilled Nursing",
    period: "AM",
    date: "01/13/2023",
    longDate: "January 13, 2023",
    role: "Certified Nursing Assistant",
    miles: "1.8",
    isNew: true,
    ...ACME,
    criteria: ["Tracheostomy Experience", "Treatment", "GT Management", "Straight Catheter", "NGT Mgmt"],
  },
  {
    id: "acme-urgent",
    facility: "ACME Facility",
    unit: "Memory Support",
    period: "AM",
    date: "01/13/2023",
    longDate: "January 13, 2023",
    role: "Licensed Vocational Nurse",
    miles: "1.8",
    urgent: true,
    bonus: 50,
    ...ACME,
    criteria: ["Dementia Care", "Medication Pass", "Fall Prevention"],
  },
  {
    id: "acme-pm",
    facility: "ACME Facility",
    unit: "Independent Living",
    period: "PM",
    date: "01/13/2023",
    longDate: "January 13, 2023",
    role: "Registered Nurse",
    miles: "1.8",
    ...ACME,
    criteria: ["Vital Sign Monitoring", "Wound Care", "Treatment"],
  },
  {
    id: "acme-pm-2",
    facility: "ACME Facility",
    unit: "Independent Living",
    period: "PM",
    date: "01/14/2023",
    longDate: "January 14, 2023",
    role: "Registered Nurse",
    miles: "1.8",
    ...ACME,
    criteria: ["Vital Sign Monitoring", "Treatment"],
  },
  {
    id: "metro-lipa",
    facility: "Metro Lipa Medical Center",
    unit: "Memory Support",
    period: "PM",
    date: "09/21/2023",
    longDate: "September 21, 2023",
    role: "Certified Nursing Assistant",
    miles: "2.3",
    isNew: true,
    clinic: "Metro Lipa Medical Center",
    address: "Ayala Highway, Lipa City, Batangas 4217",
    criteria: ["Dementia Care", "Medication Pass", "Treatment"],
  },
  {
    id: "mary-mediatrix",
    facility: "Mary Mediatrix",
    unit: "Memory Support",
    period: "AM",
    date: "09/21/2023",
    longDate: "September 21, 2023",
    role: "Licensed Vocational Nurse",
    miles: "2.3",
    clinic: "Mary Mediatrix Medical Center",
    address: "J.P. Laurel Highway, Lipa City, Batangas 4217",
    criteria: ["GT Management", "NGT Mgmt", "Straight Catheter"],
  },
];

export const HOURS: Record<NurseShift["period"], string> = {
  AM: "7:00 AM - 3:30 PM",
  PM: "3:00 PM - 11:30 PM",
  NOC: "11:00 PM - 7:30 AM",
};

export const DUTIES = [
  { title: "Make a high-fiber lunch for three", body: "Prepare a nutritious high-fiber lunch for three people" },
  { title: "Pack a protein-rich breakfast for four", body: "Assemble a balanced breakfast rich in protein for four individuals" },
  { title: "Create a gluten-free dinner for two", body: "Cook a tasty and gluten-free dinner suitable for two people" },
  { title: "Design a vegan snack platter for five", body: "Put together a colorful and healthy vegan snack platter for five guests" },
  { title: "Plan a low-carb dessert for six", body: "Prepare a delicious and low-carb dessert designed for six servings" },
];

export const CALL_OFF_REASONS = [
  "Feeling Sick",
  "Personal Reasons",
  "Child Care",
  "Family Emergency",
  "Minor Injuries",
  "Car Issues",
];

/** Seconds → "DD:HH:MM:SS", the format the countdown banner uses. */
export function dhms(total: number) {
  const s = Math.max(0, Math.floor(total));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [d, h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

/** Seconds → "HH:MM:SS" for the clock and break timers. */
export function hms(total: number) {
  const s = Math.max(0, Math.floor(total));
  return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":");
}
