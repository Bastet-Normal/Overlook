import { useMemo } from 'react'

import type {
  Account,
  CalendarItem,
  Competitor,
  CompetitorSnapshot,
  ContentItem,
  Goal,
  Platform,
} from '../types'
import { PLATFORMS } from '../types'
import {
  buildExperiments,
  buildInsightList,
  buildPlatformSummaries,
  getBestSlots,
} from '../utils/calendarHelpers'
import { snapshotTimestamp, sumBy } from '../utils/dashboardHelpers'
import { normalizeContentItem } from '../utils/importHelpers'

type DashboardDataInput = {
  content: ContentItem[]
  accounts: Account[]
  goal: Goal
  competitors: Competitor[]
  competitorSnapshots: CompetitorSnapshot[]
  calendar: CalendarItem[]
  query: string
  platformFilter: 'all' | Platform
  calendarPlatformFilter: 'all' | Platform
}

export function useDashboardData({
  content,
  accounts,
  goal,
  competitors,
  competitorSnapshots,
  calendar,
  query,
  platformFilter,
  calendarPlatformFilter,
}: DashboardDataInput) {
  const normalizedContent = useMemo(() => content.map(normalizeContentItem), [content])
  const summaries = useMemo(() => buildPlatformSummaries(normalizedContent), [normalizedContent])
  const bestSlots = useMemo(
    () => PLATFORMS.flatMap((platform) => getBestSlots(normalizedContent, platform)),
    [normalizedContent],
  )

  const totals = useMemo(() => {
    const views = sumBy(normalizedContent, (item) => item.views)
    const likes = sumBy(normalizedContent, (item) => item.likes)
    const comments = sumBy(normalizedContent, (item) => item.comments)
    const shares = sumBy(normalizedContent, (item) => item.shares)
    const saves = sumBy(normalizedContent, (item) => item.saves)
    const followersGained = sumBy(normalizedContent, (item) => item.followersGained)
    const interactions = likes + comments + shares + saves
    const accountFollowers = sumBy(accounts, (account) => account.followers)
    const engagementRate = views > 0 ? (interactions / views) * 100 : 0
    const sponsorScore = Math.min(
      100,
      Math.round(engagementRate * 3 + accountFollowers / 1800 + normalizedContent.length * 1.5),
    )

    return {
      views,
      likes,
      comments,
      shares,
      saves,
      followersGained,
      interactions,
      accountFollowers,
      engagementRate,
      sponsorScore,
    }
  }, [accounts, normalizedContent])

  const trendData = useMemo(() => {
    const grouped = new Map<string, { date: string; views: number; interactions: number }>()
    normalizedContent.forEach((item) => {
      const existing = grouped.get(item.publishedAt) ?? { date: item.publishedAt, views: 0, interactions: 0 }
      grouped.set(item.publishedAt, {
        date: item.publishedAt,
        views: existing.views + item.views,
        interactions: existing.interactions + item.likes + item.comments + item.shares + item.saves,
      })
    })

    return [...grouped.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12)
      .map((item) => ({ ...item, day: item.date.slice(5) }))
  }, [normalizedContent])

  const contentMix = useMemo(() => {
    const grouped = new Map<string, number>()
    normalizedContent.forEach((item) => grouped.set(item.type, (grouped.get(item.type) ?? 0) + item.views))
    return [...grouped.entries()].map(([name, value]) => ({ name, value }))
  }, [normalizedContent])

  const campaignRows = useMemo(() => {
    const grouped = new Map<
      string,
      { campaign: string; views: number; saves: number; followers: number; posts: number }
    >()
    normalizedContent.forEach((item) => {
      const existing = grouped.get(item.campaign) ?? {
        campaign: item.campaign,
        views: 0,
        saves: 0,
        followers: 0,
        posts: 0,
      }
      grouped.set(item.campaign, {
        campaign: item.campaign,
        views: existing.views + item.views,
        saves: existing.saves + item.saves,
        followers: existing.followers + item.followersGained,
        posts: existing.posts + 1,
      })
    })
    return [...grouped.values()].sort((a, b) => b.views - a.views)
  }, [normalizedContent])

  const topContent = useMemo(
    () => [...normalizedContent].sort((a, b) => b.views - a.views).slice(0, 6),
    [normalizedContent],
  )
  const insights = useMemo(
    () => buildInsightList(summaries, normalizedContent, competitors, goal, bestSlots),
    [bestSlots, competitors, goal, normalizedContent, summaries],
  )
  const experiments = useMemo(
    () => buildExperiments(summaries, normalizedContent, competitors, bestSlots),
    [bestSlots, competitors, normalizedContent, summaries],
  )

  const filteredContent = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    return [...normalizedContent]
      .filter((item) => {
        const matchesPlatform = platformFilter === 'all' || item.platform === platformFilter
        const matchesQuery =
          !normalizedQuery ||
          item.title.toLowerCase().includes(normalizedQuery) ||
          item.pillar.toLowerCase().includes(normalizedQuery) ||
          item.campaign.toLowerCase().includes(normalizedQuery) ||
          item.audience.toLowerCase().includes(normalizedQuery) ||
          item.hook.toLowerCase().includes(normalizedQuery) ||
          item.tags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
        return matchesPlatform && matchesQuery
      })
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.views - a.views)
  }, [normalizedContent, platformFilter, query])

  const benchmarkRows = useMemo(
    () =>
      competitors.map((competitor) => {
        const own = summaries.find((summary) => summary.platform === competitor.platform)
        return {
          ...competitor,
          avgViewGap: (own?.avgViews ?? 0) - competitor.avgViews,
          engagementGap: (own?.engagementRate ?? 0) - competitor.engagementRate,
        }
      }),
    [competitors, summaries],
  )

  const latestSnapshots = useMemo(() => {
    const grouped = new Map<string, CompetitorSnapshot[]>()
    competitorSnapshots.forEach((snapshot) => {
      grouped.set(snapshot.competitorId, [...(grouped.get(snapshot.competitorId) ?? []), snapshot])
    })

    return [...grouped.values()]
      .map((snapshots) => {
        const ordered = [...snapshots].sort((a, b) => snapshotTimestamp(b) - snapshotTimestamp(a))
        const latest = ordered[0]
        const previous = ordered[1]
        return {
          ...latest,
          competitor: competitors.find((competitor) => competitor.id === latest.competitorId),
          followerDelta: previous ? latest.followers - previous.followers : null,
          avgViewsDelta: previous ? latest.avgViews - previous.avgViews : null,
          engagementDelta: previous ? latest.engagementRate - previous.engagementRate : null,
        }
      })
      .sort((a, b) => snapshotTimestamp(b) - snapshotTimestamp(a))
      .slice(0, 8)
  }, [competitorSnapshots, competitors])

  const repurposeCards = useMemo(() => {
    const source = topContent[0]
    if (!source) return []

    return PLATFORMS.filter((platform) => platform !== source.platform).map((platform) => {
      const format = platform === 'Bilibili' ? '长视频复盘' : platform === 'Xiaohongshu' ? '图文卡片' : '15 秒短视频'
      const hook =
        platform === 'Bilibili'
          ? `把「${source.title.slice(0, 18)}」扩成问题、过程、结果三段。`
          : platform === 'Xiaohongshu'
            ? '标题保留结果感，首图放 3 个可收藏步骤。'
            : '开头 3 秒直接给反差结论，再补一条操作证据。'
      return { platform, format, hook }
    })
  }, [topContent])

  const visibleCalendar = useMemo(
    () => calendar.filter((item) => calendarPlatformFilter === 'all' || item.platform === calendarPlatformFilter),
    [calendar, calendarPlatformFilter],
  )

  const goalProgress = {
    views: Math.min(100, (totals.views / Math.max(1, goal.targetViews)) * 100),
    followers: Math.min(100, (totals.followersGained / Math.max(1, goal.targetFollowers)) * 100),
    sponsor: totals.sponsorScore,
  }

  return {
    normalizedContent,
    summaries,
    bestSlots,
    totals,
    trendData,
    contentMix,
    campaignRows,
    topContent,
    insights,
    experiments,
    filteredContent,
    benchmarkRows,
    latestSnapshots,
    repurposeCards,
    visibleCalendar,
    goalProgress,
  }
}
