# MENTALMATE Workspace

## Overview

MENTALMATE is an AI-powered mental health companion web application built on a pnpm monorepo using TypeScript. It provides emotional support, mood tracking, AI chat, wellness monitoring, and mental health resources.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Clerk (whitelabel)
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2)
- **Frontend**: React + Vite + Tailwind CSS + shadcn/ui
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Charts**: Recharts
- **Build**: esbuild (CJS bundle)

## Features

- **AI Chat Companion**: Empathetic AI chat with crisis detection and emergency guidance
- **Daily Mood Tracking**: Log mood (happy, sad, stressed, anxious, calm, tired) with notes and stress level
- **Wellness Dashboard**: Stress level, blood pressure, mental health score, activity feed
- **Weekly Analysis**: Mood trends, stress patterns, emotional insights with charts
- **Recommended Doctors**: Mental health professionals with ratings, availability, and contact info
- **Disease Prediction**: Symptom-based condition suggestions (informational only)
- **Privacy Policy**: Clear data usage and deletion rights
- **Safety Features**: Crisis detection, emergency resources, wellness disclaimers

## Artifacts

- `artifacts/mentalmate` — React+Vite frontend (preview at `/`)
- `artifacts/api-server` — Express API server (at `/api`)

## Database Tables

- `mood_logs` — Daily mood entries per user
- `chat_messages` — AI chat history per user
- `wellness_data` — Wellness metrics per user (stress, BP, mental health score)
- `activity_log` — Activity feed entries per user
- `doctors` — Seeded mental health professional listings

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/mentalmate run dev` — run frontend locally

## Safety & Privacy

- Visible disclaimer on all authenticated pages: "MENTALMATE is a supportive wellness companion, not a substitute for professional medical advice"
- Crisis detection in AI chat routes (keyword-based): auto-responds with 988, Crisis Text Line, and 911
- Privacy policy page at `/privacy`
- No sensitive health data shared externally
