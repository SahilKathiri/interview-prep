import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import fs from 'node:fs'
import { spawn } from 'node:child_process'
import type { IncomingMessage, ServerResponse } from 'node:http'

const ROOT = path.resolve(__dirname, '..')
const COMPANIES_DIR = path.resolve(__dirname, '../companies')
const KNOWLEDGE_DIR = path.resolve(__dirname, '../knowledge')
const TEMPLATE_DIR = path.resolve(__dirname, '../template')

// ─── Workspace helpers ───────────────────────────────────────────────────────

/** Convert a challenge title to a slug for use in folder names. Must stay in sync with skeleton/src/data.ts. */
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

function copyDirSync(src: string, dest: string) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.name === 'node_modules') continue
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDirSync(srcPath, destPath)
    else fs.copyFileSync(srcPath, destPath)
  }
}


interface Challenge {
  id: number
  title: string
  difficulty: string
  time_budget_minutes: number
  tags: string[]
  prompt: string
  required: string[]
  bonus: string[]
  interviewer_focus: string
}

interface KnowledgeChallenge {
  id: number
  title: string
  tags: string[]
  prompt: string
  required: string[]
  bonus: string[]
  demo: string
  stubs?: string[]
  demoCode?: string
}

function loadChallenge(company: string, challengeId: number): Challenge {
  const file = path.join(COMPANIES_DIR, company, 'challenges.json')
  const { challenges } = JSON.parse(fs.readFileSync(file, 'utf-8'))
  const c = challenges.find((ch: Challenge) => ch.id === challengeId)
  if (!c) throw new Error(`Challenge ${challengeId} not found for ${company}`)
  return c
}

function loadKnowledgeChallenge(section: string, challengeId: number): KnowledgeChallenge {
  const file = path.join(KNOWLEDGE_DIR, section, 'challenges.json')
  const { challenges } = JSON.parse(fs.readFileSync(file, 'utf-8'))
  const c = challenges.find((ch: KnowledgeChallenge) => ch.id === challengeId)
  if (!c) throw new Error(`Challenge ${challengeId} not found in knowledge/${section}`)
  return c
}

function generateAppStarter(c: Challenge) {
  return `// Challenge ${c.id} — ${c.title}
// Time budget: ${c.time_budget_minutes} min | Difficulty: ${c.difficulty}
// Tags: ${c.tags.join(', ')}
//
// ${c.prompt}

export default function App() {
  return (
    <div>
      <h1>Challenge ${c.id}: ${c.title}</h1>
      {/* Your solution here */}
    </div>
  )
}
`
}

function generateUiAppStarter(c: KnowledgeChallenge) {
  return `// ${c.title}
// Tags: ${c.tags.join(', ')}
//
// TASK: ${c.prompt}
//
// DEMO: ${c.demo}

// Build your component below, then make the Demo work.

export default function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: '1rem' }}>${c.title}</h1>
      {/* Replace this with your component */}
      <p style={{ color: '#888' }}>Implement and demo here.</p>
    </div>
  )
}
`
}

function generateHooksAppStarter(c: KnowledgeChallenge) {
  const stubs = (c.stubs ?? []).join('\n\n')
  const demo = c.demoCode ?? `function Demo() {
  return <p style={{ color: '#888' }}>Wire up the demo here.</p>
}`

  return `// ${c.title}
// Tags: ${c.tags.join(', ')}
//
// TASK: ${c.prompt}
//
// DEMO: ${c.demo}

import React from 'react'

// ─── Implement this hook ──────────────────────────────────────────────────────

${stubs}

// ─── Demo (do not edit) ───────────────────────────────────────────────────────

${demo}

export default function App() {
  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui' }}>
      <h1 style={{ marginBottom: '0.25rem' }}>${c.title}</h1>
      <p style={{ color: '#888', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Implement the hook above, then verify the demo works correctly.
      </p>
      <Demo />
    </div>
  )
}
`
}

function generateChallengeMd(c: Challenge, company: string, attemptN: number) {
  const req = c.required.map((r) => `- [ ] ${r}`).join('\n')
  const bon = c.bonus.map((b) => `- [ ] ${b}`).join('\n')
  const date = new Date().toISOString().slice(0, 10)
  return `# Challenge ${c.id} — ${c.title}

**Company:** ${company} | **Attempt:** ${attemptN} | **Started:** ${date}
**Time budget:** ${c.time_budget_minutes} min | **Difficulty:** ${c.difficulty}

## Prompt

${c.prompt}

## Required criteria

${req}

## Bonus criteria

${bon}

## Interviewer focus

${c.interviewer_focus}

## Tags

${c.tags.join(', ')}

---

*Tell Claude: "Brief me on challenge ${c.id}" to start, or "Assess this" when done.*
*Claude will also read \`companies/${company}/company.md\` for company-specific context.*
`
}

function getAttemptCount(company: string, challengeTitle: string): number {
  const dir = path.join(COMPANIES_DIR, company, 'solutions')
  if (!fs.existsSync(dir)) return 0
  const slug = toSlug(challengeTitle)
  return fs.readdirSync(dir).filter((d) => {
    const m = d.match(/^(.+)-(\d+)$/)
    return m?.[1] === slug
  }).length
}

function getKnowledgeAttemptCount(section: string, challengeTitle: string): number {
  const dir = path.join(KNOWLEDGE_DIR, section, 'solutions')
  if (!fs.existsSync(dir)) return 0
  const slug = toSlug(challengeTitle)
  return fs.readdirSync(dir).filter((d) => {
    const m = d.match(/^(.+)-(\d+)$/)
    return m?.[1] === slug
  }).length
}

function runInstall(cwd: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('pnpm', ['install'], { cwd, stdio: 'ignore', shell: true })
    proc.on('close', (code) =>
      code === 0 ? resolve() : reject(new Error(`pnpm install failed (exit ${code})`)),
    )
    proc.on('error', reject)
  })
}

function generateKnowledgeChallengeMd(c: KnowledgeChallenge, section: string, attemptN: number) {
  const req = c.required.map((r) => `- [ ] ${r}`).join('\n')
  const bon = c.bonus.map((b) => `- [ ] ${b}`).join('\n')
  const date = new Date().toISOString().slice(0, 10)
  return `# ${c.title}

**Section:** ${section} | **Attempt:** ${attemptN} | **Started:** ${date}

## Task

${c.prompt}

## Demo

${c.demo}

## Required criteria

${req}

## Bonus criteria

${bon}

## Tags

${c.tags.join(', ')}

---

*Tell Claude: "Brief me on ${c.title}" to start, or "Assess this" when done.*
`
}

async function createKnowledgeWorkspace(section: string, challengeId: number): Promise<string> {
  const challenge = loadKnowledgeChallenge(section, challengeId)
  const attemptN = getKnowledgeAttemptCount(section, challenge.title) + 1
  const folderName = `${toSlug(challenge.title)}-${attemptN}`
  const folderPath = path.join(KNOWLEDGE_DIR, section, 'solutions', folderName)
  const srcPath = path.join(folderPath, 'src')

  copyDirSync(TEMPLATE_DIR, folderPath)
  const appContent = section === 'hooks'
    ? generateHooksAppStarter(challenge)
    : generateUiAppStarter(challenge)
  fs.writeFileSync(path.join(srcPath, 'App.tsx'), appContent)
  fs.writeFileSync(path.join(folderPath, 'CHALLENGE.md'), generateKnowledgeChallengeMd(challenge, section, attemptN))

  const pkgPath = path.join(folderPath, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.name = `knowledge-${section}-${folderName}`
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  await runInstall(folderPath)

  return folderName
}

async function createWorkspace(company: string, challengeId: number): Promise<string> {
  const challenge = loadChallenge(company, challengeId)
  const attemptN = getAttemptCount(company, challenge.title) + 1
  const folderName = `${toSlug(challenge.title)}-${attemptN}`
  const folderPath = path.join(COMPANIES_DIR, company, 'solutions', folderName)
  const srcPath = path.join(folderPath, 'src')

  copyDirSync(TEMPLATE_DIR, folderPath)
  fs.writeFileSync(path.join(srcPath, 'App.tsx'), generateAppStarter(challenge))
  fs.writeFileSync(path.join(folderPath, 'CHALLENGE.md'), generateChallengeMd(challenge, company, attemptN))

  const pkgPath = path.join(folderPath, 'package.json')
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  pkg.name = `${company}-${folderName}`
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n')

  await runInstall(folderPath)

  return folderName
}

// ─── Plugins ─────────────────────────────────────────────────────────────────

/**
 * Adds the companies/ directory (which lives outside the Vite project root)
 * to chokidar's watch list so new solution files are picked up without a
 * hard-refresh.
 */
function watchCompanies(): Plugin {
  return {
    name: 'watch-companies',
    configureServer(server) {
      server.watcher.add(COMPANIES_DIR)
      server.watcher.add(KNOWLEDGE_DIR)
    },
  }
}

/**
 * Exposes a small HTTP API used by the dashboard:
 *
 * POST /api/start-challenge  { company, challengeId }  → { folderName }
 * POST /api/mark-done        { company, folder }        → { ok }
 * POST /api/open-editor      { editor, company, folder } → { ok }
 */
function workspaceApi(): Plugin {
  return {
    name: 'workspace-api',
    configureServer(server) {
      server.middlewares.use((req: IncomingMessage, res: ServerResponse, next: () => void) => {
        const url = req.url ?? ''
        if (!url.startsWith('/api/') || req.method !== 'POST') { next(); return }

        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk })
        req.on('end', () => {
          void (async () => {
            const json = (data: unknown) => {
              res.writeHead(200, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify(data))
            }
            const fail = (msg: string) => {
              res.writeHead(500, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({ error: msg }))
            }

            try {
              const payload = JSON.parse(body) as Record<string, unknown>

              if (url === '/api/start-challenge') {
                const folderName = await createWorkspace(
                  payload.company as string,
                  payload.challengeId as number,
                )
                json({ folderName })

              } else if (url === '/api/mark-done') {
                const { company, folder } = payload as { company: string; folder: string }
                const markerPath = path.join(COMPANIES_DIR, company, 'solutions', folder, 'done')
                fs.writeFileSync(markerPath, '')
                json({ ok: true })

              } else if (url === '/api/open-editor') {
                const { editor, company, folder } = payload as {
                  editor: 'code' | 'zed'
                  company: string
                  folder: string
                }
                const filePath = path.join(COMPANIES_DIR, company, 'solutions', folder, 'src', 'App.tsx')
                spawn(editor, [ROOT, filePath], { detached: true, stdio: 'ignore', shell: true }).unref()
                json({ ok: true })

              } else if (url === '/api/start-knowledge-challenge') {
                const folderName = await createKnowledgeWorkspace(
                  payload.section as string,
                  payload.challengeId as number,
                )
                json({ folderName })

              } else if (url === '/api/mark-knowledge-done') {
                const { section, folder } = payload as { section: string; folder: string }
                const markerPath = path.join(KNOWLEDGE_DIR, section, 'solutions', folder, 'done')
                fs.writeFileSync(markerPath, '')
                json({ ok: true })

              } else if (url === '/api/open-knowledge-editor') {
                const { editor, section, folder } = payload as {
                  editor: 'code' | 'zed'
                  section: string
                  folder: string
                }
                const filePath = path.join(KNOWLEDGE_DIR, section, 'solutions', folder, 'src', 'App.tsx')
                spawn(editor, [ROOT, filePath], { detached: true, stdio: 'ignore', shell: true }).unref()
                json({ ok: true })

              } else {
                next()
              }
            } catch (err: unknown) {
              fail((err as Error).message)
            }
          })()
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [
    watchCompanies(),
    workspaceApi(),
    tailwindcss(),
    react(),
  ],
  server: {
    open: true,
    fs: {
      allow: [ROOT],
    },
  },
  optimizeDeps: {
    include: ['react-markdown', 'remark-gfm'],
  },
})
