import type { CalendarItem, Competitor, ContentItem, Goal, Platform, PlatformSummary } from '../types'
import { PLATFORMS } from '../types'
import { formatNumber, formatPercent, makeId, sumBy } from './dashboardHelpers'

export type BestSlot = {
  platform: Platform
  hour: number
  label: string
  score: number
}

export type ActionExperiment = {
  id: string
  platform: Platform
  title: string
  action: string
  metric: string
  evidence: string
}

export const defaultHours: Record<Platform, number[]> = {
  Bilibili: [9, 10, 11, 20],
  Xiaohongshu: [20, 21, 22, 17],
  Douyin: [12, 19, 20, 21],
}

export function buildPlatformSummaries(content: ContentItem[]): PlatformSummary[] {
  return PLATFORMS.map((platform) => {
    const items = content.filter((item) => item.platform === platform)
    const views = sumBy(items, (item) => item.views)
    const likes = sumBy(items, (item) => item.likes)
    const comments = sumBy(items, (item) => item.comments)
    const shares = sumBy(items, (item) => item.shares)
    const saves = sumBy(items, (item) => item.saves)
    const followersGained = sumBy(items, (item) => item.followersGained)
    const interactions = likes + comments + shares + saves
    const topContent = [...items].sort((a, b) => b.views - a.views)[0]

    return {
      platform,
      posts: items.length,
      views,
      likes,
      comments,
      shares,
      saves,
      followersGained,
      interactions,
      engagementRate: views > 0 ? (interactions / views) * 100 : 0,
      avgViews: items.length > 0 ? views / items.length : 0,
      topContent,
    }
  })
}

export function getBestSlots(content: ContentItem[], platform: Platform): BestSlot[] {
  const scoped = content.filter((item) => item.platform === platform)
  const scoredHours = new Map<number, { score: number; count: number }>()

  scoped.forEach((item) => {
    const engagement = item.views > 0 ? ((item.likes + item.comments + item.shares + item.saves) / item.views) * 100 : 0
    const qualityScore = engagement * 2 + item.followersGained / 25 + Math.min(40, item.views / 3000)
    const existing = scoredHours.get(item.hour) ?? { score: 0, count: 0 }
    scoredHours.set(item.hour, { score: existing.score + qualityScore, count: existing.count + 1 })
  })

  const defaultCandidates = defaultHours[platform].map((hour, index) => ({
    platform,
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
    score: 72 - index * 5,
  }))

  const dataCandidates = [...scoredHours.entries()].map(([hour, value]) => ({
    platform,
    hour,
    label: `${String(hour).padStart(2, '0')}:00`,
    score: Math.round(value.score / Math.max(1, value.count)),
  }))

  return [...dataCandidates, ...defaultCandidates]
    .sort((a, b) => b.score - a.score)
    .filter((slot, index, slots) => slots.findIndex((candidate) => candidate.hour === slot.hour) === index)
    .slice(0, 3)
}

export function createCalendar(content: ContentItem[], summaries: PlatformSummary[], slots: BestSlot[]): CalendarItem[] {
  const top = [...content].sort((a, b) => b.views - a.views)[0]
  const bestPlatform = [...summaries].sort((a, b) => b.engagementRate - a.engagementRate)[0]?.platform ?? 'Xiaohongshu'
  const topPillars = [...new Set(content.map((item) => item.pillar).filter(Boolean))].slice(0, 4)
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']

  return days.map((day, index) => {
    const platform = PLATFORMS[index % PLATFORMS.length]
    const slot = slots.find((candidate) => candidate.platform === platform)
    const pillar = topPillars[index % Math.max(1, topPillars.length)] ?? '内容增长'
    const sourceTitle = top?.title ?? '本周最高互动内容'
    const format = platform === 'Bilibili' ? '长视频' : platform === 'Xiaohongshu' ? '图文笔记' : '短视频'

    return {
      id: makeId(`plan-${index}`),
      day,
      platform,
      title:
        platform === bestPlatform
          ? `${pillar}：复盘「${sourceTitle.slice(0, 16)}」`
          : `${pillar}：${platform} 适配版`,
      format,
      time: slot?.label ?? `${String(defaultHours[platform][0]).padStart(2, '0')}:00`,
      objective: index % 3 === 0 ? '拉新' : index % 3 === 1 ? '收藏' : '转化',
      status: index < 2 ? 'scheduled' : 'draft',
    }
  })
}

export function buildInsightList(
  summaries: PlatformSummary[],
  content: ContentItem[],
  competitors: Competitor[],
  goal: Goal,
  slots: BestSlot[],
) {
  const insights: string[] = []
  const topPlatform = [...summaries].sort((a, b) => b.engagementRate - a.engagementRate)[0]
  const topContent = [...content].sort((a, b) => b.views - a.views)[0]
  const totalViews = sumBy(content, (item) => item.views)
  const totalFollowers = sumBy(content, (item) => item.followersGained)
  const bestSlot = slots[0]

  if (topPlatform) {
    insights.push(`${topPlatform.platform} 当前互动率最高，优先承接深度观点和商务转化。`)
  }

  if (topContent) {
    insights.push(`最高播放内容是「${topContent.title}」，可拆成短视频、图文卡片和长视频延展。`)
  }

  if (bestSlot) {
    insights.push(`${bestSlot.platform} 的优先发布窗口是 ${bestSlot.label}，可放入本周排期。`)
  }

  const saveRate = totalViews > 0 ? (sumBy(content, (item) => item.saves) / totalViews) * 100 : 0
  if (saveRate < 2.5) {
    insights.push('收藏率偏低，封面和正文需要更多清单、模板、步骤 and 可保存截图。')
  } else {
    insights.push('收藏率已经能支撑资料型选题，下一步应把高收藏内容转成系列。')
  }

  const strongestCompetitor = [...competitors].sort((a, b) => b.avgViews - a.avgViews)[0]
  if (strongestCompetitor) {
    insights.push(`对标账号「${strongestCompetitor.name}」的平均播放更高，差距点集中在「${strongestCompetitor.angle}」。`)
  }

  if (totalViews < goal.targetViews || totalFollowers < goal.targetFollowers) {
    insights.push('月度目标未满，优先做高复用选题，不要新增过多分散主题。')
  }

  return insights.slice(0, 6)
}

export function buildExperiments(
  summaries: PlatformSummary[],
  content: ContentItem[],
  competitors: Competitor[],
  slots: BestSlot[],
): ActionExperiment[] {
  const topContent = [...content].sort((a, b) => b.views - a.views)[0]
  const bestPlatform = [...summaries].sort((a, b) => b.engagementRate - a.engagementRate)[0]
  const weakestPlatform = [...summaries].filter((summary) => summary.posts > 0).sort((a, b) => a.engagementRate - b.engagementRate)[0]
  const bestSlot = slots[0]
  const strongestCompetitor = [...competitors].sort((a, b) => b.avgViews - a.avgViews)[0]
  const experiments: ActionExperiment[] = []

  if (topContent) {
    experiments.push({
      id: 'extend-top-content',
      platform: bestPlatform?.platform ?? topContent.platform,
      title: '爆款延展实验',
      action: `把「${topContent.title.slice(0, 18)}」拆成 1 条短视频 and 1 篇图文卡片。`,
      metric: '收藏率与转发率',
      evidence: `${formatNumber(topContent.views)} 播放，适合作为系列母题。`,
    })
  }

  if (bestSlot) {
    experiments.push({
      id: 'best-time-window',
      platform: bestSlot.platform,
      title: '发布时间窗口实验',
      action: `连续两次在 ${bestSlot.label} 发布同一系列内容，避免同时更换选题结构。`,
      metric: '前 24 小时播放',
      evidence: `当前历史评分最高窗口为 ${bestSlot.label}。`,
    })
  }

  if (weakestPlatform) {
    experiments.push({
      id: 'weak-platform-adapter',
      platform: weakestPlatform.platform,
      title: '低互动平台适配实验',
      action: `${weakestPlatform.platform} 暂停直接搬运，改为重写开头钩子和结尾保存点。`,
      metric: '互动率提升',
      evidence: `当前互动率 ${formatPercent(weakestPlatform.engagementRate)}，低于其他平台。`,
    })
  }

  if (strongestCompetitor && experiments.length < 4) {
    experiments.push({
      id: 'competitor-angle',
      platform: strongestCompetitor.platform,
      title: '竞品角度复刻实验',
      action: `围绕「${strongestCompetitor.angle}」做一次同主题不同结构的内容。`,
      metric: '均播差缩小',
      evidence: `${strongestCompetitor.name} 当前均播 ${formatNumber(strongestCompetitor.avgViews)}。`,
    })
  }

  return experiments.slice(0, 4)
}
