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

/** Convert a challenge title to a URL/folder-safe slug. Must stay in sync with vite.config.ts. */
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

function companyFromKey(key: string): string | null {
  const m = key.match(/\/companies\/([^/]+)\//)
  return m?.[1] ?? null
}

function folderFromKey(key: string): string | null {
  const m = key.match(/\/solutions\/([^/]+)\//)
  return m?.[1] ?? null
}

/**
 * New folder format: "<slug>-<attemptN>"  e.g. "use-toggle-1", "character-counter-2"
 * The slug is derived from the challenge title so challengeId must be resolved
 * by cross-referencing the challenges list (see getChallengeByFolder / getKnowledgeChallengeByFolder).
 */
function parseFolder(folder: string): { slug: string; attemptN: number } | null {
  const m = folder.match(/^(.+)-(\d+)$/)
  if (!m) return null
  return { slug: m[1], attemptN: parseInt(m[2], 10) }
}

function sectionFromKey(key: string): string | null {
  const m = key.match(/\/knowledge\/([^/]+)\//)
  return m?.[1] ?? null
}

// ── Shuffle ────────────────────────────────────────────────────────────────

export interface ShufflePick {
  kind: 'company'
  company: string
  challengeId: number
  path: string           // navigate here, then open the modal
}

export interface KnowledgeShufflePick {
  kind: 'knowledge'
  section: KnowledgeSectionSlug
  challengeId: number
  path: string
}

export type AnyShufflePick = ShufflePick | KnowledgeShufflePick

/**
 * Pick a random unattempted challenge from all companies + knowledge sections.
 * Falls back to any challenge (including attempted ones) if everything has been tried.
 */
export function getShufflePick(): AnyShufflePick | null {
  const candidates: AnyShufflePick[] = []
  const attempted: AnyShufflePick[] = []

  // Company challenges
  for (const company of getCompanyNames()) {
    const data = getChallengesData(company)
    if (!data) continue
    for (const c of data.challenges) {
      const hasAttempt = getAllAttempts().some(
        (a) => a.company === company && a.challengeId === c.id,
      )
      const pick: ShufflePick = {
        kind: 'company',
        company,
        challengeId: c.id,
        path: `/${company}?shuffle=${c.id}`,
      }
      ;(hasAttempt ? attempted : candidates).push(pick)
    }
  }

  // Knowledge challenges
  for (const section of getKnowledgeSections()) {
    const data = getKnowledgeSectionData(section)
    if (!data) continue
    for (const c of data.challenges) {
      const hasAttempt = getAllKnowledgeAttempts().some(
        (a) => a.section === section && a.challengeId === c.id,
      )
      const pick: KnowledgeShufflePick = {
        kind: 'knowledge',
        section,
        challengeId: c.id,
        path: `/knowledge/${section}?shuffle=${c.id}`,
      }
      ;(hasAttempt ? attempted : candidates).push(pick)
    }
  }

  const pool = candidates.length > 0 ? candidates : attempted
  if (pool.length === 0) return null
  return pool[Math.floor(Math.random() * pool.length)]
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
    // Resolve challengeId by matching slug against the company's challenges list
    const data = getChallengesData(company)
    const challenge = data?.challenges.find(c => toSlug(c.title) === parsed.slug)
    if (!challenge) return []
    return [{ company, folder, challengeId: challenge.id, attemptN: parsed.attemptN }]
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

/** Look up a Challenge by its folder name (slug-based). Returns null if not found. */
export function getChallengeByFolder(company: string, folder: string): import('./types').Challenge | null {
  const parsed = parseFolder(folder)
  if (!parsed) return null
  const data = getChallengesData(company)
  return data?.challenges.find(c => toSlug(c.title) === parsed.slug) ?? null
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
    // Resolve challengeId by matching slug against the section's challenges list
    const data = getKnowledgeSectionData(section)
    const challenge = data?.challenges.find(c => toSlug(c.title) === parsed.slug)
    if (!challenge) return []
    return [{ section: section as KnowledgeSectionSlug, folder, challengeId: challenge.id, attemptN: parsed.attemptN }]
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

/** Look up a KnowledgeChallenge by its folder name (slug-based). Returns null if not found. */
export function getKnowledgeChallengeByFolder(section: string, folder: string): import('./types').KnowledgeChallenge | null {
  const parsed = parseFolder(folder)
  if (!parsed) return null
  const data = getKnowledgeSectionData(section)
  return data?.challenges.find(c => toSlug(c.title) === parsed.slug) ?? null
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
