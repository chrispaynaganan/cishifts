# CIShifts — Facility Scheduler (interactive prototype)

A clickable, animated build of the **CIShifts clinic / facility desktop app**, made from the
`[OFFICIAL] CIShifts Design` Figma file so recruiters can explore it instead of looking at static frames.

It covers all 19 desktop frames:

| Flow | Figma frames | What you can do |
| --- | --- | --- |
| Sign up | Basic Information (1–5) | Type your own details, or press **Log In** on an empty form to watch the demo account type itself in (password meter goes weak → strong) |
| Welcome | Basic Information (6) | **Verify your Email** → login |
| Log in | Basic Information (7) | Any password works; an empty form auto-fills the demo account |
| Calendar | Facility: Calendar Monthly View | Month grid with every shift status from the design |
| Open shift | …View Open Shift | AM/PM/NOC switch, recurrence dropdown, staff picker, refer to agencies, create |
| Scheduled shift | …View Scheduled Shift | Details / Tasks tabs, inline schedule edit, two-step delete with Undo |
| Completed shift | …View Completed Shift | Half-star rating, animated 100% completion ring, biometrics |
| New shift | …View Filter (New Shift / Select Template) | Click any empty day (or **Create Shift**) → Create New or Use Template |
| Notifications | …Nurse Cancellation | Bell panel with All / Archived, archive on hover, links jump to the right shift |
| Urgent shift | …Urgent Shift Updated Details / Resent to My Staff | Send back to My Staff or Agencies, or assign a CNA directly |
| Time-off request | …View Filter (Time-Off) | Accept / Deny |
| Availability change | …View Filter (Availability) | **Suggest Shifts** highlights matching open shifts |

Extras for exploring: search (filters chips live), recent-activity log, legend, "View N more shifts",
and a small **Explore the prototype** checklist in the corner.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. Production build: `npm run build && npm start`. Deploys to Vercel as-is.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 — every colour, radius, size and shadow from Figma is a named token in
  `src/app/globals.css`, so components use canonical classes only (no `suggestCanonicalClasses` warnings)
- [Motion](https://motion.dev) for all animation; respects `prefers-reduced-motion`
- DM Sans via `next/font`

## Where things live

```
src/app/globals.css               design tokens (@theme)
src/lib/calendar-data.ts          month grid, seed shifts, staff, tasks
src/components/auth/              sign up → welcome → login
src/components/calendar/
  CalendarApp.tsx                 state, grid, popover routing
  Popover.tsx                     anchored card + pointer (auto-flips, follows the chip)
  popovers.tsx                    each Figma popover as a component
  Chrome.tsx                      sidebar + top nav
  Notifications.tsx               bell panel
  ShiftChip.tsx                   colour-coded shift pills
```

## Small deviations from the Figma file

- The first row reads **29, 30** and the last row **27 → Aug 2** so the dates form a real calendar
  (the frames show 30, 31 and a repeated 20).
- Two notifications were added (Ivy's time-off request, Leo's availability change) so those two
  popovers have a natural way in — in the frames they float without a trigger.
- Sidebar items other than Calendar, chat and "CNA Calendar" show a short note instead of a page;
  they aren't part of these designs.
