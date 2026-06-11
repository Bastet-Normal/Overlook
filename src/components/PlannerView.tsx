import { Target, Clock, CalendarDays, WandSparkles, Copy } from 'lucide-react'
import type { CalendarItem, Goal, Platform } from '../types'
import { PLATFORMS } from '../types'
import type { BestSlot } from '../utils/calendarHelpers'
import { formatNumber, statusLabel, toNumber } from '../utils/dashboardHelpers'
import { platformSoftColors, platformColors } from '../utils/mockData'
import { SectionTitle } from './SectionTitle'

interface PlannerViewProps {
  goal: Goal
  setGoal: (val: Goal) => void
  totals: {
    views: number
    followersGained: number
    sponsorScore: number
  }
  goalProgress: {
    views: number
    followers: number
    sponsor: number
  }
  bestSlots: BestSlot[]
  calendar: CalendarItem[]
  onGenerateCalendar: () => void
  onCopyPlan: () => void
  onToggleCalendarStatus: (id: string) => void
  calendarPlatformFilter: 'all' | Platform
  setCalendarPlatformFilter: (val: 'all' | Platform) => void
  visibleCalendar: CalendarItem[]
  repurposeCards: Array<{ platform: Platform; format: string; hook: string }>
  topContentTitle?: string
}

function Progress({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <div className="progress-row">
      <div>
        <span>{label}</span>
        <strong>{detail}</strong>
      </div>
      <div className="progress-track" aria-label={`${label} ${Math.round(value)}%`}>
        <span style={{ width: `${Math.round(value)}%` }} />
      </div>
    </div>
  )
}

export function PlannerView({
  goal,
  setGoal,
  totals,
  goalProgress,
  bestSlots,
  calendar,
  onGenerateCalendar,
  onCopyPlan,
  onToggleCalendarStatus,
  calendarPlatformFilter,
  setCalendarPlatformFilter,
  visibleCalendar,
  repurposeCards,
  topContentTitle,
}: PlannerViewProps) {
  return (
    <div className="view-stack view-stack--planner">
      <section className="dashboard-grid">
        <article className="panel">
          <SectionTitle icon={<Target size={18} />} title="月度目标" action={goal.month} />
          <div className="goal-form">
            <label>
              播放目标
              <input type="number" min="1" value={goal.targetViews} onChange={(event) => setGoal({ ...goal, targetViews: toNumber(event.target.value) })} />
            </label>
            <label>
              涨粉目标
              <input
                type="number"
                min="1"
                value={goal.targetFollowers}
                onChange={(event) => setGoal({ ...goal, targetFollowers: toNumber(event.target.value) })}
              />
            </label>
            <label>
              商务线索
              <input
                type="number"
                min="1"
                value={goal.targetSponsorLeads}
                onChange={(event) => setGoal({ ...goal, targetSponsorLeads: toNumber(event.target.value) })}
              />
            </label>
          </div>
          <div className="progress-grid">
            <Progress label="播放" value={goalProgress.views} detail={`${formatNumber(totals.views)} / ${formatNumber(goal.targetViews)}`} />
            <Progress label="涨粉" value={goalProgress.followers} detail={`${formatNumber(totals.followersGained)} / ${formatNumber(goal.targetFollowers)}`} />
            <Progress label="合作准备" value={goalProgress.sponsor} detail={`${totals.sponsorScore}/100`} />
          </div>
        </article>

        <article className="panel">
          <SectionTitle icon={<Clock size={18} />} title="优先发布窗口" action="按历史表现" />
          <div className="slot-grid">
            {PLATFORMS.map((platform) => (
              <div className="slot-card" key={platform}>
                <span className="platform-dot" style={{ background: platformColors[platform] }} />
                <strong>{platform}</strong>
                <div>
                  {bestSlots
                    .filter((slot) => slot.platform === platform)
                    .map((slot) => (
                      <span key={`${platform}-${slot.hour}`} className="time-pill">
                        {slot.label}
                      </span>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <SectionTitle icon={<CalendarDays size={18} />} title="本周排期" action={`${calendar.length} 项`} />
        <div className="section-actions">
          <button className="action-button" onClick={onGenerateCalendar}>
            <WandSparkles size={16} />
            生成
          </button>
          <button className="action-button action-button--ghost" onClick={onCopyPlan}>
            <Copy size={16} />
            复制
          </button>
          <select value={calendarPlatformFilter} onChange={(event) => setCalendarPlatformFilter(event.target.value as 'all' | Platform)}>
            <option value="all">全部平台</option>
            {PLATFORMS.map((platform) => (
              <option key={platform}>{platform}</option>
            ))}
          </select>
        </div>
        <div className="calendar-grid">
          {visibleCalendar.length === 0 ? (
            <div style={{ gridColumn: 'span 7', textAlign: 'center', color: 'var(--muted)', padding: '24px', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
              本周暂无排期，点击上方“生成”以自动规划发布排期。
            </div>
          ) : (
            visibleCalendar.map((item) => (
              <article className={`calendar-card calendar-card--${item.status}`} key={item.id}>
                <div className="calendar-card__top">
                  <span>{item.day}</span>
                  <button className="status-pill" onClick={() => onToggleCalendarStatus(item.id)}>
                    {statusLabel[item.status]}
                  </button>
                </div>
                <strong>{item.title}</strong>
                <small>
                  {item.platform} · {item.format} · {item.time}
                </small>
                {item.experiment && <small>{item.experiment}</small>}
                {item.metric && <span className="objective-pill">指标：{item.metric}</span>}
                <span className="objective-pill">{item.objective}</span>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="panel">
        <SectionTitle icon={<WandSparkles size={18} />} title="跨平台重塑" action={topContentTitle ?? 'Top 内容'} />
        <div className="repurpose-grid">
          {repurposeCards.map((card) => (
            <article className="repurpose-card" key={card.platform}>
              <span className="platform-chip" style={{ background: platformSoftColors[card.platform], color: platformColors[card.platform] }}>
                {card.platform}
              </span>
              <strong>{card.format}</strong>
              <p>{card.hook}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
