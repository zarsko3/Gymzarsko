# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gymzarski is a mobile-first Progressive Web App (PWA) for tracking Push/Pull/Legs (PPL) workouts. Built with React 19, TypeScript, and Firebase.

## Commands

```bash
# Development
npm run dev          # Start dev server on port 3000

# Build & Preview
npm run build        # TypeScript check + Vite production build
npm run preview      # Preview production build locally

# Testing
npm run test         # Run Vitest unit tests (watch mode)
npx vitest run       # Run unit tests once
npx playwright test  # Run e2e tests (requires dev server or build)
```

## Architecture

### Data Layer (Service Facade Pattern)
The app uses a facade pattern in [workoutServiceFacade.ts](src/services/workoutServiceFacade.ts) that routes data operations to either:
- **Firestore** (when `VITE_FIREBASE_*` env vars are configured)
- **Local Storage** (fallback for development/offline)

The `USE_FIRESTORE` flag in [config.ts](src/services/config.ts) auto-detects which backend to use based on environment variables.

### State Management
Uses React Context for global state:
- **AuthContext**: Firebase Auth state, login/logout/signup methods
- **ThemeContext**: Light/dark mode with CSS variable theming
- **ToastContext**: App-wide toast notifications

### Routing
- Public routes: `/login`, `/signup`
- Protected routes wrapped in `PrivateRoute` component require authentication
- Pages are lazy-loaded for code splitting

### Firebase Collections Structure
```
/workouts/{workoutId}           - User workouts (filtered by userId)
/users/{userId}/plans           - Custom workout plans
/users/{userId}/bodyMetrics     - Weight tracking entries
/users/{userId}/bodyMetricGoals - Weight goals
```

### Styling
- TailwindCSS with CSS variables for theming ([tailwind.config.js](tailwind.config.js))
- Theme colors defined in [index.css](src/index.css) with `--primary-*`, `--bg-*`, `--text-*` variables
- Dark mode via `darkMode: 'class'` strategy

### Key Types
Core domain types in [types/index.ts](src/types/index.ts):
- `Workout`, `WorkoutExercise`, `WorkoutSet` - workout tracking
- `Plan` - custom workout templates
- `BodyMetricEntry`, `BodyMetricGoal` - body measurements

## Testing

### Unit Tests (Vitest)
- Setup file: [vitest.setup.ts](vitest.setup.ts)
- Test files use `__tests__` directories adjacent to source files
- Uses `@testing-library/react` and `jsdom`

### E2E Tests (Playwright)
- Config: [playwright.config.ts](playwright.config.ts)
- Tests in `tests/` directory
- CI runs on push/PR to main via GitHub Actions

## Environment Variables

Copy `.env.example` to `.env.local` and configure Firebase credentials:
```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Without Firebase config, the app falls back to local storage.
