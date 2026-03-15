import type { ChallengesData, AttemptInfo, KnowledgeSectionData, KnowledgeAttemptInfo, KnowledgeSectionSlug } from './types'

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

// ── Knowledge globs ────────────────────────────────────────────────────────

export const knowledgeFiles = import.meta.glob<KnowledgeSectionData>(
  '../../knowledge/*/challenges.json',
  { eager: true, import: 'default' },
)

export const knowledgeSolutionLoaders = import.meta.glob(
  '../../knowledge/*/solutions/*/src/App.tsx',
)

export const knowledgeChallengeMds = import.meta.glob<string>(
  '../../knowledge/*/solutions/*/CHALLENGE.md',
  { query: '?raw', import: 'default', eager: true },
)

export const knowledgeDoneMarkers = import.meta.glob(
  '../../knowledge/*/solutions/*/done',
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

function sectionFromKey(key: string): string | null {
  const m = key.match(/\/knowledge\/([^/]+)\//)
  return m?.[1] ?? null
}

// ── Company public API ─────────────────────────────────────────────────────

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

// ── Knowledge public API ───────────────────────────────────────────────────

export function getKnowledgeSections(): KnowledgeSectionSlug[] {
  return Object.keys(knowledgeFiles)
    .map(sectionFromKey)
    .filter((s): s is KnowledgeSectionSlug => s !== null)
}

export function getKnowledgeSectionData(section: string): KnowledgeSectionData | null {
  const key = Object.keys(knowledgeFiles).find(k =>
    k.includes(`/knowledge/${section}/challenges.json`),
  )
  return key ? knowledgeFiles[key] : null
}

export function getAllKnowledgeAttempts(): KnowledgeAttemptInfo[] {
  return Object.keys(knowledgeSolutionLoaders).flatMap((key) => {
    const section = sectionFromKey(key)
    const folder = folderFromKey(key)
    if (!section || !folder) return []
    const parsed = parseFolder(folder)
    if (!parsed) return []
    return [{ section: section as KnowledgeSectionSlug, folder, ...parsed }]
  })
}

export function getKnowledgeSectionAttempts(section: string): KnowledgeAttemptInfo[] {
  return getAllKnowledgeAttempts().filter((a) => a.section === section)
}

export function getKnowledgeChallengeAttempts(section: string, challengeId: number): KnowledgeAttemptInfo[] {
  return getAllKnowledgeAttempts().filter(
    (a) => a.section === section && a.challengeId === challengeId,
  )
}

export function getKnowledgeChallengeMd(section: string, folder: string): string | null {
  const key = Object.keys(knowledgeChallengeMds).find((k) =>
    k.includes(`/knowledge/${section}/solutions/${folder}/CHALLENGE.md`),
  )
  return key ? knowledgeChallengeMds[key] ?? null : null
}

export function isKnowledgeAttemptDone(section: string, folder: string): boolean {
  return Object.keys(knowledgeDoneMarkers).some((k) =>
    k.includes(`/knowledge/${section}/solutions/${folder}/done`),
  )
}

export function getKnowledgeSolutionLoader(section: string, folder: string) {
  const key = Object.keys(knowledgeSolutionLoaders).find((k) =>
    k.includes(`/knowledge/${section}/solutions/${folder}/src/App.tsx`),
  )
  return key ? knowledgeSolutionLoaders[key] : null
}
