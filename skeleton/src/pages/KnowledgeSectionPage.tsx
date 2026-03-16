import { useParams, Link, useSearchParams } from 'react-router-dom'
import { useState, useMemo, useRef, useEffect } from 'react'
import {
  getKnowledgeSectionData,
  getKnowledgeChallengeAttempts,
  getAllKnowledgeAttempts,
  isKnowledgeAttemptDone,
} from '../data'
import type { KnowledgeChallenge, KnowledgeAttemptInfo } from '../types'
import KnowledgeChallengeBriefModal from '../components/KnowledgeChallengeBriefModal'

// ─── KnowledgeSectionPage ────────────────────────────────────────────────────

export default function KnowledgeSectionPage() {
  const { section = '' } = useParams()
  const data = getKnowledgeSectionData(section)

  const allTags = useMemo(
    () => (data ? [...new Set(data.challenges.flatMap((c) => c.tags))].sort() : []),
    [data],
  )

  const [activeTags, setActiveTags] = useState<Set<string>>(new Set())
  const isFiltered = activeTags.size > 0

  // ── Preview modal state ──────────────────────────────────────────────────
  const [previewChallenge, setPreviewChallenge] = useState<KnowledgeChallenge | null>(null)
  const [previewStarting, setPreviewStarting] = useState(false)
  const [previewError, setPreviewError] = useState('')
  const previewTriggerRef = useRef<HTMLButtonElement | null>(null)
  const previewAttempts = useMemo(
    () => getKnowledgeChallengeAttempts(section, previewChallenge?.id ?? -1),
    [section, previewChallenge?.id],
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

  function handleShuffle() {
    if (!data) return
    const attemptedIds = new Set(
      getAllKnowledgeAttempts()
        .filter((a) => a.section === section)
        .map((a) => a.challengeId),
    )
    const pool = data.challenges.filter((c) => !attemptedIds.has(c.id))
    const source = pool.length > 0 ? pool : data.challenges
    const pick = source[Math.floor(Math.random() * source.length)]
    if (pick) setPreviewChallenge(pick)
  }

  function openPreview(challenge: KnowledgeChallenge, trigger: HTMLButtonElement) {
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
      const res = await fetch('/api/start-knowledge-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, challengeId: previewChallenge.id }),
      })
      const json = await res.json() as { folderName?: string; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to create workspace')
      window.location.href = `/knowledge/${section}/${json.folderName}`
    } catch (err: unknown) {
      setPreviewStarting(false)
      setPreviewError((err as Error).message)
    }
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-[--color-text-secondary] text-sm mb-3">
            Section{' '}
            <code className="text-violet-400 font-mono bg-violet-500/10 px-1.5 py-0.5 rounded text-xs">
              {section}
            </code>{' '}
            not found
          </p>
          <Link
            to="/knowledge"
            className="text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors duration-150 underline underline-offset-2"
          >
            ← Knowledge
          </Link>
        </div>
      </div>
    )
  }

  const filtered = useMemo(
    () =>
      activeTags.size === 0
        ? data.challenges
        : data.challenges.filter((c) => c.tags.some((t) => activeTags.has(t))),
    [data.challenges, activeTags],
  )

  const totalAttempted = new Set(
    data.challenges.flatMap((c) =>
      getKnowledgeChallengeAttempts(section, c.id).length > 0 ? [c.id] : [],
    ),
  ).size

  function toggleTag(tag: string) {
    setActiveTags((prev) => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  function clearFilters() {
    setActiveTags(new Set())
  }

  return (
    <div className="min-h-screen max-w-4xl mx-auto px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <Link
          to="/knowledge"
          className="inline-flex items-center gap-1 text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors duration-150 mb-5"
        >
          ← Knowledge
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-4">
            <h1 className="text-2xl font-bold text-white tracking-tight">{data.meta.title}</h1>
            <span className="text-sm text-[--color-text-muted] tabular">
              {totalAttempted} / {data.challenges.length} attempted
            </span>
          </div>
          <button
            onClick={handleShuffle}
            title="Pick a random unattempted challenge from this section"
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-mono text-violet-300 bg-violet-500/10 ring-1 ring-violet-500/20 hover:bg-violet-500/20 hover:text-violet-200 hover:ring-violet-500/40 transition-[background-color,color,box-shadow] duration-150 cursor-pointer shrink-0"
          >
            <span className="text-sm leading-none">⇄</span>
            shuffle
          </button>
        </div>
        <p className="text-[--color-text-secondary] text-sm mt-1">{data.meta.description}</p>
        {data.meta.source && (
          <a
            href={data.meta.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors duration-100 mt-1 inline-block"
          >
            {data.meta.source} ↗
          </a>
        )}
      </div>

      {/* Tag filters */}
      {allTags.length > 0 && (
        <div className="mb-8 flex items-start gap-2 flex-wrap">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[--color-text-muted] w-10 shrink-0 pt-1">
            Tags
          </span>
          <div className="flex gap-1.5 flex-wrap">
            {allTags.map((tag) => {
              const active = activeTags.has(tag)
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
          {isFiltered && (
            <button
              onClick={clearFilters}
              className="text-[11px] text-violet-400 hover:text-violet-300 transition-colors duration-100 underline underline-offset-2 cursor-pointer ml-1"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* Preview modal */}
      <KnowledgeChallengeBriefModal
        challenge={previewChallenge}
        section={section}
        onClose={closePreview}
        onStart={handleModalStart}
        isStarting={previewStarting}
        attempts={previewAttempts}
        triggerRef={previewTriggerRef}
      />
      {previewError && (
        <p className="text-[10px] text-red-400 font-mono mt-2">{previewError}</p>
      )}

      {/* Challenge list */}
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
        <div className="space-y-px">
          {filtered.map((c) => (
            <KnowledgeChallengeRow
              key={c.id}
              challenge={c}
              section={section}
              onPreview={openPreview}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── KnowledgeChallengeRow ───────────────────────────────────────────────────

function KnowledgeChallengeRow({
  challenge: c,
  section,
  onPreview,
}: {
  challenge: KnowledgeChallenge
  section: string
  onPreview: (challenge: KnowledgeChallenge, trigger: HTMLButtonElement) => void
}) {
  const attempts = getKnowledgeChallengeAttempts(section, c.id)
  const latestAttempt = attempts[attempts.length - 1] as KnowledgeAttemptInfo | undefined
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function startChallenge() {
    setStatus('loading')
    setErrorMsg('')
    try {
      const res = await fetch('/api/start-knowledge-challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section, challengeId: c.id }),
      })
      const data = await res.json() as { folderName?: string; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to create workspace')
      window.location.href = `/knowledge/${section}/${data.folderName}`
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

      {/* Right side: attempts + start/new-attempt button */}
      <div className="flex items-center gap-1.5 shrink-0">
        {attempts.map((a) => {
          const isDone = isKnowledgeAttemptDone(section, a.folder)
          return (
            <Link
              key={a.folder}
              to={`/knowledge/${section}/${a.folder}`}
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

        {/* Quick-open latest attempt — only visible if there is one and start button is hidden */}
        {latestAttempt && status === 'idle' && (
          <Link
            to={`/knowledge/${section}/${latestAttempt.folder}`}
            tabIndex={-1}
            aria-label={`Open latest attempt for ${c.title}`}
            className="text-[11px] px-1.5 py-px rounded font-mono text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors duration-100 opacity-0 group-hover:opacity-100"
          >
            →
          </Link>
        )}
      </div>
    </div>
  )
}
