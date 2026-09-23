# Lattis

Premium visual thinking app built with Expo (SDK 57), Expo Router, TypeScript (strict), and React Native.

## Stack

- **Expo + Expo Router** — file-based navigation (`app/`)
- **TypeScript strict** — `noUncheckedIndexedAccess` enabled
- **Zustand** — global state (`src/store`)
- **Reanimated + Gesture Handler** — animations and gestures
- **React Native Skia** — installed/configured for the upcoming canvas (not yet composed)
- **React Native SVG** — vector rendering
- **Design system** — dark theme tokens in `src/theme`

## Getting started

```bash
npm install
npx expo start        # then press i for iOS simulator
```

## Scripts

| Command                                | Purpose                 |
| -------------------------------------- | ----------------------- |
| `npm start` / `npx expo start`         | Dev server              |
| `npm run ios` / `npx expo start --ios` | iOS simulator           |
| `npm run lint` / `npx expo lint`       | ESLint + Prettier check |
| `npx tsc --noEmit`                     | Typecheck               |

## Structure

```
app/                  # Expo Router routes (only Home exists in phase 1)
  (auth)/             # Reserved — auth flow
  (tabs)/             # Reserved — main tab shell
  canvas/             # Reserved — infinite canvas
  _layout.tsx         # Root providers + stack
  index.tsx           # Home screen

src/
  components/         # Shared UI kit (Button, Card, Text, Icon, ScreenContainer)
  features/           # Feature modules (auth, projects, canvas) — empty in phase 1
  services/           # External integrations (Firebase later)
  store/              # Zustand stores
  hooks/              # Shared hooks
  theme/              # Design tokens + navigation theme
  types/              # Shared TypeScript types
  utils/              # Pure helpers

assets/
  icons/              # Icon assets
  fonts/              # Custom fonts (future)
  images/             # App icons, splash, logo
```

## Path aliases

- `@/*` → `src/*` (e.g. `@/components`, `@/theme`)
- `@/assets/*` → `assets/*`

## Out of scope (phase 1)

Authentication, Firebase, infinite canvas implementation, and CRUD screens are intentionally **not** built yet.

## Security note

This portfolio demo uses `EXPO_PUBLIC_GEMINI_API_KEY` client-side for simplicity. In production, AI requests should be proxied through a secure backend.
