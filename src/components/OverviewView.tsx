import { Eye, Heart, Users, Trophy, TrendingUp, Database, Lightbulb, Flame, CalendarDays } from 'lucide-react'
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { KPICard } from './KPICard'
import { SectionTitle } from './SectionTitle'
import type { PlatformSummary } from '../types'
import type { ActionExperiment } from '../utils/calendarHelpers'
import { formatNumber, formatPercent, plainNumber } from '../utils/dashboardHelpers'
import { platformColors } from '../utils/mockData'

const contentMixColors = ['#8a9aae', '#8da89e', '#b8a27d', '#a697bb']

interface OverviewViewProps {
  totals: {
    views: number
    interactions: number
    followersGained: number
    accountFollowers: number
    engagementRate: number
    sponsorScore: number
  }
  trendData: Array<{ day: string; date: string; views: number; interactions: number }>
  contentMix: Array<{ name: string; value: number }>
  experiments: ActionExperiment[]
  summaries: PlatformSummary[]
  campaignRows: Array<{ campaign: string; posts: number; views: number; saves: number; followers: number }>
  contentLength: number
}

export function OverviewView({
  totals,
  trendData,
  contentMix,
  experiments,
  summaries,
  campaignRows,
  contentLength,
}: OverviewViewProps) {
  return (
    <div className="view-stack view-stack--overview">
      <section className="kpi-grid">
        <KPICard icon={<Eye size={18} />} label="总播放" value={formatNumber(totals.views)} helper={`${contentLength} 条内容`} tone="blue" />
        <KPICard icon={<Heart size={18} />} label="互动率" value={formatPercent(totals.engagementRate)} helper={`${formatNumber(totals.interactions)} 次互动`} tone="rose" />
        <KPICard icon={<Users size={18} />} label="新增粉丝" value={formatNumber(totals.followersGained)} helper={`${formatNumber(totals.accountFollowers)} 总粉丝`} tone="teal" />
        <KPICard icon={<Trophy size={18} />} label="合作准备度" value={`${totals.sponsorScore}/100`} helper="基于互动、粉丝和内容量" tone="amber" />
      </section>

      <section className="dashboard-grid">
        <article className="panel panel--wide">
          <SectionTitle icon={<TrendingUp size={18} />} title="内容表现趋势" action={`${trendData.length} 个时间点`} />
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(65,72,78,0.1)" />
                <XAxis dataKey="day" tick={{ fill: '#737b82' }} stroke="rgba(65,72,78,0.14)" />
                <YAxis tickFormatter={(value: number) => formatNumber(value)} width={48} tick={{ fill: '#737b82' }} stroke="rgba(65,72,78,0.14)" />
                <Tooltip formatter={(value: number) => plainNumber.format(value)} contentStyle={{ background: '#fbfaf7', border: '1px solid rgba(65,72,78,0.14)', borderRadius: '8px', color: '#252b2f' }} labelStyle={{ color: '#737b82' }} itemStyle={{ color: '#252b2f' }} />
                <Line type="monotone" dataKey="views" stroke="#8a9aae" strokeWidth={3} dot={false} name="播放" isAnimationActive={false} />
                <Line type="monotone" dataKey="interactions" stroke="#a697bb" strokeWidth={2} dot={false} name="互动" isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="panel">
          <SectionTitle icon={<Database size={18} />} title="内容结构" action="按播放量" />
          <div className="chart-box chart-box--compact">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={contentMix} dataKey="value" nameKey="name" innerRadius={44} outerRadius={68} paddingAngle={3} isAnimationActive={false}>
                  {contentMix.map((entry, index) => (
                    <Cell key={entry.name} fill={contentMixColors[index % contentMixColors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => formatNumber(value)} contentStyle={{ background: '#fbfaf7', border: '1px solid rgba(65,72,78,0.14)', borderRadius: '8px', color: '#252b2f' }} itemStyle={{ color: '#252b2f' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="compact-legend" aria-label="内容类型占比">
            {contentMix.map((entry, index) => (
              <span key={entry.name}>
                <i style={{ background: contentMixColors[index % contentMixColors.length] }} />
                {entry.name}
              </span>
            ))}
          </div>
        </article>
      </section>

      <section className="overview-secondary">
        <article className="panel">
          <SectionTitle icon={<Lightbulb size={18} />} title="下一轮实验" action={`优先 ${Math.min(experiments.length, 3)} 项`} />
          <div className="experiment-list">
            {experiments.slice(0, 3).map((experiment) => (
              <div className="experiment-card" key={experiment.id}>
                <Lightbulb size={16} />
                <div>
                  <strong>{experiment.title}</strong>
                  <span>{experiment.action}</span>
                  <small>
                    {experiment.platform} · 指标：{experiment.metric} · {experiment.evidence}
                  </small>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <SectionTitle icon={<Flame size={18} />} title="平台表现" action="互动率排序" />
          <div className="platform-list">
            {[...summaries]
              .sort((a, b) => b.engagementRate - a.engagementRate)
              .map((summary) => (
                <div className="platform-row" key={summary.platform}>
                  <span className="platform-dot" style={{ background: platformColors[summary.platform] }} />
                  <div>
                    <strong>{summary.platform}</strong>
                    <small>{summary.topContent?.title ?? '暂无内容'}</small>
                  </div>
                  <span>{formatPercent(summary.engagementRate)}</span>
                </div>
              ))}
          </div>
        </article>

        <article className="panel">
          <SectionTitle icon={<CalendarDays size={18} />} title="选题系列" action="前 2 个" />
          <div className="campaign-grid">
            {campaignRows.slice(0, 2).map((campaign) => (
              <div className="campaign-card" key={campaign.campaign}>
                <strong>{campaign.campaign}</strong>
                <span>{campaign.posts} 条内容</span>
                <div className="mini-metrics">
                  <span>{formatNumber(campaign.views)} 播放</span>
                  <span>{formatNumber(campaign.saves)} 收藏</span>
                  <span>{formatNumber(campaign.followers)} 涨粉</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </div>
  )
}
