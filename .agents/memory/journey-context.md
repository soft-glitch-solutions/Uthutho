---
name: Journey context fix
description: How the infinite loadActiveJourney loop was fixed — single provider pattern
---

# Problem
`useJourney()` was called independently by many components (home, WaitingDrawer, StopBlock×N, Map, journey.tsx, useJourneyData, useJourneyActions). Each call created its own `useAuth` subscription and `loadActiveJourney` invocation, resulting in dozens of rapid re-entrant calls.

# Fix
- Created `context/JourneyContext.tsx`: wraps a single `useJourney()` call in React context, exposes `useJourneyContext()` hook.
- Added `JourneyProvider` in `app/(app)/_layout.tsx` wrapping the Drawer navigator.
- Updated every consumer to call `useJourneyContext()` instead of `useJourney()`.
- `useJourney()` import is now ONLY used by `context/JourneyContext.tsx`.

# Additional guard in useJourney.ts
- Added `isLoadingJourneyRef` (useRef) as an in-flight guard — `loadActiveJourney` returns early if already running, resets in `finally`.
- Changed `useEffect` dep from `[user]` to `[user?.id]` so object reference churn doesn't re-trigger loads.

**Why:** Each `useAuth` subscription fires `onAuthStateChange` (INITIAL_SESSION, SIGNED_IN) independently, so N instances = N×M `loadActiveJourney` calls.

**How to apply:** Any new component that needs journey state must call `useJourneyContext()` — never `useJourney()` directly.
