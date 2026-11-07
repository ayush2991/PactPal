# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this app is

PactPal is a commitment-tracking app: a user commits to a task, a clock starts (default 72h, configurable per-task to 24/48/72h), and the task is either completed or becomes `failed` when time runs out. Active commitments are capped at `DEFAULT_TASK_CAP` (6, `src/task/types.ts`) — `commit`/`recommit` throw `TaskCapReachedError` past that, which the UI surfaces explicitly rather than silently blocking. A virtual pet's health rises when tasks are kept and drops when tasks fail, giving the streak mechanic a visible face. See `PRD.md` for product intent and `TECH_DESIGN.md` for the original architecture proposal — some of it (`expo-notifications`, `react-navigation`) is planned but not yet implemented, per the "Screens" note below.

## Build, Test, and Development Commands

- `npm start` — starts the Expo dev server.
- `npm run web` — runs the app through React Native Web for quick UI checks.
- `npm run android` / `npm run ios` — native Expo builds for the target platform (requires JDK 17; use `JAVA_HOME=/opt/homebrew/opt/openjdk@17` if your shell defaults to a newer JDK).
- `npm run android:deploy` — builds the release APK, uninstalls the app from a connected Android device, and installs the latest build (`scripts/deploy-android-local.sh`).
- `npm test` — runs Jest (`jest-expo` preset).
- `npm test -- src/task/taskService.test.ts` — run a single test file.
- `npx tsc --noEmit` — typecheck the project; run this before handing off changes (there is no lint/Prettier config).

## Architecture

One-way dependency flow: `src/ui/` → `src/store/` (Zustand) → pure services in `src/task/` and `src/pet/`. UI never talks to services directly, and services never import React or RN.

**Task lifecycle is derive-on-read, not stored.** A `Task` row only stores immutable facts (`committedAt`, `deadlineAt`, `completedAt`, `failedAt`, `autoDeleteAt`, `recommitCount`). `deriveStatus(task, now)` (`src/task/deriveStatus.ts`) is a pure function that computes `done | fresh | mid | urgent | failed` on every read — never trust or persist a status field. This makes the app self-correcting after being closed for any length of time, since there's no reliance on a background timer having fired at the right moment. `TaskService` (`src/task/taskService.ts`) is where all lifecycle transitions live (`commit`, `complete`, `recommit`, `deleteManually`, `sweep`); `sweep()` is what promotes overdue tasks to `failed` and hard-deletes ones past their grace period, and it anchors `failedAt` to the deadline itself (not to sweep time) so a late-opened app doesn't get an extended grace window. `done` tasks get the same treatment: `complete()` sets `autoDeleteAt` immediately (`completedAt + windowMs`), and `sweep()` hard-deletes a `done` task once that retention window elapses, exactly like a failed task's grace period — so both kept and broken pacts eventually age out of the list, not just failed ones.

**Storage is `expo-sqlite`-backed, durable across app kills.** `TaskRepository` (`src/task/taskRepository.ts`) is an interface with two implementations: `InMemoryTaskRepository` (used in tests — no native dependency, injectable `now`/`generateId`) and `SQLiteTaskRepository` (used by the app, per `TECH_DESIGN.md` §1/§3), which the store wires up in `src/store/taskStore.ts`. `SQLiteTaskRepository` uses expo-sqlite's synchronous API (`openDatabaseSync`/`*Sync`) so it stays a drop-in for the interface — no async hydration step, `TaskService` calls it synchronously like the in-memory version. Data persists in the on-device SQLite file and survives the app process being killed; it's cleared only when the app is uninstalled, not swept away like a background timer's state would be. Because `expo-sqlite` needs a real native runtime, `SQLiteTaskRepository` isn't unit-tested under Jest — `taskService.test.ts` and friends inject `InMemoryTaskRepository` instead, consistent with the "Testing Guidelines" note below about not relying on native APIs in pure-logic tests.

**Pet health** (`src/pet/petHealth.ts`) is a running score seeded at 58, +18 per kept task, -32 per failed task, clamped to [0, 100], mapped to a `PetMood` (`fading | worried | steady | happy | thriving`) by fixed breakpoints. `kept`/`broken` are not lifetime counters — `countTaskStatuses(tasks, now)` (`src/task/deriveStatus.ts`) recomputes them live from whatever `done`/`failed` tasks are currently in the repository, so a task stops affecting health the moment it's gone (auto-cleaned-up or manually deleted), not just while it's still in view.

**Theming is a single registry, not scattered conditionals.** `THEME_REGISTRY` (`src/ui/theme.ts`) is the one source of truth for every `ThemeId`'s palettes (`colors: Record<Scheme, Palette>` — every theme defines both a `light` and a `dark` Palette, not just `default`), shape (`ThemeShape`: corner radii, `hardEdges` border/shadow treatment), and typography (`ThemeType`: font family, title weight/tracking/case, badge decoration). Light/dark is a separate, global concern from theme identity: `themeStore.ts` owns `mode: Scheme`, the resolved scheme every themed component renders with, plus `modePreference: 'light' | 'dark' | 'system'`, the user's raw choice on the "Mode" section of `SettingsScreen` (`setModePreference`). `modePreference` defaults to `'system'`, in which case `mode` tracks `Appearance.getColorScheme()` live (seeded at store creation, then kept in sync via an `Appearance.addChangeListener` subscription) — picking `'light'`/`'dark'` explicitly locks `mode` to that value and the OS listener stops affecting it. `useTheme()` resolves the active theme as `THEME_REGISTRY[themeId].colors[mode]` and returns `{ scheme: mode, colors, shape, type, ... }`; every themed component (`TaskCard`, `PipCard`, `TabBar`, `PetPicker`, `SettingsScreen`, `CommitModal`, `ConfirmModal`, `TimelineScreen`) reads those tokens directly instead of re-deriving `themeId === 'x'` checks locally. Adding or restyling a theme means editing one entry in `THEME_REGISTRY` (both its `light` and `dark` Palette, plus `THEME_ORDER` for picker placement) — it should never require touching a component file.

**Stores** (`src/store/`) are thin Zustand wrappers that cache service/repository state for React and re-sync after every mutation:
- `taskStore.ts` owns the single `TaskService`/`InMemoryTaskRepository` instance app-wide.
- `petSelectionStore.ts` / `themeStore.ts` — which pet (`PetId` in `src/ui/pets.ts`) and theme (`ThemeId` in `src/ui/theme.ts`) are active; each pet has its own face component and mood copy.

**Dev-mode time compression:** `taskStore.ts` shrinks the task window to 90 seconds when `__DEV__` is true (real 72h only in release builds), so the full fresh→mid→urgent→failed→auto-deleted lifecycle is watchable in the running app without waiting days. `deriveStatus` is window-agnostic (it reads each task's own `committedAt`/`deadlineAt`), so this is the only place duration is scaled.

**Screens** (`src/ui/`): `TimelineScreen.tsx` (home, task list) and `SettingsScreen.tsx` (pet/theme), switched via local state in `App.tsx` — there is currently no `react-navigation` stack despite `TECH_DESIGN.md` describing one. `App.tsx` also owns the app-wide sweep loop: a 1s interval plus an `AppState` listener that re-sweeps on foreground.

## Coding Style & Naming Conventions

TypeScript, React function components, two-space indentation, single-purpose modules, explicit exported types for domain objects. Components in `PascalCase` (`TaskCard.tsx`), hooks/stores in `camelCase` (`themeStore.ts`), tests named after the unit under test (`taskService.test.ts`) and colocated with the implementation.

## Testing Guidelines

Keep pure logic covered in colocated `*.test.ts` files, especially `src/task/` lifecycle behavior (`taskService.test.ts`, `deriveStatus.test.ts`) and `src/pet/` health calculations (`petHealth.test.ts`). Inject time/IDs (`TaskService` takes `now`/`generateId` options) rather than relying on real clocks or native APIs.

## Commit & Pull Request Guidelines

Use short Conventional Commit-style prefixes (`feat:`, `refactor:`, `docs:`), e.g. `feat: add failed task recovery state`. PRs should include a concise summary, test results, and screenshots/recordings for UI changes.

## Other repo notes

- `android/` and `ios/` are generated (gitignored) — avoid editing unless the change is native-build specific.
- `KNOWN_BUGS.md` tracks open issues found during review; check it and update it when fixing or discovering bugs.
- `mockups-20260712.html` / `index.html` are static HTML mockups used as the visual/design source of truth for the original `default`/`brutalist` themes (their tokens in `src/ui/theme.ts` are lifted from the mockups; later `THEME_REGISTRY` entries are original palettes, not mockup-derived) — not part of the app build.
