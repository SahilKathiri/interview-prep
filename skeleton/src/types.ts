export type Difficulty = 'warm-up' | 'medium' | 'hard'

export interface Challenge {
  id: number
  title: string
  difficulty: Difficulty
  time_budget_minutes: number
  tags: string[]
  prompt: string
  required: string[]
  bonus: string[]
  interviewer_focus: string
}

export interface ChallengesData {
  meta: {
    candidate: string
    role: string
    company?: string
    total: number
    instructions: string
  }
  challenges: Challenge[]
}

export interface AttemptInfo {
  company: string
  folder: string       // e.g. "character-counter-1", "use-debounce-2"
  challengeId: number
  attemptN: number
}

// ── Knowledge ────────────────────────────────────────────────────────────────

export type KnowledgeSectionSlug = 'hooks' | 'ui'

export interface KnowledgeChallenge {
  id: number
  title: string
  tags: string[]
  prompt: string
  required: string[]
  bonus: string[]
  /** Human-readable description of the demo component. */
  demo: string
  /** hooks section only: TypeScript function stubs to scaffold (one string per function). */
  stubs?: string[]
  /** hooks section only: Pre-written React demo component source that calls the hook. */
  demoCode?: string
}

export interface KnowledgeSectionData {
  meta: {
    section: KnowledgeSectionSlug
    title: string
    description: string
    total: number
    source?: string
    instructions: string
  }
  challenges: KnowledgeChallenge[]
}

export interface KnowledgeAttemptInfo {
  section: KnowledgeSectionSlug
  folder: string       // e.g. "use-toggle-1", "accordion-1"
  challengeId: number
  attemptN: number
}
