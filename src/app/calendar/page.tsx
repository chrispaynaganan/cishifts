import type { Metadata } from "next";
import { CalendarApp } from "@/components/calendar/CalendarApp";

export const metadata: Metadata = {
  title: "Calendar of Shifts — CIShifts",
};

export default function CalendarPage() {
  return <CalendarApp />;
}
