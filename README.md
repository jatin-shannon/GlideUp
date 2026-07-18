# GlideUp

A Duolingo-style, offline-first PWA that teaches ServiceNow scripting through
short, gamified lessons. Built to be played on a plane, on the couch, or on a
work laptop with zero setup.

## Stack

- **React 18 + Vite + TypeScript** — app framework
- **Tailwind CSS** — styling
- **`vite-plugin-pwa` (Workbox)** — service worker + manifest, full offline support
- **`idb`** — IndexedDB wrapper for local progress
- **Prism.js** — offline code syntax highlighting

## Getting started

```bash
npm install
npm run dev      # dev server
npm run build    # typecheck + production build (emits service worker)
npm run preview  # serve the production build
```

## What's in the MVP

- **2 units** — Foundations (JS + `gs.*` basics) and GlideRecord — loaded from
  static JSON in `src/content/units/`.
- **3 exercise types** — code assembly (tap lines into order), fill-in-the-blank,
  and multiple choice.
- **Core loop** — Home (unit map with progress rings) → Lesson (one exercise at a
  time with immediate feedback) → Results (session summary) → Profile (activity
  calendar + badges).
- **Gamification** — difficulty-scaled XP, once-per-day streak, a daily 5-heart
  pool that decrements on wrong answers, and an in-session combo multiplier
  (1.5× at 3 correct in a row, 2× at 5).
- **Offline** — the app shell and all content JSON are precached; after the first
  load it runs with no network.

## Project layout

```
src/
├─ content/units/       # foundations.json, glide-record.json (+ index.ts)
├─ lib/
│  ├─ db.ts             # IndexedDB schema + progress CRUD
│  ├─ xp.ts             # XP + combo calculation
│  ├─ streak.ts         # daily streak logic
│  ├─ hearts.ts         # hearts pool + daily reset
│  └─ dates.ts          # local ISO-date helpers
├─ components/          # exercise types + Hearts/Streak/Combo/CodeBlock
├─ screens/             # Home, Lesson, Results, Profile
├─ App.tsx              # view state machine
└─ main.tsx             # entry + service-worker registration
```

### Progress model

A single IndexedDB record (`src/lib/db.ts`) holds `xp`, `streak`,
`lastActiveDate`, the daily `hearts` pool, `completedExercises`, per-unit
progress, earned `badges`, and `activeDays` for the calendar. The pure logic in
`xp.ts` / `streak.ts` / `hearts.ts` is side-effect-free and unit-testable in
isolation. See the build spec for the v1.5 Supabase sync plan — sync is designed
to layer on top of this local-first record without changing it.

## Adding content

Exercises follow the schema in `src/types.ts`. Add exercises to the unit JSON
files (ids are namespaced per unit, e.g. `fn-007`, `gr-007`); unit progress and
badges are counted from the registered exercise ids automatically.
```
