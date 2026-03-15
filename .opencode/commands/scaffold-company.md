---
description: Scaffold a new company with company profile and 40 tailored challenges
---

Scaffold a new company for the interview prep system. Follow these steps exactly.

## Step 1 — Gather company information

Ask the user for the following (you can ask all at once):

1. **Company name** (e.g. "Notion", "Linear", "Vercel") — this becomes the folder slug (lowercase, hyphenated)
2. **Role title** (e.g. "Software Engineer, Frontend")
3. **Location** (e.g. "Berlin", "Remote")
4. **Product description** — 1-2 sentences about what the company builds (helps tailor challenges)
5. **Interview rounds** — ask them to briefly describe each round (what it tests, format, duration)
6. **Technical focus areas** — what does this company care most about? (e.g. "collaborative editing", "real-time sync", "design systems", "performance", "accessibility")
7. **Company values** — 3-6 principles or values the company tests in behavioral questions
8. **Engineering culture notes** — anything specific about how they evaluate engineers

## Step 2 — Create company folder structure

Create these files:

### `companies/{slug}/company.md`

Write a comprehensive company profile following this structure:
- Company/role header
- What the product is (1 paragraph)
- Interview rounds table (round name | what they really test)
- Company values with descriptions (what behavioral questions test for each)
- Technical focus areas (specific to this company's product)
- Values story prompts (help the candidate connect their existing stories to this company's values)
- Suggested prep sequence (Week 1/2/3 + days before, based on the technical focus areas)

### `companies/{slug}/challenges.json`

Generate **40 front-end React/TypeScript challenges** tailored to the company's technical focus. Read `candidate.md` for the candidate's name and role. Use this exact JSON schema:

```json
{
  "meta": {
    "candidate": "<name from candidate.md>",
    "role": "<role title>",
    "company": "<company name>",
    "version": "1.0",
    "total": 40,
    "instructions": "Score each required criterion as PASS/FAIL and each bonus as ACHIEVED/MISSED. Overall grade: STRONG PASS / PASS / BORDERLINE / FAIL."
  },
  "challenges": [
    {
      "id": 1,
      "title": "...",
      "difficulty": "warm-up",
      "time_budget_minutes": 15,
      "tags": ["component", "accessibility"],
      "prompt": "1-3 sentence task description. What to build.",
      "required": [
        "Specific testable criterion 1",
        "Specific testable criterion 2",
        "Specific testable criterion 3"
      ],
      "bonus": [
        "Stretch goal 1",
        "Stretch goal 2"
      ],
      "interviewer_focus": "What the interviewer is specifically looking for at this company. Reference the product domain."
    }
  ]
}
```

Challenge distribution:
- 10 warm-up (15-20 min, difficulty: "warm-up")
- 20 medium (20-30 min, difficulty: "medium")
- 10 hard (30-45 min, difficulty: "hard")

Tags to use (mix as appropriate): `component`, `text`, `keyboard`, `async`, `accessibility`, `performance`, `hooks`, `architecture`, `state`, `animation`

**Tailor challenges to the company's product.** Examples:
- Rich text editor company → heavier on `text`, Selection API, contenteditable, diffing
- Real-time collaboration → heavier on `async`, optimistic updates, conflict resolution
- Design system company → heavier on `component`, composition, polymorphic components, theming
- Email/productivity → heavier on `keyboard`, command palette, virtual lists, shortcuts
- Data-heavy → heavier on `performance`, virtualisation, canvas, WebWorkers

Each `interviewer_focus` must reference something specific to the company's product or engineering values.

### `companies/{slug}/solutions/.gitkeep`

Create this empty file.

## Step 3 — Update config.json

Read `config.json` and set `activeCompany` to the new company slug. Write it back.

## Step 4 — Report back

Tell the user:
- Files created
- `pnpm dev` is ready to use with the new company
- Suggest running `pnpm dev` to browse challenges
