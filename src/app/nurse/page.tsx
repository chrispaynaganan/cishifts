import type { Metadata } from "next";
import { NurseApp } from "@/components/nurse/NurseApp";

export const metadata: Metadata = {
  title: "CIShifts — Nurse App",
  description: "Interactive preview of the CIShifts nurse mobile app: find open shifts, accept, clock in, take a break and clock out.",
};

export default function NursePage() {
  return <NurseApp />;
}
