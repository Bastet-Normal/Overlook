import type {
  Account,
  AccountStatus,
  CalendarItem,
  Competitor,
  CompetitorScanSource,
  CompetitorSnapshot,
  ContentIntent,
  ContentItem,
  Goal,
  Platform,
  WorkspaceSnapshot,
} from '../types'
import { PLATFORMS } from '../types'

export const WORKSPACE_VERSION = 4
export const MAX_CONTENT_ITEMS = 10_000
export const MAX_COMPETITORS = 500
export const MAX_SNAPSHOTS = 5_000
export const MAX_CALENDAR_ITEMS = 1_000

export type WorkspaceValidationResult =
  | { success: true; data: WorkspaceSnapshot; errors: [] }
  | { success: false; data: null; errors: string[] }

const accountStatuses: AccountStatus[] = ['connected', 'manual', 'missing']
const contentIntents: ContentIntent[] = ['growth', 'save', 'trust', 'conversion']
const scanSources: CompetitorScanSource[] = ['local-estimate', 'manual', 'sample', 'external']
const calendarStatuses: CalendarItem['status'][] = ['draft', 'scheduled', 'done']

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function isPlatform(value: unknown): value is Platform {
  return typeof value === 'string' && PLATFORMS.includes(value as Platform)
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day
}

function isIsoTimestamp(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value))
}

function isSafeText(value: unknown, maxLength = 500): value is string {
  return typeof value === 'string' && value.length <= maxLength
}

function isNonNegativeNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function validateContentItem(value: unknown, index: number, errors: string[]): value is ContentItem {
  if (!isRecord(value)) {
    errors.push(`内容第 ${index + 1} 项不是对象`)
    return false
  }

  const valid =
    isSafeText(value.id, 160) &&
    isPlatform(value.platform) &&
    isSafeText(value.title, 300) &&
    Boolean(value.title.trim()) &&
    isSafeText(value.type, 80) &&
    isIsoDate(value.publishedAt) &&
    Number.isInteger(value.hour) &&
    Number(value.hour) >= 0 &&
    Number(value.hour) <= 23 &&
    ['views', 'likes', 'comments', 'shares', 'saves', 'followersGained'].every((field) => isNonNegativeNumber(value[field])) &&
    isSafeText(value.pillar, 120) &&
    isSafeText(value.campaign, 120) &&
    Array.isArray(value.tags) &&
    value.tags.length <= 8 &&
    value.tags.every((tag) => isSafeText(tag, 60)) &&
    isSafeText(value.audience, 160) &&
    isSafeText(value.hook, 500) &&
    contentIntents.includes(value.intent as ContentIntent)

  if (!valid) errors.push(`内容第 ${index + 1} 项字段不完整或格式错误`)
  return valid
}

function validateAccount(value: unknown, index: number, errors: string[]): value is Account {
  if (!isRecord(value)) {
    errors.push(`账号第 ${index + 1} 项不是对象`)
    return false
  }
  const valid =
    isPlatform(value.platform) &&
    isSafeText(value.handle, 160) &&
    accountStatuses.includes(value.status as AccountStatus) &&
    isNonNegativeNumber(value.followers) &&
    isSafeText(value.lastSync, 80)
  if (!valid) errors.push(`账号第 ${index + 1} 项字段不完整或格式错误`)
  return valid
}

function validateGoal(value: unknown, errors: string[]): value is Goal {
  if (!isRecord(value)) {
    errors.push('月度目标不是对象')
    return false
  }
  const valid =
    typeof value.month === 'string' &&
    /^\d{4}-\d{2}$/.test(value.month) &&
    isNonNegativeNumber(value.targetViews) &&
    isNonNegativeNumber(value.targetFollowers) &&
    isNonNegativeNumber(value.targetSponsorLeads)
  if (!valid) errors.push('月度目标格式错误')
  return valid
}

function validateCompetitor(value: unknown, index: number, errors: string[]): value is Competitor {
  if (!isRecord(value)) {
    errors.push(`竞品第 ${index + 1} 项不是对象`)
    return false
  }
  const sourceValid = value.scanSource === undefined || scanSources.includes(value.scanSource as CompetitorScanSource)
  const confidenceValid =
    value.scanConfidence === undefined ||
    (isNonNegativeNumber(value.scanConfidence) && Number(value.scanConfidence) <= 100)
  const scannedAtValid = value.scannedAt === undefined || value.scannedAt === '' || isIsoTimestamp(value.scannedAt)
  const valid =
    isSafeText(value.id, 160) &&
    isPlatform(value.platform) &&
    isSafeText(value.name, 200) &&
    Boolean(value.name.trim()) &&
    isNonNegativeNumber(value.followers) &&
    isNonNegativeNumber(value.avgViews) &&
    isNonNegativeNumber(value.engagementRate) &&
    isSafeText(value.angle, 500) &&
    sourceValid &&
    confidenceValid &&
    scannedAtValid
  if (!valid) errors.push(`竞品第 ${index + 1} 项字段不完整或格式错误`)
  return valid
}

function validateSnapshot(value: unknown, index: number, errors: string[]): value is CompetitorSnapshot {
  if (!isRecord(value)) {
    errors.push(`竞品快照第 ${index + 1} 项不是对象`)
    return false
  }
  const valid =
    isSafeText(value.id, 160) &&
    isSafeText(value.competitorId, 160) &&
    isIsoDate(value.date) &&
    (value.capturedAt === undefined || isIsoTimestamp(value.capturedAt)) &&
    isNonNegativeNumber(value.followers) &&
    isNonNegativeNumber(value.avgViews) &&
    isNonNegativeNumber(value.engagementRate)
  if (!valid) errors.push(`竞品快照第 ${index + 1} 项字段不完整或格式错误`)
  return valid
}

function validateCalendarItem(value: unknown, index: number, errors: string[]): value is CalendarItem {
  if (!isRecord(value)) {
    errors.push(`排期第 ${index + 1} 项不是对象`)
    return false
  }
  const valid =
    isSafeText(value.id, 160) &&
    isSafeText(value.day, 40) &&
    isPlatform(value.platform) &&
    isSafeText(value.title, 300) &&
    isSafeText(value.format, 80) &&
    isSafeText(value.time, 20) &&
    isSafeText(value.objective, 80) &&
    calendarStatuses.includes(value.status as CalendarItem['status']) &&
    (value.sourceId === undefined || isSafeText(value.sourceId, 160)) &&
    (value.experiment === undefined || isSafeText(value.experiment, 200)) &&
    (value.metric === undefined || isSafeText(value.metric, 120))
  if (!valid) errors.push(`排期第 ${index + 1} 项字段不完整或格式错误`)
  return valid
}

function validateArrayLimit(value: unknown, label: string, limit: number, errors: string[]): value is unknown[] {
  if (!Array.isArray(value)) {
    errors.push(`${label}必须是数组`)
    return false
  }
  if (value.length > limit) {
    errors.push(`${label}超过 ${limit.toLocaleString('zh-CN')} 条上限`)
    return false
  }
  return true
}

export function validateWorkspaceSnapshot(value: unknown): WorkspaceValidationResult {
  const errors: string[] = []
  if (!isRecord(value)) return { success: false, data: null, errors: ['备份根节点必须是对象'] }

  const contentValid =
    validateArrayLimit(value.content, '内容', MAX_CONTENT_ITEMS, errors) &&
    value.content.every((item, index) => validateContentItem(item, index, errors))
  const accountsValid =
    validateArrayLimit(value.accounts, '账号', PLATFORMS.length, errors) &&
    value.accounts.every((item, index) => validateAccount(item, index, errors))
  const competitorsValid =
    validateArrayLimit(value.competitors, '竞品', MAX_COMPETITORS, errors) &&
    value.competitors.every((item, index) => validateCompetitor(item, index, errors))

  const rawSnapshots = value.competitorSnapshots ?? []
  const snapshotsValid =
    validateArrayLimit(rawSnapshots, '竞品快照', MAX_SNAPSHOTS, errors) &&
    rawSnapshots.every((item, index) => validateSnapshot(item, index, errors))
  const rawCalendar = value.calendar ?? []
  const calendarValid =
    validateArrayLimit(rawCalendar, '排期', MAX_CALENDAR_ITEMS, errors) &&
    rawCalendar.every((item, index) => validateCalendarItem(item, index, errors))
  const goalValid = validateGoal(value.goal, errors)

  if (
    !contentValid ||
    !accountsValid ||
    !competitorsValid ||
    !snapshotsValid ||
    !calendarValid ||
    !goalValid
  ) {
    return { success: false, data: null, errors: errors.slice(0, 8) }
  }

  const exportedAt = isIsoTimestamp(value.exportedAt) ? value.exportedAt : new Date().toISOString()
  return {
    success: true,
    errors: [],
    data: {
      version: WORKSPACE_VERSION,
      exportedAt,
      content: value.content as ContentItem[],
      accounts: value.accounts as Account[],
      goal: value.goal as Goal,
      competitors: value.competitors as Competitor[],
      competitorSnapshots: rawSnapshots as CompetitorSnapshot[],
      calendar: rawCalendar as CalendarItem[],
    },
  }
}

export function isWorkspaceSnapshot(value: unknown): value is WorkspaceSnapshot {
  return validateWorkspaceSnapshot(value).success
}
