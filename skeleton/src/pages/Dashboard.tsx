import { Link } from 'react-router-dom'
import { getCompanyNames, getChallengesData, getCompanyAttempts, getKnowledgeSections, getKnowledgeSectionData, getKnowledgeSectionAttempts } from '../data'
import type { Difficulty } from '../types'

const DIFF_BG: Record<Difficulty, string> = {
  'warm-up': 'bg-green-500/10 text-green-400 ring-1 ring-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-400 ring-1 ring-yellow-500/20',
  hard: 'bg-red-500/10 text-red-400 ring-1 ring-red-500/20',
}

export default function Dashboard() {
  const companies = getCompanyNames()
  const knowledgeSections = getKnowledgeSections()

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-8 py-12">
      <header className="mb-12">
        <div className="flex items-baseline gap-3 mb-2">
          <h1 className="text-xl font-semibold tracking-tight text-white">
            Interview Prep
          </h1>
          <span className="text-[11px] font-mono text-[--color-text-muted] uppercase tracking-widest">
            v1
          </span>
        </div>
        <p className="text-[--color-text-secondary] text-sm">
          {companies.length === 0
            ? 'No companies yet — run /scaffold-company in Claude Code'
            : `${companies.length} ${companies.length === 1 ? 'company' : 'companies'}`}
        </p>
      </header>

      {/* Knowledge section */}
      {knowledgeSections.length > 0 && (
        <div className="mb-8">
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[--color-text-muted] mb-3">
            Knowledge
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <KnowledgeCard sections={knowledgeSections} />
          </div>
        </div>
      )}

      {/* Companies */}
      {companies.length === 0 ? (
        <div className="border border-[--color-border] rounded-xl p-10 text-center">
          <p className="text-[--color-text-secondary] text-sm mb-1">No companies configured</p>
          <p className="text-[--color-text-muted] text-xs">
            Open Claude Code and run{' '}
            <code className="text-violet-400 font-mono">/scaffold-company</code>
          </p>
        </div>
      ) : (
        <>
          <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[--color-text-muted] mb-3">
            Companies
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {companies.map((company) => (
              <CompanyCard key={company} company={company} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function CompanyCard({ company }: { company: string }) {
  const data = getChallengesData(company)
  const attempts = getCompanyAttempts(company)
  const attempted = new Set(attempts.map((a) => a.challengeId)).size
  const total = data?.challenges.length ?? 0

  const byChallengeId = new Map<number, number>()
  for (const a of attempts) {
    byChallengeId.set(a.challengeId, (byChallengeId.get(a.challengeId) ?? 0) + 1)
  }

  const diffCounts: Record<Difficulty, number> = { 'warm-up': 0, medium: 0, hard: 0 }
  for (const c of data?.challenges ?? []) {
    if (byChallengeId.has(c.id)) diffCounts[c.difficulty]++
  }

  const pct = total > 0 ? Math.round((attempted / total) * 100) : 0
  const hasAttempts = attempts.length > 0

  return (
    <Link
      to={`/${company}`}
      className="group relative flex flex-col p-5 rounded-xl border border-[--color-border] bg-[--color-surface] hover:border-[--color-border-hover] hover:bg-[--color-surface-hover] transition-[border-color,background-color] duration-150"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-white capitalize tracking-tight group-hover:text-violet-300 transition-colors duration-150 truncate">
            {company}
          </h2>
          {data?.meta.role && (
            <p className="text-[11px] text-[--color-text-muted] mt-0.5 truncate">
              {data.meta.role}
            </p>
          )}
        </div>
        <span className="text-[--color-text-muted] opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-sm shrink-0 ml-2">
          →
        </span>
      </div>

      {/* Progress */}
      <div className="mb-4">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs text-[--color-text-muted] tabular">
            {attempted} / {total}
          </span>
          <span className="text-xs font-mono text-[--color-text-muted] tabular">
            {pct}%
          </span>
        </div>
        <div className="h-1 bg-[--color-border] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-out"
            style={{
              width: `${pct}%`,
              background: pct === 100
                ? 'var(--color-warm-up)'
                : 'var(--color-accent)',
            }}
          />
        </div>
      </div>

      {/* Diff breakdown */}
      <div className="flex gap-1.5 flex-wrap">
        {(Object.entries(diffCounts) as [Difficulty, number][]).map(
          ([d, count]) =>
            count > 0 ? (
              <span
                key={d}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${DIFF_BG[d]}`}
              >
                {count} {d}
              </span>
            ) : null,
        )}
      </div>

      {hasAttempts && (
        <p className="mt-3 text-[10px] text-[--color-text-muted] tabular">
          {attempts.length} total {attempts.length === 1 ? 'attempt' : 'attempts'}
        </p>
      )}
    </Link>
  )
}

// ── KnowledgeCard ────────────────────────────────────────────────────────────

const SECTION_ICON: Record<string, string> = { hooks: '⚡', ui: '🎨' }

function KnowledgeCard({ sections }: { sections: string[] }) {
  const totalChallenges = sections.reduce((acc, s) => {
    return acc + (getKnowledgeSectionData(s)?.challenges.length ?? 0)
  }, 0)
  const totalAttempted = sections.reduce((acc, s) => {
    const attempts = getKnowledgeSectionAttempts(s)
    return acc + new Set(attempts.map((a) => `${s}:${a.challengeId}`)).size
  }, 0)
  const pct = totalChallenges > 0 ? Math.round((totalAttempted / totalChallenges) * 100) : 0

  return (
    <Link
      to="/knowledge"
      className="group relative flex flex-col p-5 rounded-xl border border-[--color-border] bg-[--color-surface] hover:border-[--color-border-hover] hover:bg-[--color-surface-hover] transition-[border-color,background-color] duration-150"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex gap-1.5 flex-wrap">
          {sections.map((s) => (
            <span
              key={s}
              className="text-[10px] px-2 py-0.5 rounded font-mono bg-white/[0.04] text-[--color-text-muted] ring-1 ring-white/[0.06]"
            >
              {SECTION_ICON[s] ?? '📚'} {s}
            </span>
          ))}
        </div>
        <span className="text-[--color-text-muted] opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-sm shrink-0 ml-2">
          →
        </span>
      </div>

      <h2 className="text-sm font-semibold text-white tracking-tight group-hover:text-violet-300 transition-colors duration-150 mb-1">
        Knowledge
      </h2>
      <p className="text-[11px] text-[--color-text-muted] mb-4 leading-relaxed">
        React hooks & UI patterns — implement from scratch.
      </p>

      <div className="mt-auto">
        <div className="flex justify-between items-baseline mb-1.5">
          <span className="text-xs text-[--color-text-muted] tabular">
            {totalAttempted} / {totalChallenges}
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
    </Link>
  )
}
