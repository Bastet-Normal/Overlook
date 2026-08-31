import { useState } from 'react'
import { Target, Clock, CalendarDays, WandSparkles, Copy, Pencil, Plus, Trash2 } from 'lucide-react'
import type { CalendarItem, Goal, Platform } from '../types'
import { PLATFORMS } from '../types'
import type { BestSlot } from '../utils/calendarHelpers'
import { formatNumber, statusLabel, toNumber } from '../utils/dashboardHelpers'
import { platformSoftColors, platformColors } from '../utils/mockData'
import { SectionTitle } from './SectionTitle'
import { CalendarComposer } from './CalendarComposer'
import type { CalendarDraft } from './CalendarComposer'

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
  onAddCalendarItem: (draft: CalendarDraft) => void
  onUpdateCalendarItem: (id: string, draft: CalendarDraft) => void
  onDeleteCalendarItem: (id: string) => void
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
  onAddCalendarItem,
  onUpdateCalendarItem,
  onDeleteCalendarItem,
  calendarPlatformFilter,
  setCalendarPlatformFilter,
  visibleCalendar,
  repurposeCards,
  topContentTitle,
}: PlannerViewProps) {
  const [composer, setComposer] = useState<{ id: string | null; draft: CalendarDraft } | null>(null)
  const emptyCalendarDraft = (): CalendarDraft => ({
    day: '周一',
    platform: 'Bilibili',
    title: '',
    format: '长视频',
    time: '10:00',
    objective: '内容增长',
    status: 'draft',
    experiment: '',
    metric: '',
  })
  const editCalendar = (item: CalendarItem) => {
    const { id, ...draft } = item
    setComposer({ id, draft })
  }
  const saveCalendar = (draft: CalendarDraft) => {
    if (composer?.id) onUpdateCalendarItem(composer.id, draft)
    else onAddCalendarItem(draft)
    setComposer(null)
  }

  return (
    <div className="view-stack view-stack--planner">
      {composer && <CalendarComposer initialDraft={composer.draft} editing={Boolean(composer.id)} onClose={() => setComposer(null)} onSave={saveCalendar} />}
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
              商务线索目标
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
          <SectionTitle
            icon={<Clock size={18} />}
            title="优先发布窗口"
            action={bestSlots.some((slot) => slot.source === 'historical') ? '历史 + 建议' : '建议时段'}
          />
          <div className="slot-grid">
            {PLATFORMS.map((platform) => (
              <div className="slot-card" key={platform}>
                <span className="platform-dot" style={{ background: platformColors[platform] }} />
                <strong>{platform}</strong>
                <div>
                  {bestSlots
                    .filter((slot) => slot.platform === platform)
                    .map((slot) => (
                      <span
                        key={`${platform}-${slot.hour}`}
                        className="time-pill"
                        title={slot.source === 'historical' ? '根据历史内容表现' : '缺少样本时的建议时段'}
                      >
                        {slot.label}{slot.source === 'historical' ? ' · 历史' : ''}
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
          <button className="action-button" onClick={() => setComposer({ id: null, draft: emptyCalendarDraft() })}>
            <Plus size={16} />新增
          </button>
          <button className="action-button" onClick={onGenerateCalendar}>
            <WandSparkles size={16} />
            生成
          </button>
          <button className="action-button action-button--ghost" onClick={onCopyPlan}>
            <Copy size={16} />
            复制
          </button>
          <select
            value={calendarPlatformFilter}
            onChange={(event) => setCalendarPlatformFilter(event.target.value as 'all' | Platform)}
            aria-label="按平台筛选排期"
          >
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
                  <button
                    className="status-pill"
                    onClick={() => onToggleCalendarStatus(item.id)}
                    aria-label={`${item.title}：${statusLabel[item.status]}，点击切换状态`}
                  >
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
                <div className="calendar-card__actions">
                  <button className="icon-button" onClick={() => editCalendar(item)} aria-label={`编辑排期 ${item.title}`}><Pencil size={14} /></button>
                  <button className="icon-button icon-button--danger" onClick={() => onDeleteCalendarItem(item.id)} aria-label={`删除排期 ${item.title}`}><Trash2 size={14} /></button>
                </div>
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
