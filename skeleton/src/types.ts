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
  folder: string       // "challenge-01-attempt-1"
  challengeId: number
  attemptN: number
}
