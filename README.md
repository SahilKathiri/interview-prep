# Interview Prep

A self-contained front-end interview practice tool. Includes a TUI for picking challenges, a per-challenge Vite workspace, and a Claude Code coaching agent that briefs and assesses you in character as an interviewer.

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [pnpm](https://pnpm.io/) — `npm install -g pnpm`
- [Claude Code](https://claude.ai/code) — for briefing and assessment

## Getting started

```bash
# 1. Clone the repo
git clone <repo-url> interview-prep
cd interview-prep

# 2. Run setup — installs deps and creates your personal config files
pnpm setup

# 3. Fill in your details
#    candidate.md  — your name, role, strengths, and signature projects
#    config.json   — set "activeCompany" to a folder name under companies/

# 4. Launch the TUI
pnpm prep
```

`pnpm setup` is safe to re-run — it skips files that already exist.

## Daily workflow

```
pnpm dev
```

1. The app opens in your browser at `localhost:5173`
2. Pick a company, then browse and filter challenges by difficulty, tags, or time budget
3. Click **start** on a challenge — a standalone Vite workspace is created and its dev server opens automatically
4. Open the solution folder in Claude Code
5. Say **"Brief me on challenge N"** — Claude acts as the interviewer
6. Code in `src/App.tsx`
7. Say **"Assess this"** when done — Claude scores your solution against all criteria

## Adding a company

Open Claude Code in this project and run:

```
/scaffold-company
```

Claude will ask for the company name and details, then generate:
- `companies/{name}/company.md` — company profile, values, interview rounds, technical focus
- `companies/{name}/challenges.json` — 40 challenges tailored to that company

Then update `config.json` to point at the new company:

```json
{ "activeCompany": "your-company-name" }
```

The active company is set in `config.json` — update it directly or add multiple companies and they'll all appear on the dashboard.

## Structure

```
interview-prep/
├── candidate.md            ← your profile (gitignored — copy from candidate.example.md)
├── config.json             ← active company (gitignored — copy from config.example.json)
├── candidate.example.md    ← template for candidate.md
├── config.example.json     ← template for config.json
├── scripts/
│   └── setup.mjs           ← first-time setup (pnpm setup)
├── template/               ← Vite project template, copied per challenge
├── skeleton/               ← shared Vite dev environment (react-scan, react-grab)
└── companies/
    └── {company}/
        ├── company.md      ← company profile (Claude reads this for context)
        ├── challenges.json ← challenge list
        └── solutions/      ← gitignored — your attempts live here
            └── challenge-{N}-attempt-{N}/
                ├── src/App.tsx   ← your solution
                ├── package.json
                └── CHALLENGE.md ← full brief + criteria for Claude
```

## Dev tools

These run automatically in every challenge workspace:

- **react-scan** — highlights component re-renders with a visual overlay
- **react-grab** — hover any element + `Cmd+C` to copy component name, file path, and HTML to clipboard for pasting into Claude
