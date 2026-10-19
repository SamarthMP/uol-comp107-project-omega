# Meadow House Repairs

A realtime repair log for the (fictional) care home Meadow House. Staff report a repair, follow it from **New** to **In progress** to **Completed**, and every step is kept in a dated history. Everyone looking at the board sees changes the moment they happen, with no refresh needed.

Built for the Omega Digital hackathon brief in [BRIEF.md](BRIEF.md).

## Running locally

You'll need the [.NET 10 SDK](https://dotnet.microsoft.com/download) and [Node.js 22+](https://nodejs.org).

```bash
cd Backend
dotnet run -c Debug
```

This builds the frontend, applies database migrations, starts the API and launches the Vite dev server. Open **http://localhost:6768**.

There's no sign-up or password. Each browser session gets its own account called **Demo User NNNN** automatically. Open a second browser window (or a private window) to get a second user and watch updates arrive in realtime.

Other ways to run it:

| What | Command |
| --- | --- |
| Backend only (serves the built frontend) | `cd Backend && AUTH_SECRET=any-long-random-string dotnet run -c Release`, then open http://localhost:5092 |
| Frontend dev server only | `cd Frontend && npm run dev` (needs the backend running) |
| Docker | `AUTH_SECRET=any-long-random-string docker compose up --build`, then open http://localhost:6768 |
| Backend tests | `dotnet test Tests/Backend.Tests -p:SkipFrontendBuild=true` |
| Frontend checks | `cd Frontend && npm run lint && npx tsc -b` |

Data is stored in a local SQLite database (`Backend/app.db`), so jobs survive page refreshes and server restarts. Delete that file to start from an empty board.

## Features

**The brief**
- Report a repair with a description, reporter name and **Normal** or **Urgent** priority. Blank or whitespace-only descriptions and names are rejected with a specific message next to the field, and everything else you typed is kept.
- Every job gets an automatic, never-reused ID (`MH-0001`), the date and time, and the house name Meadow House.
- Start work, add dated progress notes, and complete a job with a required completion note. History is append-only, so nothing earlier is ever lost.
- Jobs are independent. Each one has its own status, notes and history.
- All text is rendered as plain text. `<b>check gate</b>` shows exactly as typed.

**Beyond the brief**
- **Live updates over SignalR.** New reports, status changes and notes from other people appear instantly, with a toast and a highlight on the changed job. The board re-syncs automatically after a dropped connection.
- **Presence.** See who's online and which job each person has open. Avatars appear on a job when someone else is looking at it.
- **Safe concurrent edits.** Optimistic concurrency stops two people from silently overwriting each other's update.
- **Status overview.** Live counts per status (with urgent counts) double as filters. There's also full-text search, an *Urgent only* toggle and sorting.
- **Progress stepper and timeline.** New → In progress → Completed with timestamps, plus a colour-coded history that shows who did what and when.
- **Accessibility.** Labelled controls, errors linked to their fields, visible keyboard focus, focus moved to the result after each action, screen-reader announcements, a skip link, reduced-motion support, and colour contrast checked against WCAG AA in light and dark themes.
- **Responsive.** A two-pane board on desktop and a list/detail flow on phones.
- **Light, dark and system themes.**
- **Shareable links.** Every job has its own URL (`/spa/jobs/5`).

## How the judging tests map to the app

| # | Test | Where to look |
| --- | --- | --- |
| 1 | Valid report | **Report a repair** → **Submit report**. The new job opens with a confirmation, its ID, date, Meadow House, description, reporter and priority |
| 2–3 | Description / reporter required | Leave a field blank or type only spaces. The error appears under the field and nothing is created |
| 4 | Priority retained | Urgent jobs show a red **Urgent** badge, written out in words |
| 5 | Independent jobs | Each job is a separate record with its own ID, status and history |
| 6 | Progress and history | **Start work**, then **Save progress note**. The latest note and the dated history update |
| 7 | Completion note required | **Mark as completed** with a blank or spaces-only note is rejected. The job doesn't change |
| 8 | Complete a repair | The **Repair completed** panel shows the completion note, and the earlier history stays |
| 9 | Refresh persistence | Stored in SQLite on the server, so refresh or restart and everything is still there |
| 10 | Plain text | React renders text as text, and the backend tests check the exact characters round-trip |

All ten are also covered by the backend integration tests in [Tests/Backend.Tests](Tests/Backend.Tests).

## Tech stack

- **Backend:** ASP.NET Core 10, EF Core with SQLite, OpenIddict, SignalR. Repair logic lives in [Backend/Repairs](Backend/Repairs) (models, service, controllers, hub).
- **Frontend:** React 19, TypeScript, react-router, Tailwind CSS 4, shadcn/ui, i18next. The repairs UI lives in [Frontend/src/components/repairs](Frontend/src/components/repairs), and data and realtime hooks are in [Frontend/src/hooks](Frontend/src/hooks).
- **Tests:** xUnit, using `WebApplicationFactory` and real SignalR clients.

All people and data in this app are fictional.

Starter kit by [SamarthMP](https://github.com/SamarthMP)
