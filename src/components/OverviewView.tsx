import { Eye, Heart, Users, Trophy, TrendingUp, Database, Lightbulb, Flame, CalendarDays } from 'lucide-react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
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
import { formatNumber, formatPercent } from '../utils/dashboardHelpers'
import { platformColors } from '../utils/mockData'

const contentMixColors = ['#3a98ff', '#00f5d4', '#f59e0b', '#a855f7']

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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filteredPayload = payload.filter((item: any) => 
      !item.name.endsWith('-glow') && 
      !item.name.endsWith('-fill') && 
      item.stroke && 
      item.stroke !== 'none'
    )
    return (
      <div className="custom-chart-tooltip">
        <div className="tooltip-header">{label}</div>
        <div className="tooltip-body">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {filteredPayload.map((item: any) => (
            <div className="tooltip-row" key={item.name}>
              <span className="tooltip-color-indicator" style={{ background: item.stroke }} />
              <span className="tooltip-item-name">{item.name}</span>
              <strong className="tooltip-item-value">{formatNumber(item.value)}</strong>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
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
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.22}/>
                    <stop offset="95%" stopColor="var(--blue)" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorInteractions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--rose)" stopOpacity={0.18}/>
                    <stop offset="95%" stopColor="var(--rose)" stopOpacity={0.0}/>
                  </linearGradient>
                  <filter id="viewsGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3.5" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="interactionsGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  <filter id="activeDotGlow" x="-40%" y="-40%" width="180%" height="180%">
                    <feGaussianBlur stdDeviation="3" result="blur" />
                    <feColorMatrix type="matrix" values="
                      1 0 0 0 0
                      0 1 0 0 0
                      0 0 1 0 0
                      0 0 0 2 0
                    " />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="rgba(255, 255, 255, 0.03)" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fill: 'var(--muted)', fontSize: 10, fontWeight: 500 }} 
                  tickLine={false}
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  tickFormatter={(value: number) => formatNumber(value)} 
                  tick={{ fill: 'var(--muted)', fontSize: 10, fontWeight: 500 }} 
                  tickLine={false}
                  axisLine={false}
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Area Fills */}
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="none" 
                  fillOpacity={1} 
                  fill="url(#colorViews)" 
                  name="播放-fill" 
                  dot={false} 
                  activeDot={false}
                  isAnimationActive={false} 
                />
                <Area 
                  type="monotone" 
                  dataKey="interactions" 
                  stroke="none" 
                  fillOpacity={1} 
                  fill="url(#colorInteractions)" 
                  name="互动-fill" 
                  dot={false} 
                  activeDot={false}
                  isAnimationActive={false} 
                />

                {/* Glowing Stroke Lines */}
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="var(--blue)" 
                  strokeWidth={6} 
                  fill="none" 
                  opacity={0.35}
                  filter="url(#viewsGlow)"
                  legendType="none"
                  name="播放-glow" 
                  dot={false} 
                  activeDot={false}
                  isAnimationActive={false} 
                />
                <Area 
                  type="monotone" 
                  dataKey="interactions" 
                  stroke="var(--rose)" 
                  strokeWidth={5} 
                  fill="none" 
                  opacity={0.3}
                  filter="url(#interactionsGlow)"
                  legendType="none"
                  name="互动-glow" 
                  dot={false} 
                  activeDot={false}
                  isAnimationActive={false} 
                />

                {/* Sharp Core Stroke Lines */}
                <Area 
                  type="monotone" 
                  dataKey="views" 
                  stroke="var(--blue)" 
                  strokeWidth={2.5} 
                  fill="none" 
                  name="播放" 
                  dot={false} 
                  activeDot={{ r: 5.5, stroke: '#fff', strokeWidth: 2, fill: 'var(--blue)', filter: 'url(#activeDotGlow)' } as unknown as Record<string, unknown>}
                  isAnimationActive={false} 
                />
                <Area 
                  type="monotone" 
                  dataKey="interactions" 
                  stroke="var(--rose)" 
                  strokeWidth={2} 
                  fill="none" 
                  name="互动" 
                  dot={false} 
                  activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2, fill: 'var(--rose)', filter: 'url(#activeDotGlow)' } as unknown as Record<string, unknown>}
                  isAnimationActive={false} 
                />
              </AreaChart>
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
                <Tooltip 
                  formatter={(value: number) => formatNumber(value)} 
                  contentStyle={{ 
                    background: 'rgba(17, 22, 28, 0.95)', 
                    border: '1px solid rgba(255, 255, 255, 0.1)', 
                    borderRadius: '12px', 
                    color: '#f8fafc',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                    backdropFilter: 'blur(12px)'
                  }} 
                  itemStyle={{ color: '#f8fafc' }} 
                />
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
