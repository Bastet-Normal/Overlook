import type { CompetitorDraft, ContentIntent, ContentItem, Platform } from '../types'
import {
  clampConfidence,
  makeId,
  normalizePlatform,
  toNumber,
} from './dashboardHelpers'

export type ImportFieldKey =
  | 'platform'
  | 'title'
  | 'type'
  | 'publishedAt'
  | 'hour'
  | 'views'
  | 'likes'
  | 'comments'
  | 'shares'
  | 'saves'
  | 'followersGained'
  | 'pillar'
  | 'campaign'
  | 'tags'
  | 'audience'
  | 'hook'
  | 'intent'

export type ImportColumnMapping = {
  field: ImportFieldKey
  label: string
  source: string | null
  required?: boolean
}

export type ParsedImportRow = {
  rowNumber: number
  item: ContentItem | null
  issues: string[]
  duplicate: boolean
}

export type ExternalScanResponse = {
  name?: string
  followers?: number | string
  avgViews?: number | string
  avg_views?: number | string
  averageViews?: number | string
  engagementRate?: number | string
  engagement_rate?: number | string
  angle?: string
  confidence?: number | string
  scanConfidence?: number | string
  scan_confidence?: number | string
  scannedAt?: string
  scanned_at?: string
}

export const importFieldDefinitions: Array<{ field: ImportFieldKey; label: string; aliases: string[]; required?: boolean }> = [
  { field: 'platform', label: '平台', aliases: ['平台', 'platform', 'Platform'], required: true },
  { field: 'title', label: '标题', aliases: ['标题', 'title', 'Title', '内容标题'], required: true },
  { field: 'type', label: '类型', aliases: ['类型', 'type', 'format', '内容类型'] },
  { field: 'publishedAt', label: '日期', aliases: ['日期', 'date', 'publishedAt', '发布时间'], required: true },
  { field: 'hour', label: '小时', aliases: ['小时', 'hour', '发布小时'] },
  { field: 'views', label: '播放量', aliases: ['播放量', 'views', '曝光', '阅读量'] },
  { field: 'likes', label: '点赞', aliases: ['点赞', 'likes', '赞'] },
  { field: 'comments', label: '评论', aliases: ['评论', 'comments'] },
  { field: 'shares', label: '分享', aliases: ['分享', 'shares', '转发'] },
  { field: 'saves', label: '收藏', aliases: ['收藏', 'saves', 'favorites'] },
  { field: 'followersGained', label: '涨粉', aliases: ['涨粉', 'followersGained', '新增粉丝'] },
  { field: 'pillar', label: '内容支柱', aliases: ['内容支柱', 'pillar', '主题'] },
  { field: 'campaign', label: '活动', aliases: ['活动', 'campaign', '系列'] },
  { field: 'tags', label: '标签', aliases: ['标签', 'tags', '关键词'] },
  { field: 'audience', label: '受众', aliases: ['受众', 'audience', '目标人群'] },
  { field: 'hook', label: '钩子', aliases: ['钩子', 'hook', '开头'] },
  { field: 'intent', label: '意图', aliases: ['意图', 'intent', '目标'] },
]

export function readCell(row: Record<string, string>, keys: string[], fallback = '') {
  for (const key of keys) {
    const value = row[key]?.trim()
    if (value) return value
  }
  return fallback
}

export function normalizeHeader(value: string) {
  return value.replace(/\s+/g, '').trim().toLowerCase()
}

export function buildImportMapping(headers: string[]) {
  const normalizedHeaders = headers.filter(Boolean).map((header) => ({ header, normalized: normalizeHeader(header) }))
  const usedHeaders = new Set<string>()

  const mappings = importFieldDefinitions.map((definition) => {
    const match = normalizedHeaders.find(
      (entry) => !usedHeaders.has(entry.header) && definition.aliases.some((alias) => normalizeHeader(alias) === entry.normalized),
    )
    if (match) usedHeaders.add(match.header)
    return {
      field: definition.field,
      label: definition.label,
      required: definition.required,
      source: match?.header ?? null,
    }
  })

  return {
    mappings,
    ignoredColumns: headers.filter((header) => header && !usedHeaders.has(header)),
  }
}

export function readMappedCell(row: Record<string, string>, mappings: ImportColumnMapping[], field: ImportFieldKey, fallback = '') {
  const mapping = mappings.find((entry) => entry.field === field)
  const mappedValue = mapping?.source ? row[mapping.source]?.trim() : ''
  if (mappedValue) return mappedValue

  const definition = importFieldDefinitions.find((entry) => entry.field === field)
  return definition ? readCell(row, definition.aliases, fallback) : fallback
}

export function splitTags(value: string) {
  return value
    .split(/[,，、;；|/]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 8)
}

export function normalizeIntent(value: string): ContentIntent {
  const normalized = value.trim().toLowerCase()
  if (normalized.includes('收藏') || normalized.includes('save')) return 'save'
  if (normalized.includes('信任') || normalized.includes('trust')) return 'trust'
  if (normalized.includes('转化') || normalized.includes('合作') || normalized.includes('conversion')) return 'conversion'
  return 'growth'
}

export function contentKey(item: Pick<ContentItem, 'platform' | 'title' | 'publishedAt'>) {
  return `${item.platform}|${item.title.trim().toLowerCase()}|${item.publishedAt}`
}

export function normalizeContentItem(item: ContentItem): ContentItem {
  return {
    ...item,
    tags: Array.isArray(item.tags)
      ? item.tags
          .map((tag) => String(tag).trim())
          .filter(Boolean)
          .slice(0, 8)
      : splitTags(item.pillar || item.campaign || ''),
    audience: item.audience || '个人创作者',
    hook: item.hook || item.title,
    intent: normalizeIntent(item.intent ?? 'growth'),
  }
}

export function parseImportedRow(row: Record<string, string>, index: number, existingKeys: Set<string>, mappings: ImportColumnMapping[]): ParsedImportRow {
  const issues: string[] = []
  const platform = normalizePlatform(readMappedCell(row, mappings, 'platform'))
  const title = readMappedCell(row, mappings, 'title')
  const publishedAt = readMappedCell(row, mappings, 'publishedAt', new Date().toISOString().slice(0, 10)).slice(0, 10)

  if (!platform) issues.push('平台无法识别')
  if (!title) issues.push('缺少标题')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) issues.push('日期格式应为 YYYY-MM-DD')

  if (!platform || !title || issues.length > 0) {
    return { rowNumber: index + 2, item: null, issues, duplicate: false }
  }

  const item: ContentItem = {
    id: makeId(`import-${index}`),
    platform,
    title,
    type: readMappedCell(row, mappings, 'type', platform === 'Xiaohongshu' ? '图文笔记' : '短视频'),
    publishedAt,
    hour: Math.min(23, Math.max(0, Math.round(toNumber(readMappedCell(row, mappings, 'hour', '20'))))),
    views: toNumber(readMappedCell(row, mappings, 'views')),
    likes: toNumber(readMappedCell(row, mappings, 'likes')),
    comments: toNumber(readMappedCell(row, mappings, 'comments')),
    shares: toNumber(readMappedCell(row, mappings, 'shares')),
    saves: toNumber(readMappedCell(row, mappings, 'saves')),
    followersGained: toNumber(readMappedCell(row, mappings, 'followersGained')),
    pillar: readMappedCell(row, mappings, 'pillar', '未分类'),
    campaign: readMappedCell(row, mappings, 'campaign', '导入数据'),
    tags: splitTags(readMappedCell(row, mappings, 'tags', '')),
    audience: readMappedCell(row, mappings, 'audience', '个人创作者'),
    hook: readMappedCell(row, mappings, 'hook', title),
    intent: normalizeIntent(readMappedCell(row, mappings, 'intent', 'growth')),
  }

  const duplicate = existingKeys.has(contentKey(item))
  return { rowNumber: index + 2, item, issues: duplicate ? ['重复内容'] : [], duplicate }
}

export function parseExternalScanResponse(platform: Platform, fallbackName: string, data: ExternalScanResponse): CompetitorDraft | null {
  const followers = toNumber(data.followers)
  const avgViews = toNumber(data.avgViews ?? data.avg_views ?? data.averageViews)
  const engagementRate = toNumber(data.engagementRate ?? data.engagement_rate)
  const angle = String(data.angle ?? '').trim()
  if (followers <= 0 || avgViews <= 0 || engagementRate <= 0 || !angle) return null

  return {
    platform,
    name: String(data.name ?? fallbackName).trim() || fallbackName,
    followers,
    avgViews,
    engagementRate,
    angle,
    scanSource: 'external',
    scanConfidence: clampConfidence(toNumber(data.confidence ?? data.scanConfidence ?? data.scan_confidence ?? 90)),
    scannedAt: data.scannedAt || data.scanned_at || new Date().toISOString(),
  }
}

export async function fetchExternalCompetitorScan(endpoint: string, platform: Platform, name: string, signal: AbortSignal) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform, handle: name }),
    signal,
  })
  if (!response.ok) return null
  return parseExternalScanResponse(platform, name, (await response.json()) as ExternalScanResponse)
}
