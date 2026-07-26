import { describe, expect, it } from 'vitest'

import { createSeedWorkspace } from '../storage/workspaceStorage'
import { validateWorkspaceSnapshot, WORKSPACE_VERSION } from './workspaceSchema'

describe('validateWorkspaceSnapshot', () => {
  it('accepts the current workspace and normalizes its version', () => {
    const result = validateWorkspaceSnapshot({ ...createSeedWorkspace(), version: 3 })

    expect(result.success).toBe(true)
    if (result.success) expect(result.data.version).toBe(WORKSPACE_VERSION)
  })

  it('rejects malformed nested content instead of accepting the top-level shape', () => {
    const workspace = createSeedWorkspace()
    const result = validateWorkspaceSnapshot({
      ...workspace,
      content: [{ ...workspace.content[0], views: 'many' }],
    })

    expect(result.success).toBe(false)
    if (!result.success) expect(result.errors[0]).toContain('内容第 1 项')
  })

  it('rejects impossible calendar dates', () => {
    const workspace = createSeedWorkspace()
    const result = validateWorkspaceSnapshot({
      ...workspace,
      content: [{ ...workspace.content[0], publishedAt: '2026-99-31' }],
    })

    expect(result.success).toBe(false)
  })

  it('migrates older backups that did not contain snapshots or calendar data', () => {
    const workspace = createSeedWorkspace()
    const result = validateWorkspaceSnapshot({
      version: 2,
      exportedAt: workspace.exportedAt,
      content: workspace.content,
      accounts: workspace.accounts,
      goal: workspace.goal,
      competitors: workspace.competitors,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.competitorSnapshots).toEqual([])
      expect(result.data.calendar).toEqual([])
    }
  })
})
