import type { WorkspaceSnapshot } from '../types'
import { validateWorkspaceSnapshot, WORKSPACE_VERSION } from '../domain/workspaceSchema'
import {
  seedAccounts,
  seedCalendar,
  seedCompetitorSnapshots,
  seedCompetitors,
  seedContent,
  seedGoal,
} from '../utils/mockData'

export const WORKSPACE_STORAGE_KEY = 'overlook-workspace-v4'

const legacyKeys = {
  content: 'overlook-content-v2',
  accounts: 'overlook-accounts-v2',
  goal: 'overlook-goal-v2',
  competitors: 'overlook-competitors-v2',
  competitorSnapshots: 'overlook-competitor-snapshots-v1',
  calendar: 'overlook-calendar-v2',
} as const

function parseStoredValue(key: string): unknown {
  const raw = window.localStorage.getItem(key)
  return raw ? JSON.parse(raw) : undefined
}

export function createSeedWorkspace(): WorkspaceSnapshot {
  return {
    version: WORKSPACE_VERSION,
    exportedAt: new Date().toISOString(),
    content: seedContent,
    accounts: seedAccounts,
    goal: seedGoal,
    competitors: seedCompetitors,
    competitorSnapshots: seedCompetitorSnapshots,
    calendar: seedCalendar,
  }
}

function loadLegacyWorkspace(): WorkspaceSnapshot | null {
  const hasLegacyData = Object.values(legacyKeys).some((key) => window.localStorage.getItem(key) !== null)
  if (!hasLegacyData) return null

  const candidate = {
    version: 3,
    exportedAt: new Date().toISOString(),
    content: parseStoredValue(legacyKeys.content) ?? seedContent,
    accounts: parseStoredValue(legacyKeys.accounts) ?? seedAccounts,
    goal: parseStoredValue(legacyKeys.goal) ?? seedGoal,
    competitors: parseStoredValue(legacyKeys.competitors) ?? seedCompetitors,
    competitorSnapshots: parseStoredValue(legacyKeys.competitorSnapshots) ?? seedCompetitorSnapshots,
    calendar: parseStoredValue(legacyKeys.calendar) ?? seedCalendar,
  }
  const result = validateWorkspaceSnapshot(candidate)
  return result.success ? result.data : null
}

export function loadWorkspace(): WorkspaceSnapshot {
  if (typeof window === 'undefined') return createSeedWorkspace()

  try {
    const raw = window.localStorage.getItem(WORKSPACE_STORAGE_KEY)
    if (raw) {
      const result = validateWorkspaceSnapshot(JSON.parse(raw))
      if (result.success) return result.data
    }

    const migrated = loadLegacyWorkspace()
    if (migrated) {
      window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }
  } catch {
    // Fall through to a known-good seed workspace.
  }

  return createSeedWorkspace()
}

export function persistWorkspace(snapshot: WorkspaceSnapshot) {
  window.localStorage.setItem(WORKSPACE_STORAGE_KEY, JSON.stringify(snapshot))
}
