import type { Competitor, CompetitorDraft, CompetitorSnapshot, ContentIntent, Platform, WorkspaceSnapshot } from '../types'
import { PLATFORMS } from '../types'

export const intentLabel: Record<ContentIntent, string> = {
  growth: '拉新',
  save: '收藏',
  trust: '信任',
  conversion: '转化',
}

export const intentOptions: ContentIntent[] = ['growth', 'save', 'trust', 'conversion']

export const statusLabel: Record<'draft' | 'scheduled' | 'done', string> = {
  draft: '草稿',
  scheduled: '已排期',
  done: '已完成',
}

export const accountStatusLabel: Record<'connected' | 'manual' | 'missing', string> = {
  connected: '已连接',
  manual: '手动维护',
  missing: '待补充',
}

export const scanSourceLabel: Record<NonNullable<Competitor['scanSource']>, string> = {
  'local-estimate': '本地估算',
  manual: '手动修正',
  sample: '示例数据',
  external: '外部数据',
}

export const scanProfiles: Record<Platform, { followerBase: number; viewRatio: number; engagementBase: number; angles: string[] }> = {
  Bilibili: {
    followerBase: 42000,
    viewRatio: 0.48,
    engagementBase: 7.8,
    angles: ['项目拆解 + 过程复盘', '长视频教程 + 评论答疑', '代码演示 + 结果对比'],
  },
  Xiaohongshu: {
    followerBase: 26000,
    viewRatio: 0.66,
    engagementBase: 13.6,
    angles: ['模板清单 + 个人经历', '首图结果 + 收藏步骤', '避坑笔记 + 场景案例'],
  },
  Douyin: {
    followerBase: 68000,
    viewRatio: 0.72,
    engagementBase: 10.4,
    angles: ['强钩子 + 三段式口播', '反差结论 + 快速演示', '热点切入 + 工具结果'],
  },
}

const compactNumber = new Intl.NumberFormat('zh-CN', {
  notation: 'compact',
  maximumFractionDigits: 1,
})

export const plainNumber = new Intl.NumberFormat('zh-CN')

export function formatNumber(value: number) {
  return compactNumber.format(Math.max(0, value))
}

export function formatPercent(value: number) {
  return `${value.toFixed(1)}%`
}

export function snapshotTimestamp(snapshot: Pick<CompetitorSnapshot, 'date' | 'capturedAt'>) {
  const time = new Date(snapshot.capturedAt ?? `${snapshot.date}T00:00:00`).getTime()
  return Number.isFinite(time) ? time : 0
}

export function formatSignedDelta(value: number | null, formatter: (input: number) => string) {
  if (value === null) return '首次'
  if (value === 0) return '持平'
  const sign = value > 0 ? '+' : '-'
  return `${sign}${formatter(Math.abs(value))}`
}

export function formatScanMeta(competitor: Pick<Competitor, 'scanSource' | 'scanConfidence'>) {
  const source = scanSourceLabel[competitor.scanSource ?? 'manual']
  return competitor.scanConfidence ? `${source} · ${competitor.scanConfidence}%` : source
}

export function formatScanTime(value?: string) {
  if (!value) return '未记录更新时间'
  return `更新 ${new Date(value).toLocaleDateString('zh-CN')}`
}

export function sumBy<T>(items: T[], pick: (item: T) => number) {
  return items.reduce((total, item) => total + pick(item), 0)
}

export function toNumber(value: string | number | undefined) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0
  const normalized = String(value ?? '').replace(/[,%，\s]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export function makeId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`
  }
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`
}

export function normalizePlatform(value: string): Platform | null {
  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  if (normalized.includes('bili') || normalized.includes('哔') || normalized.includes('b站')) return 'Bilibili'
  if (normalized.includes('xhs') || normalized.includes('red') || normalized.includes('小红书')) return 'Xiaohongshu'
  if (normalized.includes('douyin') || normalized.includes('tiktok') || normalized.includes('抖音')) return 'Douyin'
  return PLATFORMS.find((platform) => platform.toLowerCase() === normalized) ?? null
}

function hashText(value: string) {
  return [...value].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) % 100000, 17)
}

export function estimateCompetitorFromHandle(platform: Platform, rawName: string): CompetitorDraft {
  const name = rawName.trim()
  const profile = scanProfiles[platform]
  const seed = hashText(`${platform}:${name}`)
  const followerLift = 0.74 + (seed % 67) / 100
  const followers = Math.round((profile.followerBase * followerLift + (seed % 9000)) / 100) * 100
  const avgViews = Math.round((followers * (profile.viewRatio + (seed % 19) / 100)) / 100) * 100
  const engagementRate = Number((profile.engagementBase + ((seed % 41) - 14) / 10).toFixed(1))
  const scanConfidence = 62 + (seed % 19)
  return {
    platform,
    name,
    followers,
    avgViews,
    engagementRate: Math.max(1, engagementRate),
    angle: profile.angles[seed % profile.angles.length],
    scanSource: 'local-estimate',
    scanConfidence,
    scannedAt: new Date().toISOString(),
  }
}

export function clampConfidence(value: number) {
  return Math.min(100, Math.max(1, Math.round(value)))
}

export function isWorkspaceSnapshot(value: unknown): value is WorkspaceSnapshot {
  if (!value || typeof value !== 'object') return false
  const snapshot = value as Partial<WorkspaceSnapshot>
  return Array.isArray(snapshot.content) && Array.isArray(snapshot.accounts) && Boolean(snapshot.goal) && Array.isArray(snapshot.competitors)
}

export function downloadBlob(content: BlobPart, type: string, filename: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}
