import { useState } from 'react'
import { useLocalStorage } from './useLocalStorage'
import type { Account, CalendarItem, Competitor, CompetitorSnapshot, ContentItem, Goal, WorkspaceSnapshot } from '../types'
import { seedAccounts, seedCalendar, seedCompetitorSnapshots, seedCompetitors, seedContent, seedGoal } from '../utils/mockData'
import { makeId } from '../utils/dashboardHelpers'
import { normalizeContentItem } from '../utils/importHelpers'
import { toast } from 'sonner'

export type WorkspaceUndo = {
  label: string
  capturedAt: string
  snapshot: WorkspaceSnapshot
}

const WORKSPACE_VERSION = 3

export function useWorkspaceState() {
  const [content, setContent] = useLocalStorage<ContentItem[]>('overlook-content-v2', seedContent)
  const [accounts, setAccounts] = useLocalStorage<Account[]>('overlook-accounts-v2', seedAccounts)
  const [goal, setGoal] = useLocalStorage<Goal>('overlook-goal-v2', seedGoal)
  const [competitors, setCompetitors] = useLocalStorage<Competitor[]>('overlook-competitors-v2', seedCompetitors)
  const [competitorSnapshots, setCompetitorSnapshots] = useLocalStorage<CompetitorSnapshot[]>('overlook-competitor-snapshots-v1', seedCompetitorSnapshots)
  const [calendar, setCalendar] = useLocalStorage<CalendarItem[]>('overlook-calendar-v2', seedCalendar)
  const [hideSensitiveInReport, setHideSensitiveInReport] = useLocalStorage<boolean>('overlook-hide-sensitive-report-v1', false)
  const [lastWorkspaceUndo, setLastWorkspaceUndo] = useState<WorkspaceUndo | null>(null)

  const createWorkspaceSnapshot = (): WorkspaceSnapshot => ({
    version: WORKSPACE_VERSION,
    exportedAt: new Date().toISOString(),
    content: content.map(normalizeContentItem),
    accounts,
    goal,
    competitors,
    competitorSnapshots,
    calendar,
  })

  const applyWorkspaceSnapshot = (snapshot: WorkspaceSnapshot) => {
    setContent(snapshot.content.map(normalizeContentItem))
    setAccounts(snapshot.accounts)
    setGoal(snapshot.goal)
    setCompetitors(snapshot.competitors)
    setCompetitorSnapshots(Array.isArray(snapshot.competitorSnapshots) ? snapshot.competitorSnapshots : [])
    setCalendar(Array.isArray(snapshot.calendar) ? snapshot.calendar : [])
  }

  const captureWorkspaceUndo = (label: string) => {
    setLastWorkspaceUndo({ label, capturedAt: new Date().toISOString(), snapshot: createWorkspaceSnapshot() })
  }

  const restoreLastWorkspaceUndo = () => {
    if (!lastWorkspaceUndo) return
    const currentSnapshot = createWorkspaceSnapshot()
    applyWorkspaceSnapshot(lastWorkspaceUndo.snapshot)
    setLastWorkspaceUndo({ label: '撤销前状态', capturedAt: new Date().toISOString(), snapshot: currentSnapshot })
    toast.success('已恢复到上一个工作区状态')
  }

  const resetWorkspace = () => {
    captureWorkspaceUndo('恢复示例前状态')
    applyWorkspaceSnapshot({
      version: WORKSPACE_VERSION,
      exportedAt: new Date().toISOString(),
      content: seedContent,
      accounts: seedAccounts,
      goal: seedGoal,
      competitors: seedCompetitors,
      competitorSnapshots: seedCompetitorSnapshots,
      calendar: seedCalendar,
    })
    toast.success('示例工作区已恢复')
  }

  const addContent = (item: Omit<ContentItem, 'id'>) => {
    const normalized = normalizeContentItem({
      ...item,
      id: makeId('manual'),
      title: item.title.trim(),
      hook: item.hook.trim() || item.title.trim(),
    } as ContentItem)
    setContent((current) => [normalized, ...current])
    toast.success('内容已加入看板')
  }

  const removeContent = (id: string) => {
    setContent((current) => current.filter((item) => item.id !== id))
    toast.success('内容已删除')
  }

  const addCompetitor = (competitor: Competitor) => {
    setCompetitors((current) => [competitor, ...current])
    toast.success('对标账号已加入')
  }

  const removeCompetitor = (id: string) => {
    setCompetitors((current) => current.filter((item) => item.id !== id))
    toast.success('对标账号已删除')
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
    const capturedAt = new Date().toISOString()
    const today = capturedAt.slice(0, 10)
    const snapshots = competitors.map((competitor) => ({
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
    content,
    setContent,
    accounts,
    setAccounts,
    goal,
    setGoal,
    competitors,
    setCompetitors,
    competitorSnapshots,
    setCompetitorSnapshots,
    calendar,
    setCalendar,
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
