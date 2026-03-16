import { useEffect, useRef } from 'react'
import type { KnowledgeChallenge, KnowledgeAttemptInfo } from '../types'

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  challenge: KnowledgeChallenge | null
  section: string
  onClose: () => void
  onStart: () => void
  isStarting: boolean
  attempts: KnowledgeAttemptInfo[]
  triggerRef: React.RefObject<HTMLButtonElement | null>
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function KnowledgeChallengeBriefModal({
  challenge,
  onClose,
  onStart,
  isStarting,
  attempts,
  triggerRef,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null)

  // Open / close the native dialog in sync with the challenge prop
  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (challenge) {
      if (!el.open) el.showModal()
    } else {
      if (el.open) {
        el.close()
        triggerRef.current?.focus()
      }
    }
  }, [challenge, triggerRef])

  // Close on backdrop click (click lands directly on the <dialog> element)
  function handleDialogClick(e: React.MouseEvent<HTMLDialogElement>) {
    if (e.target === dialogRef.current) onClose()
  }

  // Native 'cancel' event fires on Escape — sync state back
  function handleCancel(e: React.SyntheticEvent<HTMLDialogElement>) {
    e.preventDefault()
    onClose()
  }

  if (!challenge) return null

  const hasAttempts = attempts.length > 0

  return (
    <dialog
      ref={dialogRef}
      onClick={handleDialogClick}
      onCancel={handleCancel}
      aria-labelledby="knowledge-brief-modal-title"
      aria-modal="true"
      className="modal"
    >
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b border-[--color-border-hover] shrink-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono text-[--color-text-muted] tabular">
              #{String(challenge.id).padStart(2, '0')}
            </span>
          </div>
          <h2
            id="knowledge-brief-modal-title"
            className="text-base font-semibold text-white leading-snug tracking-tight"
          >
            {challenge.title}
          </h2>
          {challenge.tags.length > 0 && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {challenge.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] px-1.5 py-px bg-white/[0.04] text-[--color-text-muted] rounded-sm font-mono uppercase tracking-wider"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          aria-label="Close preview"
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-[--color-text-muted] hover:text-[--color-text-secondary] hover:bg-white/[0.06] transition-[color,background-color] duration-150 text-lg leading-none cursor-pointer touch-manipulation"
        >
          ×
        </button>
      </div>

      {/* ── Body (scrollable) ──────────────────────────────────────── */}
      <div className="overflow-y-auto px-6 py-5 space-y-5 flex-1 [scrollbar-width:thin] [scrollbar-color:var(--color-border)_transparent]">

        {/* Prompt / task */}
        <p className="text-[--color-text-secondary] text-sm leading-relaxed">
          {challenge.prompt}
        </p>

        {/* Required */}
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[--color-text-muted] mb-2">
            Required
          </h3>
          <ul className="space-y-1.5">
            {challenge.required.map((req, i) => (
              <li key={i} className="flex items-start gap-2 text-[--color-text-secondary] text-[13px] leading-snug">
                <span className="mt-px text-[--color-text-muted] select-none shrink-0">○</span>
                {req}
              </li>
            ))}
          </ul>
        </div>

        {/* Bonus */}
        {challenge.bonus.length > 0 && (
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[--color-text-muted] mb-2">
              Bonus
            </h3>
            <ul className="space-y-1.5">
              {challenge.bonus.map((bon, i) => (
                <li key={i} className="flex items-start gap-2 text-[--color-text-muted] text-[13px] leading-snug">
                  <span className="mt-px select-none shrink-0">+</span>
                  {bon}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Demo description */}
        <div className="border-l-2 border-violet-500/30 pl-3">
          <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-violet-400/70 mb-1.5">
            Demo
          </h3>
          <p className="text-[--color-text-muted] text-[13px] leading-relaxed italic">
            {challenge.demo}
          </p>
        </div>
      </div>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[--color-border-hover] shrink-0">
        <button
          onClick={onClose}
          className="text-xs px-3 py-1.5 rounded-md ring-1 ring-[--color-border-hover] text-[--color-text-muted] hover:text-[--color-text-secondary] hover:ring-white/20 transition-[color,box-shadow] duration-150 cursor-pointer touch-manipulation"
        >
          Close
        </button>

        {isStarting ? (
          <span className="text-xs font-mono text-[--color-text-muted] animate-pulse px-3 py-1.5">
            installing…
          </span>
        ) : (
          <button
            onClick={onStart}
            className="text-xs px-3 py-1.5 rounded-md font-mono text-violet-300 bg-violet-500/10 ring-1 ring-violet-500/30 hover:bg-violet-500/20 hover:text-violet-200 transition-[background-color,color,box-shadow] duration-150 cursor-pointer touch-manipulation"
          >
            {hasAttempts ? '+ new attempt' : 'start'}
          </button>
        )}
      </div>
    </dialog>
  )
}
