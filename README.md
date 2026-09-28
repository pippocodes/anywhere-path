# Anywhere Path

Turn the skills you want to learn into habits you actually keep. A React + TypeScript app: break a
skill into a course, get a realistic daily roadmap, and track it in a habit calendar.

## Run locally

```
npm install
npm run dev
```

## Test

```
npm run test
```

Unit tests for the roadmap math (`src/utils/roadmap.test.ts`) and a component render + interaction
test (`src/components/TopicRow.test.tsx`), using Vitest + React Testing Library.

## Build

```
npm run build
```

## Deploy

Static Vite build — works on Vercel or Netlify with zero config beyond what's already in this repo:

- **Vercel**: import the repo, framework preset "Vite" is auto-detected. `vercel.json` handles the
  client-side routing rewrite so refreshing a deep link (e.g. `/habits`) doesn't 404.
- **Netlify**: `npm run build`, publish directory `dist`. `public/_redirects` handles the same
  rewrite.

Copy `.env.example` to `.env` if you want to override `VITE_APP_NAME` (shown in the footer) —
not required, the app works with the default.

## Stack

React 18, TypeScript, Vite, React Router v6, Context API + `useReducer`, Vitest + React Testing
Library. State (courses, roadmaps, habits) persists to `localStorage`.
