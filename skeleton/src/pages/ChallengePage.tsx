import {
  Suspense,
  lazy,
  useState,
  useMemo,
  memo,
  type ComponentType,
} from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  getChallengeAttempts,
  getChallengeByFolder,
  getChallengeMd,
  getSolutionLoader,
  isAttemptDone,
} from '../data'
import ChallengeBrief from '../components/ChallengeBrief'
import SolutionErrorBoundary from '../components/SolutionErrorBoundary'
import styles from './ChallengePage.module.css'
import type { Challenge } from '../types'

const ChallengeBriefMemo = memo(ChallengeBrief)

// ─── Claude prompt builder ────────────────────────────────────────────────────

function buildClaudePrompt(c: Challenge): string {
  return `You are a reference implementation assistant for a front-end interview challenge.

Challenge: ${c.title}
Difficulty: ${c.difficulty} | Time budget: ${c.time_budget_minutes} min

Prompt:
${c.prompt}

Required criteria:
${c.required.map((r) => `- ${r}`).join('\n')}

Bonus criteria:
${c.bonus.map((b) => `- ${b}`).join('\n')}

Interviewer focus:
${c.interviewer_focus}

Please walk me through a reference implementation: the key design decisions, component structure, and any tricky parts. Don't just give me the final code — explain the thinking behind each decision.`
}

export default function ChallengePage() {
  const { company = '', folder = '' } = useParams()
  const navigate = useNavigate()
  const [briefOpen, setBriefOpen] = useState(true)
  const [done, setDone] = useState(() => isAttemptDone(company, folder))

  const challenge = useMemo(() => getChallengeByFolder(company, folder), [company, folder])
  const allAttempts = useMemo(
    () => getChallengeAttempts(company, challenge?.id ?? -1),
    [company, challenge?.id],
  )
  const md = useMemo(() => getChallengeMd(company, folder), [company, folder])
  const loader = useMemo(() => getSolutionLoader(company, folder), [company, folder])

  const SolutionComponent = useMemo(() => {
    if (!loader) return null
    return lazy(loader as () => Promise<{ default: ComponentType }>)
  }, [folder]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!challenge || !loader) {
    const looksValid = /^.+-\d+$/.test(folder)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-[--color-text-secondary] text-sm mb-2">
            Solution not found
          </p>
          <code className="text-violet-400 font-mono text-xs bg-violet-500/10 ring-1 ring-violet-500/20 px-2 py-1 rounded block mb-4">
            {company}/{folder}
          </code>
          {looksValid && (
            <p className="text-[--color-text-muted] text-xs mb-4">
              The workspace exists but Vite hasn't picked it up yet.
              <br />
              Hard-refresh to reload the file index.
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            {looksValid && (
              <button
                onClick={() => window.location.reload()}
                className="text-xs px-3 py-1.5 rounded-md bg-[--color-surface] ring-1 ring-[--color-border] text-[--color-text-secondary] hover:ring-[--color-border-hover] hover:text-[--color-text] transition-colors duration-150"
              >
                Refresh
              </button>
            )}
            <Link
              to={`/${company}`}
              className="text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors duration-150 underline underline-offset-2"
            >
              ← Back to {company}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.layout} data-brief-open={briefOpen}>
      {/* ── Top bar ───────────────────────────────────────────────── */}
      <header className={styles.topbar}>
        <div className="flex items-center gap-2 min-w-0">
          <Link
            to="/"
            className="text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors duration-150 shrink-0"
            aria-label="Dashboard"
          >
            ⌂
          </Link>
          <span className="text-[--color-border-hover] shrink-0 select-none">/</span>
          <Link
            to={`/${company}`}
            className="text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors duration-150 shrink-0"
          >
            {company}
          </Link>
          <span className="text-[--color-border-hover] shrink-0 select-none">/</span>
          <span className="text-sm text-[--color-text-secondary] truncate font-medium">
            <span className="font-mono text-[--color-text-muted] text-xs mr-1.5 tabular">
              {String(challenge.id).padStart(2, '0')}
            </span>
            {challenge.title}
          </span>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Attempt switcher */}
          {allAttempts.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-[--color-text-muted] mr-0.5 select-none">
                attempt
              </span>
              {allAttempts.map((a) => {
                const isCurrent = a.folder === folder
                return (
                  <button
                    key={a.folder}
                    onClick={() => navigate(`/${company}/${a.folder}`)}
                    aria-current={isCurrent ? 'page' : undefined}
                    aria-label={`Attempt ${a.attemptN}${isCurrent ? ' (current)' : ''}`}
                    className={`text-[11px] px-2 py-0.5 rounded font-mono transition-[background-color,color,box-shadow] duration-100 ${
                      isCurrent
                        ? 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-500/30'
                        : 'text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-white/5'
                    }`}
                  >
                    #{a.attemptN}
                  </button>
                )
              })}
            </div>
          )}

          {/* Open in editor */}
          {(['code', 'zed'] as const).map((editor) => (
            <button
              key={editor}
              onClick={() =>
                fetch('/api/open-editor', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ editor, company, folder }),
                })
              }
              aria-label={`Open in ${editor}`}
              className="text-xs px-2.5 py-1 rounded-md ring-1 ring-[--color-border] text-[--color-text-muted] hover:text-[--color-text-secondary] hover:ring-[--color-border-hover] hover:bg-white/[0.03] transition-[background-color,color,ring-color] duration-100 font-mono"
            >
              {editor}
            </button>
          ))}

          {/* Mark done */}
          <button
            onClick={async () => {
              if (done) return
              await fetch('/api/mark-done', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company, folder }),
              })
              setDone(true)
            }}
            aria-pressed={done}
            aria-label={done ? 'Attempt marked done' : 'Mark attempt as done'}
            className={`text-xs px-2.5 py-1 rounded-md ring-1 transition-[background-color,color,ring-color] duration-100 ${
              done
                ? 'bg-green-500/10 text-green-400 ring-green-500/20'
                : 'text-[--color-text-muted] ring-[--color-border] hover:text-green-400 hover:ring-green-500/30 hover:bg-green-500/5'
            }`}
          >
            {done ? '✓ done' : 'mark done'}
          </button>

          {/* Brief toggle */}
          <button
            onClick={() => setBriefOpen((o) => !o)}
            aria-pressed={briefOpen}
            aria-label={briefOpen ? 'Hide challenge brief' : 'Show challenge brief'}
            className={`text-xs px-2.5 py-1 rounded-md ring-1 transition-[background-color,color,ring-color] duration-100 ${
              briefOpen
                ? 'bg-[--color-accent-subtle] text-violet-300 ring-[--color-accent-border]'
                : 'text-[--color-text-muted] ring-[--color-border] hover:text-[--color-text-secondary] hover:ring-[--color-border-hover] hover:bg-white/[0.03]'
            }`}
          >
            {briefOpen ? 'Hide brief' : 'Brief'}
          </button>
        </div>
      </header>

      {/* ── Brief panel ──────────────────────────────────────────── */}
      {briefOpen && (
        <aside className={styles.brief}>
          <div className={styles.briefContent}>
            {md ? (
              <ChallengeBriefMemo content={md} />
            ) : (
              <div className="p-5 text-[--color-text-muted] text-xs font-mono">
                CHALLENGE.md not found
              </div>
            )}
          </div>
          <div className={styles.briefFooter}>
            <button
              onClick={() => {
                const prompt = buildClaudePrompt(challenge)
                window.open(
                  `https://claude.ai/new?q=${encodeURIComponent(prompt)}`,
                  '_blank',
                  'noopener',
                )
              }}
              className="text-xs px-3 py-1.5 rounded-md ring-1 ring-[--color-accent-border] text-violet-400 bg-[--color-accent-subtle] hover:bg-violet-500/15 hover:text-violet-300 transition-[background-color,color] duration-100 cursor-pointer"
            >
              ask claude ↗
            </button>
          </div>
        </aside>
      )}

      {/* ── Solution panel ─────────────────────────────────────── */}
      <main className={styles.solution}>
        <SolutionErrorBoundary>
          <Suspense
            fallback={
              <div className="flex items-center justify-center h-full text-[--color-text-muted] text-sm">
                <span className="font-mono text-xs">loading…</span>
              </div>
            }
          >
            {SolutionComponent && <SolutionComponent />}
          </Suspense>
        </SolutionErrorBoundary>
      </main>
    </div>
  )
}
