import { Link } from 'react-router-dom'
import { getKnowledgeSections, getKnowledgeSectionData, getKnowledgeSectionAttempts } from '../data'

const SECTION_ICON: Record<string, string> = {
  hooks: '⚡',
  ui: '🎨',
}

const SECTION_COLOR: Record<string, string> = {
  hooks: 'text-yellow-400 bg-yellow-500/10 ring-yellow-500/20',
  ui: 'text-blue-400 bg-blue-500/10 ring-blue-500/20',
}

export default function KnowledgePage() {
  const sections = getKnowledgeSections()

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-8 py-12">
      <header className="mb-10">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-xs text-[--color-text-muted] hover:text-[--color-text-secondary] transition-colors duration-150 mb-5"
        >
          ← Dashboard
        </Link>
        <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Knowledge</h1>
        <p className="text-[--color-text-secondary] text-sm">
          General React knowledge drills — hooks and UI patterns.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((section) => (
          <SectionCard key={section} section={section} />
        ))}
      </div>
    </div>
  )
}

function SectionCard({ section }: { section: string }) {
  const data = getKnowledgeSectionData(section)
  const attempts = getKnowledgeSectionAttempts(section)
  const attempted = new Set(attempts.map((a) => a.challengeId)).size
  const total = data?.challenges.length ?? 0
  const pct = total > 0 ? Math.round((attempted / total) * 100) : 0

  const icon = SECTION_ICON[section] ?? '📚'
  const color = SECTION_COLOR[section] ?? 'text-violet-400 bg-violet-500/10 ring-violet-500/20'

  return (
    <Link
      to={`/knowledge/${section}`}
      className="group relative flex flex-col p-5 rounded-xl border border-[--color-border] bg-[--color-surface] hover:border-[--color-border-hover] hover:bg-[--color-surface-hover] transition-[border-color,background-color] duration-150"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={`text-xs px-2 py-1 rounded-md font-mono ring-1 ${color}`}>
            {icon} {section}
          </span>
        </div>
        <span className="text-[--color-text-muted] opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-sm shrink-0 ml-2">
          →
        </span>
      </div>

      {data?.meta.title && (
        <h2 className="text-sm font-semibold text-white tracking-tight group-hover:text-violet-300 transition-colors duration-150 mb-1">
          {data.meta.title}
        </h2>
      )}
      {data?.meta.description && (
        <p className="text-[11px] text-[--color-text-muted] mb-4 leading-relaxed">
          {data.meta.description}
        </p>
      )}

      {/* Progress */}
      <div className="mt-auto">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs text-[--color-text-muted] tabular">
            {attempted} / {total}
          </span>
          <span className="text-xs font-mono text-[--color-text-muted] tabular">{pct}%</span>
        </div>
        <div className="h-1 bg-[--color-border] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-out"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? 'var(--color-warm-up)' : 'var(--color-accent)',
            }}
          />
        </div>
      </div>

      {attempts.length > 0 && (
        <p className="mt-3 text-[10px] text-[--color-text-muted] tabular">
          {attempts.length} total {attempts.length === 1 ? 'attempt' : 'attempts'}
        </p>
      )}
    </Link>
  )
}
