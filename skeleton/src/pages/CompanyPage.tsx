import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useState, useMemo, useRef, useEffect } from 'react'
import { getChallengesData, getChallengeAttempts, getCompanyAttempts, isAttemptDone } from '../data'
import type { Challenge, Difficulty } from '../types'
import ChallengeBriefModal from '../components/ChallengeBriefModal'

// ─── Colour maps ────────────────────────────────────────────────────────────

const DIFF_BADGE: Record<Difficulty, string> = {
  'warm-up': 'text-green-400 bg-green-500/10 ring-1 ring-green-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 ring-1 ring-yellow-500/20',
  hard: 'text-red-400 bg-red-500/10 ring-1 ring-red-500/20',
}

const DIFF_SECTION_ACCENT: Record<Difficulty, string> = {
  'warm-up': 'border-green-500/50',
  medium: 'border-yellow-500/50',
  hard: 'border-red-500/50',
}

const DIFF_LABEL_COLOR: Record<Difficulty, string> = {
  'warm-up': 'text-green-500/70',
  medium: 'text-yellow-500/70',
  hard: 'text-red-500/70',
}

const DIFF_PILL_ACTIVE: Record<Difficulty, string> = {
  'warm-up': 'bg-green-500/15 text-green-300 ring-1 ring-green-500/30',
  medium: 'bg-yellow-500/15 text-yellow-300 ring-1 ring-yellow-500/30',
  hard: 'bg-red-500/15 text-red-300 ring-1 ring-red-500/30',
}

const DIFF_ORDER: Difficulty[] = ['warm-up', 'medium', 'hard']

// ─── Filter state types ──────────────────────────────────────────────────────

interface Filters {
  difficulties: Set<Difficulty>
  tags: Set<string>
}

// ─── CompanyPage ─────────────────────────────────────────────────────────────

export default function CompanyPage() {
  const { company = '' } = useParams()
  const data = getChallengesData(company)

  // Derived constants from data
  const allTags = useMemo(
    () => (data ? [...new Set(data.challenges.flatMap((c) => c.tags))].sort() : []),
    [data],
  )

  // Filter state
  const [filters, setFilters] = useState<Filters>({
    difficulties: new Set(),
    tags: new Set(),
  })

  // Preview modal state
  const [previewChallenge, setPreviewChallenge] = useState<Challenge | null>(null)
  const [previewStarting, setPreviewStarting] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const previewTriggerRef = useRef<HTMLButtonElement | null>(null)
  const previewAttempts = useMemo(
    () => getChallengeAttempts(company, previewChallenge?.id ?? -1),
    [company, previewChallenge?.id],
  )

  // Auto-open modal when navigated here via shuffle (?shuffle=<id>)
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const shuffleId = searchParams.get('shuffle')
    if (!shuffleId || !data) return
    const challenge = data.challenges.find((c) => c.id === Number(shuffleId))
    if (challenge) setPreviewChallenge(challenge)
    setSearchParams({}, { replace: true })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function openPreview(challenge: Challenge, trigger: HTMLButtonElement) {
    previewTriggerRef.current = trigger
    setPreviewChallenge(challenge)
  }

  function closePreview() {
    setPreviewChallenge(null)
    setPreviewStarting(false)
    setPreviewError('')
  }

  async function handleModalStart() {
    if (!previewChallenge) return
    setPreviewStarting(true)
    setPreviewError('')
    try {
      const res = await fetch('/api/start-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, challengeId: previewChallenge.id }),
      })
      const json = await res.json() as { folderName?: string; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to create workspace')
      window.location.href = `/${company}/${json.folderName}`
    } catch (err: unknown) {
      setPreviewStarting(false)
      setPreviewError((err as Error).message)
    }
  }

  const isFiltered = filters.difficulties.size > 0 || filters.tags.size > 0

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[--color-text-secondary] text-sm mb-3">
            Company{' '}
            <code className="text-violet-400 font-mono bg-violet-500/10 px-1.5 py-0.5 rounded text-xs">
              {company}
            </code>{' '}
            not found
          </p>
          <Link
            to="/"
            className="text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors duration-150 underline underline-offset-2"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Apply filters
  const filtered = useMemo(
    () =>
      data.challenges.filter((c) => {
        if (filters.difficulties.size > 0 && !filters.difficulties.has(c.difficulty)) return false
        if (filters.tags.size > 0 && !c.tags.some((t) => filters.tags.has(t))) return false
        return true
      }),
    [data.challenges, filters],
  )

  const totalAttempted = new Set(
    data.challenges.flatMap((c) =>
      getChallengeAttempts(company, c.id).length > 0 ? [c.id] : [],
    ),
  ).size

  function toggleDifficulty(diff: Difficulty) {
    setFilters((prev) => {
      const next = new Set(prev.difficulties)
      next.has(diff) ? next.delete(diff) : next.add(diff)
      return { ...prev, difficulties: next }
    })
  }

  function toggleTag(tag: string) {
    setFilters((prev) => {
      const next = new Set(prev.tags)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return { ...prev, tags: next }
    })
  }

  function clearFilters() {
    setFilters({ difficulties: new Set(), tags: new Set() })
  }

  function handleShuffle() {
    if (!data) return
    const attempted = new Set(getCompanyAttempts(company).map((a) => a.challengeId))
    const pool = data.challenges.filter((c) => !attempted.has(c.id))
    const source = pool.length > 0 ? pool : data.challenges
    const pick = source[Math.floor(Math.random() * source.length)]
    if (pick) setPreviewChallenge(pick)
  }

  // Always group by difficulty (preserves sort order regardless of active filters)
  const grouped = DIFF_ORDER.map((diff) => ({
    diff,
    challenges: filtered.filter((c) => c.difficulty === diff),
  })).filter(({ challenges }) => challenges.length > 0)

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors duration-150 mb-5"
        >
          ← Dashboard
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl font-bold text-white capitalize tracking-tight">{company}</h1>
            <span className="text-sm text-[--color-text-muted] tabular">
              {totalAttempted} / {data.challenges.length} attempted
            </span>
          </div>
          <button
            onClick={handleShuffle}
            title="Pick a random unattempted challenge from this company"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-mono text-violet-300 bg-violet-500/10 ring-1 ring-violet-500/20 hover:bg-violet-500/20 hover:text-violet-200 hover:ring-violet-500/40 transition-[background-color,color,box-shadow] duration-150 cursor-pointer shrink-0"
          >
            <span className="text-sm leading-none">⇄</span>
            shuffle
          </button>
        </div>
        {data.meta.role && (
          <p className="text-[--color-text-secondary] text-sm mt-1">{data.meta.role}</p>
        )}
      </div>

      {/* ── Filter bar ──────────────────────────────────────────────────────── */}
      <div className="mb-8 space-y-3">
        {/* Row 1: difficulty pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[--color-text-muted] w-16 shrink-0">
            Difficulty
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {DIFF_ORDER.map((diff) => {
              const active = filters.difficulties.has(diff)
              return (
                <button
                  key={diff}
                  onClick={() => toggleDifficulty(diff)}
                  className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-all duration-100 cursor-pointer ${
                    active
                      ? DIFF_PILL_ACTIVE[diff]
                      : 'text-[--color-text-muted] bg-white/[0.04] hover:bg-white/[0.07] hover:text-[--color-text-secondary]'
                  }`}
                >
                  {diff}
                </button>
              )
            })}
          </div>
        </div>

        {/* Row 2: tag pills */}
        {allTags.length > 0 && (
          <div className="flex items-start gap-2 flex-wrap">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[--color-text-muted] w-16 shrink-0 pt-1">
              Tags
            </span>
            <div className="flex gap-1.5 flex-wrap">
              {allTags.map((tag) => {
                const active = filters.tags.has(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`text-[10px] px-2 py-0.5 rounded font-mono uppercase tracking-wider transition-all duration-100 cursor-pointer ${
                      active
                        ? 'bg-violet-500/20 text-violet-300 ring-1 ring-violet-500/30'
                        : 'bg-white/[0.04] text-[--color-text-muted] hover:bg-white/[0.07] hover:text-[--color-text-secondary]'
                    }`}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Clear filters */}
        {isFiltered && (
          <div className="flex items-center gap-3 pt-0.5">
            <span className="text-[11px] text-[--color-text-muted]">
              {filtered.length} of {data.challenges.length} shown
            </span>
            <button
              onClick={clearFilters}
              className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors duration-100 underline underline-offset-2 cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* ── Preview modal ───────────────────────────────────────────────────── */}
      <ChallengeBriefModal
        challenge={previewChallenge}
        onClose={closePreview}
        onStart={handleModalStart}
        isStarting={previewStarting}
        attempts={previewAttempts}
        triggerRef={previewTriggerRef}
      />
      {previewError && (
        <p className="text-[10px] text-red-400 font-mono mt-2">{previewError}</p>
      )}

      {/* ── Challenge list — always grouped by difficulty ────────────────────── */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-[--color-text-muted]">No challenges match these filters.</p>
          <button
            onClick={clearFilters}
            className="mt-3 text-xs text-violet-400 hover:text-violet-300 underline underline-offset-2 transition-colors duration-100 cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {grouped.map(({ diff, challenges }) => (
            <section key={diff}>
              <h2
                className={`text-[10px] font-semibold uppercase tracking-[0.1em] mb-3 pl-3 border-l-2 ${DIFF_SECTION_ACCENT[diff]} ${DIFF_LABEL_COLOR[diff]}`}
              >
                {diff} · {challenges.length}
              </h2>
              <div className="space-y-px">
                {challenges.map((c) => (
                  <ChallengeRow key={c.id} challenge={c} company={company} onPreview={openPreview} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ChallengeRow ─────────────────────────────────────────────────────────────

function ChallengeRow({
  challenge: c,
  company,
  onPreview,
}: {
  challenge: Challenge
  company: string
  onPreview: (challenge: Challenge, trigger: HTMLButtonElement) => void
}) {
  const attempts = getChallengeAttempts(company, c.id)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function startChallenge() {
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/start-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, challengeId: c.id }),
      })
      const data = await res.json() as { folderName?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to create workspace')
      window.location.href = `/${company}/${data.folderName}`
    } catch (err: unknown) {
      setStatus('error')
      setErrorMsg((err as Error).message)
    }
  }

  return (
    <div className="flex items-center gap-4 px-3 py-2.5 rounded-lg hover:bg-[--color-surface] transition-colors duration-100 group">
      {/* ID */}
      <span className="w-7 shrink-0 text-right font-mono text-[11px] text-[--color-text-muted] tabular select-none">
        {String(c.id).padStart(2, '0')}
      </span>

      {/* Diff badge */}
      <span
        className={`text-[10px] px-2 py-px rounded-full font-medium shrink-0 ${DIFF_BADGE[c.difficulty]}`}
      >
        {c.difficulty}
      </span>

      {/* Title + tags */}
      <div className="flex-1 min-w-0">
        <button
          onClick={(e) => onPreview(c, e.currentTarget)}
          className="text-sm text-[--color-text-secondary] group-hover:text-[--color-text] hover:text-white transition-colors duration-100 leading-snug text-left cursor-pointer underline-offset-2 hover:underline decoration-[--color-border-hover]"
        >
          {c.title}
        </button>
        {c.tags.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {c.tags.map((tag) => (
              <span
                key={tag}
                className="text-[9px] px-1.5 py-px bg-white/[0.04] text-[--color-text-muted] rounded-sm font-mono uppercase tracking-wider"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        {status === 'error' && (
          <p className="text-[10px] text-red-400 mt-1 font-mono">{errorMsg}</p>
        )}
      </div>

      {/* Time budget */}
      <span className="relative z-10 text-[11px] font-mono text-[--color-text-muted] shrink-0 tabular">
        {c.time_budget_minutes}m
      </span>

      {/* Right side: attempts + start button */}
      <div className="relative z-10 flex items-center gap-1.5 shrink-0">
        {attempts.map((a) => {
          const isDone = isAttemptDone(company, a.folder)
          return (
            <Link
              key={a.folder}
              to={`/${company}/${a.folder}`}
              className={`text-[11px] px-1.5 py-px rounded font-mono ring-1 transition-[background-color,color] duration-100 ${
                isDone
                  ? 'text-green-400 bg-green-500/10 ring-green-500/20 hover:bg-green-500/20'
                  : 'text-violet-400 bg-violet-500/10 ring-violet-500/20 hover:bg-violet-500/20 hover:text-violet-300'
              }`}
            >
              {isDone ? `✓${a.attemptN}` : `#${a.attemptN}`}
            </Link>
          )
        })}

        {status === 'loading' ? (
          <span className="text-[11px] font-mono text-[--color-text-muted] animate-pulse px-2">
            installing…
          </span>
        ) : attempts.length === 0 ? (
          <button
            onClick={startChallenge}
            className="text-[11px] px-2.5 py-px rounded font-mono text-violet-300 bg-violet-500/10 ring-1 ring-violet-500/20 hover:bg-violet-500/20 hover:text-violet-200 transition-[background-color,color] duration-100 opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            start
          </button>
        ) : (
          <button
            onClick={startChallenge}
            aria-label={`Start new attempt for ${c.title}`}
            className="text-[11px] w-5 h-5 flex items-center justify-center rounded font-mono text-[--color-text-muted] hover:text-violet-300 hover:bg-violet-500/10 transition-[background-color,color] duration-100 opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            +
          </button>
        )}
      </div>
    </div>
  )
}
