import { useCallback, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'

import type {
  CalendarItem,
  Competitor,
  CompetitorSnapshot,
  ContentItem,
  WorkspaceSnapshot,
} from '../types'
import { WORKSPACE_VERSION } from '../domain/workspaceSchema'
import { createSeedWorkspace, loadWorkspace, persistWorkspace } from '../storage/workspaceStorage'
import { makeId } from '../utils/dashboardHelpers'
import { normalizeContentItem } from '../utils/importHelpers'
import { useLocalStorage } from './useLocalStorage'

export type WorkspaceUndo = {
  label: string
  capturedAt: string
  snapshot: WorkspaceSnapshot
}

type WorkspaceSlice = 'content' | 'accounts' | 'goal' | 'competitors' | 'competitorSnapshots' | 'calendar'

function withTimestamp(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  return {
    ...snapshot,
    version: WORKSPACE_VERSION,
    exportedAt: new Date().toISOString(),
  }
}

export function useWorkspaceState() {
  const [workspace, setWorkspace] = useState<WorkspaceSnapshot>(loadWorkspace)
  const workspaceRef = useRef(workspace)
  const [hideSensitiveInReport, setHideSensitiveInReport] = useLocalStorage<boolean>(
    'overlook-hide-sensitive-report-v1',
    false,
  )
  const [lastWorkspaceUndo, setLastWorkspaceUndo] = useState<WorkspaceUndo | null>(null)

  const commitWorkspace = useCallback((next: WorkspaceSnapshot | ((current: WorkspaceSnapshot) => WorkspaceSnapshot)) => {
    const current = workspaceRef.current
    const candidate = withTimestamp(typeof next === 'function' ? next(current) : next)
    try {
      persistWorkspace(candidate)
      workspaceRef.current = candidate
      setWorkspace(candidate)
      return true
    } catch {
      toast.error('本地存储空间不足，修改未保存')
      return false
    }
  }, [])

  const updateSlice = <K extends WorkspaceSlice>(key: K, next: SetStateAction<WorkspaceSnapshot[K]>) =>
    commitWorkspace((current) => ({
      ...current,
      [key]: typeof next === 'function' ? next(current[key]) : next,
    }))

  const createSliceSetter =
    <K extends WorkspaceSlice>(key: K): Dispatch<SetStateAction<WorkspaceSnapshot[K]>> =>
    (next) => {
      updateSlice(key, next)
    }

  const setContent = createSliceSetter('content')
  const setAccounts = createSliceSetter('accounts')
  const setGoal = createSliceSetter('goal')
  const setCompetitors = createSliceSetter('competitors')
  const setCompetitorSnapshots = createSliceSetter('competitorSnapshots')
  const setCalendar = createSliceSetter('calendar')
  const updateContent = (next: SetStateAction<ContentItem[]>) => updateSlice('content', next)
  const updateCalendar = (next: SetStateAction<CalendarItem[]>) => updateSlice('calendar', next)

  const createWorkspaceSnapshot = useCallback(
    (): WorkspaceSnapshot => ({
      ...workspaceRef.current,
      version: WORKSPACE_VERSION,
      exportedAt: new Date().toISOString(),
      content: workspaceRef.current.content.map(normalizeContentItem),
    }),
    [],
  )

  const applyWorkspaceSnapshot = useCallback(
    (snapshot: WorkspaceSnapshot) =>
      commitWorkspace({
        ...snapshot,
        content: snapshot.content.map(normalizeContentItem),
      }),
    [commitWorkspace],
  )

  const captureWorkspaceUndo = useCallback(
    (label: string) => {
      setLastWorkspaceUndo({
        label,
        capturedAt: new Date().toISOString(),
        snapshot: createWorkspaceSnapshot(),
      })
    },
    [createWorkspaceSnapshot],
  )

  const restoreLastWorkspaceUndo = useCallback(() => {
    if (!lastWorkspaceUndo) return
    const currentSnapshot = createWorkspaceSnapshot()
    if (applyWorkspaceSnapshot(lastWorkspaceUndo.snapshot)) {
      setLastWorkspaceUndo({
        label: '撤销前状态',
        capturedAt: new Date().toISOString(),
        snapshot: currentSnapshot,
      })
      toast.success('已恢复到上一个工作区状态')
    }
  }, [applyWorkspaceSnapshot, createWorkspaceSnapshot, lastWorkspaceUndo])

  const resetWorkspace = () => {
    captureWorkspaceUndo('恢复示例前状态')
    if (applyWorkspaceSnapshot(createSeedWorkspace())) toast.success('示例工作区已恢复，可在“账号”页撤销')
  }

  const addContent = (item: Omit<ContentItem, 'id'>) => {
    const normalized = normalizeContentItem({
      ...item,
      id: makeId('manual'),
      title: item.title.trim(),
      hook: item.hook.trim() || item.title.trim(),
    } as ContentItem)
    if (updateContent((current) => [normalized, ...current])) toast.success('内容已加入看板')
  }

  const removeContent = (id: string) => {
    captureWorkspaceUndo('删除内容前状态')
    if (updateContent((current) => current.filter((item) => item.id !== id))) {
      toast.success('内容已删除，可在“账号”页撤销')
    }
  }

  const addCompetitor = (competitor: Competitor) => {
    setCompetitors((current) => [competitor, ...current])
    toast.success('对标账号已加入')
  }

  const removeCompetitor = (id: string) => {
    captureWorkspaceUndo('删除竞品前状态')
    const saved = commitWorkspace((current) => ({
      ...current,
      competitors: current.competitors.filter((item) => item.id !== id),
      competitorSnapshots: current.competitorSnapshots.filter((snapshot) => snapshot.competitorId !== id),
    }))
    if (saved) toast.success('对标账号及其快照已删除，可在“账号”页撤销')
  }

  const toggleCalendarStatus = (id: string) => {
    setCalendar((current) =>
      current.map((entry) => {
        if (entry.id !== id) return entry
        const order: CalendarItem['status'][] = ['draft', 'scheduled', 'done']
        return { ...entry, status: order[(order.indexOf(entry.status) + 1) % order.length] }
      }),
    )
  }

  const captureCompetitorSnapshotsAction = () => {
    if (workspaceRef.current.competitors.length === 0) {
      toast.error('请先添加至少一个对标账号')
      return
    }
    const capturedAt = new Date().toISOString()
    const today = capturedAt.slice(0, 10)
    const snapshots: CompetitorSnapshot[] = workspaceRef.current.competitors.map((competitor) => ({
      id: makeId('snapshot'),
      competitorId: competitor.id,
      date: today,
      capturedAt,
      followers: competitor.followers,
      avgViews: competitor.avgViews,
      engagementRate: competitor.engagementRate,
    }))
    setCompetitorSnapshots((current) => [...snapshots, ...current].slice(0, 60))
    toast.success(`已记录 ${snapshots.length} 条竞品快照`)
  }

  return {
    content: workspace.content,
    setContent,
    updateContent,
    accounts: workspace.accounts,
    setAccounts,
    goal: workspace.goal,
    setGoal,
    competitors: workspace.competitors,
    setCompetitors,
    competitorSnapshots: workspace.competitorSnapshots,
    setCompetitorSnapshots,
    calendar: workspace.calendar,
    setCalendar,
    updateCalendar,
    hideSensitiveInReport,
    setHideSensitiveInReport,
    lastWorkspaceUndo,
    setLastWorkspaceUndo,
    createWorkspaceSnapshot,
    applyWorkspaceSnapshot,
    captureWorkspaceUndo,
    restoreLastWorkspaceUndo,
    resetWorkspace,
    addContent,
    removeContent,
    addCompetitor,
    removeCompetitor,
    toggleCalendarStatus,
    captureCompetitorSnapshotsAction,
  }
}
