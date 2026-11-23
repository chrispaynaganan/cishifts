"use client";

import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { Segmented } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import type { PopKind } from "./popovers";

export type Notif = {
  id: string;
  group: "New" | "Earlier";
  avatar: string;
  body: ReactNode;
  link: string;
  ago: string;
  unread: boolean;
  archived: boolean;
  strong?: boolean;
  target: { kind: PopKind; shiftMatch?: { cna?: string; kind?: string; cell?: number } };
};

export function seedNotifications(): Notif[] {
  return [
    {
      id: "n1",
      group: "New",
      avatar: "avatar-leo-notif.png",
      body: "Re-opened shift has been accepted by Leo Lake.",
      link: "View shift details",
      ago: "3 minutes ago",
      unread: true,
      archived: false,
      strong: true,
      target: { kind: "details", shiftMatch: { cna: "Leo Lake", kind: "scheduled" } },
    },
    {
      id: "n2",
      group: "New",
      avatar: "avatar-ruby-notif.png",
      body: (
        <>
          <span className="text-brand-urgent-text">URGENT:</span> Shift has been re-opened due to call off by Ruby Dunn.
        </>
      ),
      link: "View call-off details",
      ago: "7 minutes ago",
      unread: false,
      archived: false,
      strong: true,
      target: { kind: "calloff", shiftMatch: { kind: "urgent", cell: 3 } },
    },
    {
      id: "n5",
      group: "New",
      avatar: "avatar-ruby-notif.png",
      body: "Ivy West requested time off for Aug 10–14.",
      link: "Review request",
      ago: "12 minutes ago",
      unread: true,
      archived: false,
      strong: true,
      target: { kind: "timeoff" },
    },
    {
      id: "n6",
      group: "New",
      avatar: "avatar-leo-notif.png",
      body: "Leo Lake updated their weekly availability.",
      link: "View changes",
      ago: "18 minutes ago",
      unread: true,
      archived: false,
      strong: true,
      target: { kind: "availability" },
    },
    {
      id: "n3",
      group: "Earlier",
      avatar: "avatar-ruby-notif.png",
      body: "Shift has been accepted by Nurse 1.",
      link: "View Shift details",
      ago: "10 minutes ago",
      unread: false,
      archived: false,
      target: { kind: "details", shiftMatch: { cna: "Max Brooks", kind: "scheduled" } },
    },
    {
      id: "n4",
      group: "Earlier",
      avatar: "avatar-nurse2-notif.png",
      body: "Shift you requested on January 13, 2023 has been accepted by Nurse 2.",
      link: "View Shift details",
      ago: "21 minutes ago",
      unread: false,
      archived: false,
      target: { kind: "details", shiftMatch: { cna: "Luke Green", kind: "scheduled" } },
    },
  ];
}

export function NotificationsPanel({
  items,
  setItems,
  onFollow,
  onClose,
}: {
  items: Notif[];
  setItems: (fn: (n: Notif[]) => Notif[]) => void;
  onFollow: (n: Notif) => void;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<"All" | "Archived">("All");
  const toast = useToast();
  const visible = items.filter((n) => (tab === "All" ? !n.archived : n.archived));
  const groups = (["New", "Earlier"] as const)
    .map((g) => ({ g, list: visible.filter((n) => n.group === g) }))
    .filter((x) => x.list.length);

  const archive = (id: string, archived: boolean) =>
    setItems((list) => list.map((n) => (n.id === id ? { ...n, archived, unread: false } : n)));

  return (
    <motion.div
      role="dialog"
      aria-label="Notifications"
      initial={{ opacity: 0, y: -12, scale: 0.96, filter: "blur(6px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: -8, scale: 0.97, filter: "blur(4px)", transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 420, damping: 34 }}
      className="absolute top-23.75 right-18.75 z-40 flex max-h-[calc(100dvh-7rem)] w-102.75 origin-top-right flex-col overflow-hidden rounded-4xl bg-notif shadow-panel"
    >
      <div className="flex shrink-0 items-center justify-between rounded-t-3xl border-b border-line p-4">
        <h3 className="text-xl leading-normal tracking-ui text-black text-trim">Notifications</h3>
        <motion.button
          type="button"
          aria-label="Notification settings"
          whileHover={{ rotate: 60 }}
          onClick={() => toast("Notification preferences live in Settings in the full app.")}
        >
          <img src="/assets/icon-notif-settings.svg" alt="" width={26} height={26} className="size-6.5" />
        </motion.button>
      </div>
      <div className="shrink-0 px-4 py-3">
        <Segmented id="notif-tab" options={["All", "Archived"] as const} value={tab} onChange={setTab} />
      </div>
      <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="popLayout" initial={false}>
          {groups.length === 0 ? (
            <motion.p key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-10 text-center text-sm text-muted">
              {tab === "All" ? "You’re all caught up." : "Nothing archived yet. Hover a notification to archive it."}
            </motion.p>
          ) : (
            groups.map(({ g, list }) => (
              <motion.section key={g} layout className="flex flex-col pb-4 last:pb-0">
                <p className="py-2 text-sm leading-normal font-medium text-muted-3 text-trim">{g}</p>
                <div className="flex flex-col gap-1">
                  <AnimatePresence initial={false}>
                    {list.map((n, i) => (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.08 + i * 0.05 } }}
                        exit={{ opacity: 0, x: 40, height: 0, transition: { duration: 0.22 } }}
                        className={`group relative flex items-center gap-4 px-4 py-3 transition-colors duration-500 ${
                          n.unread ? "rounded-4xl bg-surface" : "rounded-2xl hover:bg-white"
                        }`}
                      >
                        <Image src={`/assets/${n.avatar}`} alt="" width={38} height={38} className="size-9.5 shrink-0 rounded-full" />
                        <div className="flex min-w-0 flex-1 flex-col gap-4">
                          <p className={`text-base leading-normal tracking-ui text-black ${n.strong ? "font-medium" : ""}`}>
                            {n.body}{" "}
                            <button
                              type="button"
                              onClick={() => {
                                setItems((list) => list.map((x) => (x.id === n.id ? { ...x, unread: false } : x)));
                                onFollow(n);
                              }}
                              className="underline decoration-from-font underline-offset-2 transition-colors hover:text-brand"
                            >
                              {n.link}
                            </button>
                          </p>
                          <p className="text-xs leading-none text-muted-2 text-trim">{n.ago}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => archive(n.id, !n.archived)}
                          aria-label={n.archived ? "Restore" : "Archive"}
                          className="absolute top-2 right-2 rounded-full bg-white px-2.5 py-1 text-2xs text-muted opacity-0 shadow-soft transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-brand"
                        >
                          {n.archived ? "Restore" : "Archive"}
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.section>
            ))
          )}
        </AnimatePresence>
      </div>
      <button
        type="button"
        onClick={() => {
          setItems((list) => list.map((n) => ({ ...n, unread: false })));
          toast("Marked everything as read.", { tone: "success" });
          onClose();
        }}
        className="shrink-0 border-t border-line py-3.75 text-center text-base tracking-ui text-brand transition-colors hover:bg-white"
      >
        View all notifications
      </button>
    </motion.div>
  );
}
