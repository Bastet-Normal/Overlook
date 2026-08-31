import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { CalendarPlus, Pencil, X } from 'lucide-react'
import type { CalendarItem, Platform } from '../types'
import { PLATFORMS } from '../types'
import { statusLabel } from '../utils/dashboardHelpers'

export type CalendarDraft = Omit<CalendarItem, 'id'>

interface CalendarComposerProps {
  initialDraft: CalendarDraft
  editing: boolean
  onClose: () => void
  onSave: (draft: CalendarDraft) => void
}

export function CalendarComposer({ initialDraft, editing, onClose, onSave }: CalendarComposerProps) {
  const [draft, setDraft] = useState(initialDraft)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.title.trim()) return
    onSave({
      ...draft,
      title: draft.title.trim(),
      format: draft.format.trim() || '内容',
      objective: draft.objective.trim() || '内容增长',
      experiment: draft.experiment?.trim() || undefined,
      metric: draft.metric?.trim() || undefined,
    })
  }

  return (
    <>
      <button className="composer-backdrop" onClick={onClose} aria-label="关闭排期编辑面板" />
      <section className="composer-drawer calendar-composer" role="dialog" aria-modal="true" aria-labelledby="calendar-composer-title">
        <header className="composer-drawer__header">
          <div>
            <span>内容工作流</span>
            <h2 id="calendar-composer-title">{editing ? '编辑排期' : '新增排期'}</h2>
            <p>明确发布时间、内容形态、实验假设与复盘指标。</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="关闭排期编辑"><X size={18} /></button>
        </header>

        <form className="content-form content-form--drawer" onSubmit={submit}>
          <fieldset className="form-section">
            <legend>发布信息</legend>
            <div className="form-section__grid">
              <label className="span-2">标题<input autoFocus required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="这次要发布什么" /></label>
              <label>日期标签<input value={draft.day} onChange={(event) => setDraft({ ...draft, day: event.target.value })} placeholder="周三 / 08-31" /></label>
              <label>时间<input type="time" value={draft.time} onChange={(event) => setDraft({ ...draft, time: event.target.value })} /></label>
              <label>平台<select value={draft.platform} onChange={(event) => setDraft({ ...draft, platform: event.target.value as Platform })}>{PLATFORMS.map((platform) => <option key={platform}>{platform}</option>)}</select></label>
              <label>状态<select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as CalendarItem['status'] })}>{(['draft', 'scheduled', 'done'] as const).map((status) => <option key={status} value={status}>{statusLabel[status]}</option>)}</select></label>
              <label className="span-2">内容形态<input value={draft.format} onChange={(event) => setDraft({ ...draft, format: event.target.value })} placeholder="短视频 / 图文笔记 / 长视频" /></label>
            </div>
          </fieldset>

          <fieldset className="form-section">
            <legend>实验与复盘</legend>
            <div className="form-section__grid">
              <label className="span-2">目标<input value={draft.objective} onChange={(event) => setDraft({ ...draft, objective: event.target.value })} placeholder="拉新、收藏增长或建立信任" /></label>
              <label className="span-2">实验假设<input value={draft.experiment ?? ''} onChange={(event) => setDraft({ ...draft, experiment: event.target.value })} placeholder="例如：3 秒反差钩子" /></label>
              <label className="span-2">核心指标<input value={draft.metric ?? ''} onChange={(event) => setDraft({ ...draft, metric: event.target.value })} placeholder="例如：完播率、收藏率、转发率" /></label>
            </div>
          </fieldset>

          <div className="composer-drawer__actions">
            <button className="action-button action-button--ghost" type="button" onClick={onClose}>取消</button>
            <button className="action-button" type="submit">{editing ? <Pencil size={16} /> : <CalendarPlus size={16} />}{editing ? '保存修改' : '加入排期'}</button>
          </div>
        </form>
      </section>
    </>
  )
}
