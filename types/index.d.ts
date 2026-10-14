export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

export type Usage = { contextPercent?: number; limits: Limit[] }

export type Git = { branch: string; isDirty: boolean }

declare module 'claude-code' {
  interface PluginState {
    'status-band': {
      cwd: string | null
      git: Git | null
      model: string | null
      effort: string | null
      usage: Usage
      // The clock's time at the last minute tick, for the reset countdowns.
      now: number
    }
  }
}
