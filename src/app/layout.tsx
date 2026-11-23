import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  axes: ["opsz"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "CIShifts — Facility Scheduler",
  description:
    "Interactive prototype of the CIShifts clinic dashboard: sign up, log in, and manage CNA shifts on a live calendar. Designed and built by Chris Paynaganan.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} h-full`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
