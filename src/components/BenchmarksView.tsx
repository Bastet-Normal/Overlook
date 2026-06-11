import type { FormEvent } from 'react'
import { Trophy, AlertTriangle, Trash2, Plus, Flame } from 'lucide-react'
import type { Competitor, CompetitorDraft, CompetitorSnapshot, Platform } from '../types'
import { PLATFORMS } from '../types'
import {
  estimateCompetitorFromHandle,
  formatNumber,
  formatPercent,
  formatScanMeta,
  formatScanTime,
  formatSignedDelta,
  makeId,
} from '../utils/dashboardHelpers'
import { SectionTitle } from './SectionTitle'
import { toast } from 'sonner'

interface BenchmarksViewProps {
  competitors: Competitor[]
  competitorSnapshots: CompetitorSnapshot[]
  benchmarkRows: Array<Competitor & { avgViewGap: number; engagementGap: number }>
  latestSnapshots: Array<CompetitorSnapshot & {
    competitor?: Competitor
    followerDelta: number | null
    avgViewsDelta: number | null
    engagementDelta: number | null
  }>
  competitorDraft: CompetitorDraft
  setCompetitorDraft: (val: CompetitorDraft | ((curr: CompetitorDraft) => CompetitorDraft)) => void
  competitorScan: { status: 'idle' | 'scanning' | 'ready' | 'manual'; message: string }
  markCompetitorDraftManual: (patch: Partial<CompetitorDraft>) => void
  triggerScanPending: (platform: Platform, name: string) => void
  resetCompetitorScan: () => void
  onAddCompetitor: (competitor: Competitor) => void
  onDeleteCompetitor: (id: string) => void
  onCaptureSnapshots: () => void
}

export function BenchmarksView({
  competitors,
  competitorSnapshots,
  benchmarkRows,
  latestSnapshots,
  competitorDraft,
  setCompetitorDraft,
  competitorScan,
  markCompetitorDraftManual,
  triggerScanPending,
  resetCompetitorScan,
  onAddCompetitor,
  onDeleteCompetitor,
  onCaptureSnapshots,
}: BenchmarksViewProps) {

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!competitorDraft.name.trim()) {
      toast.error('对标账号不能为空')
      return
    }

    const scannedDraft =
      competitorDraft.followers > 0 || competitorDraft.avgViews > 0 || competitorDraft.engagementRate > 0 || competitorDraft.angle.trim()
        ? competitorDraft
        : estimateCompetitorFromHandle(competitorDraft.platform, competitorDraft.name)
    const preparedDraft: Competitor = {
      ...scannedDraft,
      id: makeId('competitor'),
      name: scannedDraft.name.trim(),
      scanSource: scannedDraft.scanSource ?? 'manual',
      scanConfidence: scannedDraft.scanConfidence ?? 100,
      scannedAt: scannedDraft.scannedAt || new Date().toISOString(),
    }
    onAddCompetitor(preparedDraft)
    resetCompetitorScan()
  }

  return (
    <div className="view-stack view-stack--benchmarks">
      <section className="panel">
        <SectionTitle
          icon={<Trophy size={18} />}
          title="对标账号"
          action={competitorScan.status === 'idle' ? `${competitors.length} 个 · 输入后自动扫描` : competitorScan.message}
        />
        <form className="content-form benchmark-form" onSubmit={handleSubmit}>
          <label>
            平台
            <select
              value={competitorDraft.platform}
              onChange={(event) => {
                const nextPlatform = event.target.value as Platform
                setCompetitorDraft({
                  platform: nextPlatform,
                  name: competitorDraft.name,
                  followers: 0,
                  avgViews: 0,
                  engagementRate: 0,
                  angle: '',
                  scanSource: 'manual',
                  scanConfidence: 0,
                  scannedAt: '',
                })
                triggerScanPending(nextPlatform, competitorDraft.name)
              }}
            >
              {PLATFORMS.map((platform) => (
                <option key={platform}>{platform}</option>
              ))}
            </select>
          </label>
          <label>
            账号
            <input
              value={competitorDraft.name}
              placeholder="@handle 或账号名"
              onChange={(event) => {
                const nextName = event.target.value
                setCompetitorDraft({
                  platform: competitorDraft.platform,
                  name: nextName,
                  followers: 0,
                  avgViews: 0,
                  engagementRate: 0,
                  angle: '',
                  scanSource: 'manual',
                  scanConfidence: 0,
                  scannedAt: '',
                })
                triggerScanPending(competitorDraft.platform, nextName)
              }}
            />
          </label>
          <label>
            粉丝
            <input
              type="number"
              min="0"
              value={competitorDraft.followers}
              onChange={(event) => {
                markCompetitorDraftManual({ followers: Number(event.target.value) })
              }}
            />
          </label>
          <label>
            均播
            <input
              type="number"
              min="0"
              value={competitorDraft.avgViews}
              onChange={(event) => {
                markCompetitorDraftManual({ avgViews: Number(event.target.value) })
              }}
            />
          </label>
          <label>
            互动率 %
            <input
              type="number"
              min="0"
              step="0.1"
              value={competitorDraft.engagementRate}
              onChange={(event) => {
                markCompetitorDraftManual({ engagementRate: Number(event.target.value) })
              }}
            />
          </label>
          <label className="span-2">
            角度
            <input
              value={competitorDraft.angle}
              onChange={(event) => {
                markCompetitorDraftManual({ angle: event.target.value })
              }}
            />
          </label>
          <button className="action-button" type="submit">
            <Plus size={16} />
            添加
          </button>
        </form>
      </section>

      <section className="panel">
        <SectionTitle icon={<AlertTriangle size={18} />} title="差距扫描" action="扫描结果" />
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>账号</th>
                <th>平台</th>
                <th>均播差</th>
                <th>互动率差</th>
                <th>内容角度</th>
                <th aria-label="操作" />
              </tr>
            </thead>
            <tbody>
              {benchmarkRows.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--muted)', padding: '28px' }}>
                    暂无对标账号。请在上方输入账号名称，以进行自动扫描与差距分析。
                  </td>
                </tr>
              ) : (
                benchmarkRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name}</strong>
                      <small>
                        {formatNumber(row.followers)} 粉丝 · {formatScanMeta(row)}
                      </small>
                    </td>
                    <td>{row.platform}</td>
                    <td className={row.avgViewGap >= 0 ? 'positive' : 'negative'}>{formatNumber(Math.abs(row.avgViewGap))}</td>
                    <td className={row.engagementGap >= 0 ? 'positive' : 'negative'}>
                      {row.engagementGap >= 0 ? '+' : '-'}
                      {formatPercent(Math.abs(row.engagementGap))}
                    </td>
                    <td>
                      <strong>{row.angle}</strong>
                      <small>{formatScanTime(row.scannedAt)}</small>
                    </td>
                    <td>
                      <button
                        className="icon-button icon-button--danger"
                        onClick={() => onDeleteCompetitor(row.id)}
                        aria-label={`删除 ${row.name}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <SectionTitle icon={<Flame size={18} />} title="竞品快照" action={`${competitorSnapshots.length} 条`} />
        <div className="section-actions">
          <button className="action-button" onClick={onCaptureSnapshots}>
            <Plus size={16} />
            记录快照
          </button>
        </div>
        <div className="snapshot-grid">
          {latestSnapshots.length === 0 ? (
            <div style={{ gridColumn: 'span 4', textAlign: 'center', color: 'var(--muted)', padding: '24px', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
              暂无历史快照，点击上方“记录快照”以开始追踪变化。
            </div>
          ) : (
            latestSnapshots.map((snapshot) => (
              <div className="snapshot-card" key={snapshot.id}>
                <strong>{snapshot.competitor?.name ?? '已删除账号'}</strong>
                <small>
                  {snapshot.date} · {formatNumber(snapshot.followers)} 粉丝 · {formatNumber(snapshot.avgViews)} 均播
                </small>
                <em
                  className={
                    snapshot.avgViewsDelta === null
                      ? 'snapshot-trend'
                      : snapshot.avgViewsDelta >= 0
                        ? 'snapshot-trend snapshot-trend--positive'
                        : 'snapshot-trend snapshot-trend--negative'
                  }
                >
                  互动 {formatPercent(snapshot.engagementRate)} · 均播较上次 {formatSignedDelta(snapshot.avgViewsDelta, formatNumber)}
                </em>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
