import type { ChallengesData, AttemptInfo } from './types'

// ── Globs ──────────────────────────────────────────────────────────────────
// All paths are relative to this file (skeleton/src/data.ts)
// → ../../ resolves to interview-prep/

export const challengeFiles = import.meta.glob<ChallengesData>(
  '../../companies/*/challenges.json',
  { eager: true, import: 'default' },
)

export const solutionLoaders = import.meta.glob(
  '../../companies/*/solutions/*/src/App.tsx',
)

export const challengeMds = import.meta.glob<string>(
  '../../companies/*/solutions/*/CHALLENGE.md',
  { query: '?raw', import: 'default', eager: true },
)

export const doneMarkers = import.meta.glob(
  '../../companies/*/solutions/*/done',
  { eager: true },
)

// ── Helpers ────────────────────────────────────────────────────────────────

function companyFromKey(key: string): string | null {
  const m = key.match(/\/companies\/([^/]+)\//)
  return m?.[1] ?? null
}

function folderFromKey(key: string): string | null {
  const m = key.match(/\/solutions\/([^/]+)\//)
  return m?.[1] ?? null
}

function parseFolder(folder: string): { challengeId: number; attemptN: number } | null {
  const m = folder.match(/^challenge-(\d+)-attempt-(\d+)$/)
  if (!m) return null
  return { challengeId: parseInt(m[1], 10), attemptN: parseInt(m[2], 10) }
}

// ── Public API ─────────────────────────────────────────────────────────────

export function getCompanyNames(): string[] {
  return [...new Set(
    Object.keys(challengeFiles)
      .map(companyFromKey)
      .filter((c): c is string => c !== null),
  )]
}

export function getChallengesData(company: string): ChallengesData | null {
  const key = Object.keys(challengeFiles).find(k =>
    k.includes(`/companies/${company}/challenges.json`),
  )
  return key ? challengeFiles[key] : null
}

export function getAllAttempts(): AttemptInfo[] {
  return Object.keys(solutionLoaders).flatMap((key) => {
    const company = companyFromKey(key)
    const folder = folderFromKey(key)
    if (!company || !folder) return []
    const parsed = parseFolder(folder)
    if (!parsed) return []
    return [{ company, folder, ...parsed }]
  })
}

export function getCompanyAttempts(company: string): AttemptInfo[] {
  return getAllAttempts().filter((a) => a.company === company)
}

export function getChallengeAttempts(company: string, challengeId: number): AttemptInfo[] {
  return getAllAttempts().filter(
    (a) => a.company === company && a.challengeId === challengeId,
  )
}

export function getChallengeMd(company: string, folder: string): string | null {
  const key = Object.keys(challengeMds).find((k) =>
    k.includes(`/companies/${company}/solutions/${folder}/CHALLENGE.md`),
  )
  return key ? challengeMds[key] ?? null : null
}

export function isAttemptDone(company: string, folder: string): boolean {
  return Object.keys(doneMarkers).some((k) =>
    k.includes(`/companies/${company}/solutions/${folder}/done`),
  )
}

export function getSolutionLoader(company: string, folder: string) {
  const key = Object.keys(solutionLoaders).find((k) =>
    k.includes(`/companies/${company}/solutions/${folder}/src/App.tsx`),
  )
  return key ? solutionLoaders[key] : null
}
