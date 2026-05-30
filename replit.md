# Uthutho

## Overview
Uthutho ("Move Smarter") is a public-transport / journey-planning app for South Africa, built with Expo (React Native) and Expo Router. It targets iOS, Android, and Web from a single codebase, with Supabase as the backend.

## Tech Stack
- **Framework:** Expo SDK 53 + React Native 0.79 (React 19)
- **Routing:** Expo Router (file-based, in `app/`)
- **Backend:** Supabase (`@supabase/supabase-js`)
- **State/Data:** React Query (`@tanstack/react-query`), React Context (`context/`)
- **Web bundler:** Metro (SPA output, `web.output: "single"` in `app.json`)

## Project Layout
- `app/` — screens and routes (Expo Router)
- `components/` — UI components
- `context/` — React context providers (theme, language, tutorial, waiting)
- `hook/` — custom hooks
- `lib/` — Supabase client, journey + image upload helpers
- `services/` — domain services (location, routing, transport, weather, notifications)
- `utils/`, `types/`, `data/` — helpers, types, static data
- `assets/` — images and fonts

## Running on Replit (Development)
- Workflow **Start application** runs `npx expo start --web --port 5000` (webview on port 5000, host `0.0.0.0`).
- The web preview is served by Metro, which does not enforce host-header checks, so the Replit iframe proxy works without extra config.

## Deployment
- Configured as a **static** deployment.
- Build: `npm run build:web` (`expo export --platform web`) → outputs to `dist/`.
- Publish directory: `dist`.

## Environment Variables / Secrets
These are `EXPO_PUBLIC_*` vars (baked into the client bundle at build time):
- `EXPO_PUBLIC_SUPABASE_URL` — Supabase project URL (`https://...supabase.co`). **Required.**
- `EXPO_PUBLIC_SUPABASE_KEY` — Supabase anon/public key (JWT). **Required.**
- `EXPO_PUBLIC_GOOGLE_PLACES_API_KEY` — Google Places key for native. Optional (address autocomplete degrades gracefully without it).
- `EXPO_PUBLIC_WEB_GOOGLE_PLACES_API_KEY` — Google Places key for web. Optional.

## User Preferences
(None recorded yet.)
