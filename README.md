# Portfolio CMS — Local Setup (Windows / VSCode)

Next.js 16 + Prisma + Tailwind portfolio CMS for Maulana Ihsan Rohim.

## Prerequisites
- Node.js 20+ (you have v22) — https://nodejs.org
- VSCode with the recommended extensions (VSCode will prompt you on open)

## First-time setup
```bash
npm install
npm run db:generate      # generate Prisma client
npm run dev              # start dev server on http://localhost:3000
```

Admin login: `http://localhost:3000/admin`
- Email: `admin@maulanaihsan.com`
- Password: `admin123`  ← change this after first login

## Scripts
| Command | What it does |
|---|---|
| `npm run dev` | Dev server (Turbopack) on port 3000 |
| `npm run build` | Production build (standalone) |
| `npm run start` | Run production server |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:push` | Push schema to the database |
| `npm run db:migrate` | Create + apply a migration (Postgres) |

## Running from VSCode
- Press **F5** and pick **"Next.js: dev server"**, or
- Open a terminal (`` Ctrl+` ``) and run `npm run dev`.

## Environment
Copy `.env.example` to `.env` and fill in values. See the Supabase section below for the production database.

## Database
The app uses Prisma. See `.env` for `DATABASE_URL`. Migration to Supabase (Postgres) is documented in `SUPABASE.md`.
