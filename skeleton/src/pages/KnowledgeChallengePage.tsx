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
  getKnowledgeSectionData,
  getKnowledgeChallengeAttempts,
  getKnowledgeChallengeMd,
  getKnowledgeSolutionLoader,
  isKnowledgeAttemptDone,
} from '../data'
import ChallengeBrief from '../components/ChallengeBrief'
import SolutionErrorBoundary from '../components/SolutionErrorBoundary'
import styles from './ChallengePage.module.css'

const ChallengeBriefMemo = memo(ChallengeBrief)

export default function KnowledgeChallengePage() {
  const { section = '', folder = '' } = useParams()
  const navigate = useNavigate()
  const [briefOpen, setBriefOpen] = useState(true)
  const [done, setDone] = useState(() => isKnowledgeAttemptDone(section, folder))

  const match = folder.match(/^challenge-(\d+)-attempt-(\d+)$/)
  const challengeId = match ? parseInt(match[1], 10) : null

  const data = useMemo(() => getKnowledgeSectionData(section), [section])
  const challenge = data?.challenges.find((c) => c.id === challengeId)
  const allAttempts = useMemo(
    () => getKnowledgeChallengeAttempts(section, challengeId ?? -1),
    [section, challengeId],
  )
  const md = useMemo(() => getKnowledgeChallengeMd(section, folder), [section, folder])
  const loader = useMemo(() => getKnowledgeSolutionLoader(section, folder), [section, folder])

  const SolutionComponent = useMemo(() => {
    if (!loader) return null
    return lazy(loader as () => Promise<{ default: ComponentType }>)
  }, [folder]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!challenge || !loader) {
    const looksValid = /^challenge-\d+-attempt-\d+$/.test(folder)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-sm">
          <p className="text-[--color-text-secondary] text-sm mb-2">Solution not found</p>
          <code className="text-violet-400 font-mono text-xs bg-violet-500/10 ring-1 ring-violet-500/20 px-2 py-1 rounded block mb-4">
            knowledge/{section}/{folder}
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
              to={`/knowledge/${section}`}
              className="text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors duration-150 underline underline-offset-2"
            >
              ← Back to {section}
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
            to="/knowledge"
            className="text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors duration-150 shrink-0"
          >
            knowledge
          </Link>
          <span className="text-[--color-border-hover] shrink-0 select-none">/</span>
          <Link
            to={`/knowledge/${section}`}
            className="text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors duration-150 shrink-0"
          >
            {section}
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
                    onClick={() => navigate(`/knowledge/${section}/${a.folder}`)}
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
                fetch('/api/open-knowledge-editor', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ editor, section, folder }),
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
              await fetch('/api/mark-knowledge-done', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ section, folder }),
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
          {md ? (
            <ChallengeBriefMemo content={md} />
          ) : (
            <div className="p-5 text-[--color-text-muted] text-xs font-mono">
              CHALLENGE.md not found
            </div>
          )}
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
