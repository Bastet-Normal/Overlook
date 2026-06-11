import type { RefObject } from 'react'
import type { Account, CalendarItem, ContentItem, Goal, PlatformSummary } from '../types'
import type { ActionExperiment } from '../utils/calendarHelpers'
import { accountStatusLabel, formatNumber, formatPercent } from '../utils/dashboardHelpers'

interface ReportSheetProps {
  refNode: RefObject<HTMLDivElement | null>
  totals: {
    views: number
    interactions: number
    followersGained: number
    engagementRate: number
    sponsorScore: number
  }
  summaries: PlatformSummary[]
  insights: string[]
  experiments: ActionExperiment[]
  topContent: ContentItem[]
  calendar: CalendarItem[]
  goal: Goal
  accounts: Account[]
  hideSensitive: boolean
}

export function ReportSheet({
  refNode,
  totals,
  summaries,
  insights,
  experiments,
  topContent,
  calendar,
  goal,
  accounts,
  hideSensitive,
}: ReportSheetProps) {
  const audiences = [...new Set(topContent.flatMap((item) => [item.audience, ...item.tags]).filter(Boolean))].slice(0, 8)

  return (
    <div className="report-sheet" ref={refNode} aria-hidden="true">
      <header>
        <span>Overlook</span>
        <h1>Creator Media Kit</h1>
        <p>
          {goal.month} · {new Date().toLocaleDateString('zh-CN')}
        </p>
      </header>
      <section className="report-metrics">
        <div>
          <strong>{formatNumber(totals.views)}</strong>
          <span>总播放</span>
        </div>
        <div>
          <strong>{formatNumber(totals.interactions)}</strong>
          <span>总互动</span>
        </div>
        <div>
          <strong>{formatPercent(totals.engagementRate)}</strong>
          <span>互动率</span>
        </div>
        <div>
          <strong>{totals.sponsorScore}/100</strong>
          <span>合作准备度</span>
        </div>
      </section>
      <section>
        <h2>账号与受众</h2>
        {accounts.map((account) => (
          <p key={account.platform}>
            {account.platform}: {hideSensitive ? '账号已隐藏' : account.handle} · {formatNumber(account.followers)} 粉丝 · {accountStatusLabel[account.status]}。
          </p>
        ))}
        <p>核心受众与标签：{audiences.join('、') || '待补充'}。</p>
      </section>
      <section>
        <h2>平台摘要</h2>
        {summaries.map((summary) => (
          <p key={summary.platform}>
            {summary.platform}: {formatNumber(summary.views)} 播放，{formatPercent(summary.engagementRate)} 互动率，Top 内容：
            {summary.topContent?.title ?? '暂无'}。
          </p>
        ))}
      </section>
      <section>
        <h2>下一轮实验</h2>
        {experiments.slice(0, 4).map((experiment) => (
          <p key={experiment.id}>
            {experiment.platform} · {experiment.title}: {experiment.action} 指标：{experiment.metric}。
          </p>
        ))}
      </section>
      <section>
        <h2>关键判断</h2>
        <ul>
          {insights.slice(0, 5).map((insight) => (
            <li key={insight}>{insight}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2>Top 内容</h2>
        {topContent.slice(0, 5).map((item) => (
          <p key={item.id}>
            {item.platform} · {item.title} · {formatNumber(item.views)} 播放 · {formatNumber(item.saves)} 收藏
          </p>
        ))}
      </section>
      <section>
        <h2>本周排期</h2>
        {calendar.slice(0, 5).map((item) => (
          <p key={item.id}>
            {item.day} {item.time} · {item.platform} · {item.title}
          </p>
        ))}
      </section>
    </div>
  )
}
