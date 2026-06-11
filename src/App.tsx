import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import Papa from 'papaparse'
import { Toaster, toast } from 'sonner'

import { Navbar } from './components/Navbar'
import { OverviewView } from './components/OverviewView'
import { ContentView } from './components/ContentView'
import { PlannerView } from './components/PlannerView'
import { BenchmarksView } from './components/BenchmarksView'
import { AccountsView } from './components/AccountsView'
import { ImportPreviewModal } from './components/ImportPreviewModal'
import { RestorePreviewModal } from './components/RestorePreviewModal'
import { ReportSheet } from './components/ReportSheet'

import { useWorkspaceState } from './hooks/useWorkspaceState'
import { useCompetitorScan } from './hooks/useCompetitorScan'

import type { Platform, ViewKey, ContentItem, CompetitorSnapshot, WorkspaceSnapshot, PlatformSummary } from './types'
import { PLATFORMS } from './types'
import {
  downloadBlob,
  intentLabel,
  isWorkspaceSnapshot,
  snapshotTimestamp,
  sumBy
} from './utils/dashboardHelpers'
import {
  buildImportMapping,
  contentKey,
  normalizeContentItem,
  parseImportedRow
} from './utils/importHelpers'
import {
  buildExperiments,
  buildInsightList,
  buildPlatformSummaries,
  createCalendar,
  getBestSlots
} from './utils/calendarHelpers'
import type { ActionExperiment } from './utils/calendarHelpers'
import type { ImportPreview } from './components/ImportPreviewModal'
import type { RestorePreview } from './components/RestorePreviewModal'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const viewMeta: Record<ViewKey, { eyebrow: string; title: string; summary: string }> = {
  overview: {
    eyebrow: '今日经营状态',
    title: '创作者经营看板',
    summary: '关键指标、趋势和下一步动作。',
  },
  content: {
    eyebrow: '内容资产管理',
    title: '内容库',
    summary: '录入表现，筛选可复用素材。',
  },
  planner: {
    eyebrow: '实验排期',
    title: '发布计划',
    summary: '目标、排期和复盘指标。',
  },
  benchmarks: {
    eyebrow: '赛道观察',
    title: '竞品对标',
    summary: '输入账号后扫描，确认后进入对标。',
  },
  accounts: {
    eyebrow: '本地优先',
    title: '账号与数据',
    summary: '账号信息、备份恢复和离线状态。',
  },
}

function OverlookApp() {
  const [activeView, setActiveView] = useState<ViewKey>('overview')
  const [query, setQuery] = useState('')
  const [platformFilter, setPlatformFilter] = useState<'all' | Platform>('all')
  const [calendarPlatformFilter, setCalendarPlatformFilter] = useState<'all' | Platform>('all')

  const [pendingImport, setPendingImport] = useState<ImportPreview | null>(null)
  const [pendingRestore, setPendingRestore] = useState<RestorePreview | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [offlineReady, setOfflineReady] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const workspaceFileRef = useRef<HTMLInputElement>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  // workspace states and actions hook
  const ws = useWorkspaceState()

  // competitor scan states and actions hook
  const scanner = useCompetitorScan()

  useEffect(() => {
    if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`
      navigator.serviceWorker.register(swUrl).then(() => setOfflineReady(true)).catch(() => setOfflineReady(false))
    }

    const installHandler = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', installHandler)
    return () => window.removeEventListener('beforeinstallprompt', installHandler)
  }, [])

  const normalizedContent = useMemo(() => ws.content.map(normalizeContentItem), [ws.content])
  const summaries = useMemo(() => buildPlatformSummaries(normalizedContent), [normalizedContent])
  const bestSlots = useMemo(() => PLATFORMS.flatMap((platform) => getBestSlots(normalizedContent, platform)), [normalizedContent])

  const totals = useMemo(() => {
    const views = sumBy(normalizedContent, (item) => item.views)
    const likes = sumBy(normalizedContent, (item) => item.likes)
    const comments = sumBy(normalizedContent, (item) => item.comments)
    const shares = sumBy(normalizedContent, (item) => item.shares)
    const saves = sumBy(normalizedContent, (item) => item.saves)
    const followersGained = sumBy(normalizedContent, (item) => item.followersGained)
    const interactions = likes + comments + shares + saves
    const accountFollowers = sumBy(ws.accounts, (account) => account.followers)
    const engagementRate = views > 0 ? (interactions / views) * 100 : 0
    const sponsorScore = Math.min(100, Math.round(engagementRate * 3 + accountFollowers / 1800 + normalizedContent.length * 1.5))

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
  }, [ws.accounts, normalizedContent])

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
    const grouped = new Map<string, { campaign: string; views: number; saves: number; followers: number; posts: number }>()
    normalizedContent.forEach((item) => {
      const existing = grouped.get(item.campaign) ?? { campaign: item.campaign, views: 0, saves: 0, followers: 0, posts: 0 }
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

  const topContent = useMemo(() => [...normalizedContent].sort((a, b) => b.views - a.views).slice(0, 6), [normalizedContent])

  const insights = useMemo(
    () => buildInsightList(summaries, normalizedContent, ws.competitors, ws.goal, bestSlots),
    [bestSlots, ws.competitors, ws.goal, normalizedContent, summaries],
  )

  const experiments = useMemo(
    () => buildExperiments(summaries, normalizedContent, ws.competitors, bestSlots),
    [bestSlots, ws.competitors, normalizedContent, summaries],
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

  const benchmarkRows = useMemo(() => {
    return ws.competitors.map((competitor) => {
      const own = summaries.find((summary) => summary.platform === competitor.platform)
      const ownAvgViews = own?.avgViews ?? 0
      const ownEngagement = own?.engagementRate ?? 0
      return {
        ...competitor,
        avgViewGap: ownAvgViews - competitor.avgViews,
        engagementGap: ownEngagement - competitor.engagementRate,
      }
    })
  }, [ws.competitors, summaries])

  const latestSnapshots = useMemo(() => {
    const grouped = new Map<string, CompetitorSnapshot[]>()
    ws.competitorSnapshots.forEach((snapshot) => {
      grouped.set(snapshot.competitorId, [...(grouped.get(snapshot.competitorId) ?? []), snapshot])
    })

    return [...grouped.values()]
      .map((snapshots) => {
        const ordered = [...snapshots].sort((a, b) => snapshotTimestamp(b) - snapshotTimestamp(a))
        const latest = ordered[0]
        const previous = ordered[1]
        return {
          ...latest,
          competitor: ws.competitors.find((competitor) => competitor.id === latest.competitorId),
          followerDelta: previous ? latest.followers - previous.followers : null,
          avgViewsDelta: previous ? latest.avgViews - previous.avgViews : null,
          engagementDelta: previous ? latest.engagementRate - previous.engagementRate : null,
        }
      })
      .sort((a, b) => snapshotTimestamp(b) - snapshotTimestamp(a))
      .slice(0, 8)
  }, [ws.competitorSnapshots, ws.competitors])

  const repurposeCards = useMemo(() => {
    const source = topContent[0]
    if (!source) return []

    return PLATFORMS.filter((platform) => platform !== source.platform).map((platform) => {
      const format = platform === 'Bilibili' ? '长视频复盘' : platform === 'Xiaohongshu' ? '图文卡片' : '15 秒短视频'
      const hook =
        platform === 'Bilibili'
          ? `把「${source.title.slice(0, 18)}」扩成问题、过程、结果三段。`
          : platform === 'Xiaohongshu'
            ? `标题保留结果感，首图放 3 个可收藏步骤。`
            : `开头 3 秒直接给反差结论，再补一条操作证据。`
      return { platform, format, hook }
    })
  }, [topContent])

  const visibleCalendar = useMemo(
    () => ws.calendar.filter((item) => calendarPlatformFilter === 'all' || item.platform === calendarPlatformFilter),
    [ws.calendar, calendarPlatformFilter],
  )

  const goalProgress = {
    views: Math.min(100, (totals.views / Math.max(1, ws.goal.targetViews)) * 100),
    followers: Math.min(100, (totals.followersGained / Math.max(1, ws.goal.targetFollowers)) * 100),
    sponsor: Math.min(100, (totals.sponsorScore / Math.max(1, ws.goal.targetSponsorLeads * 10)) * 100),
  }

  const handleCSVImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const existingKeys = new Set(normalizedContent.map(contentKey))
        const headers = results.meta.fields?.filter(Boolean) ?? Object.keys(results.data[0] ?? {})
        const { mappings, ignoredColumns } = buildImportMapping(headers)
        const parsedRows = results.data.map((row, index) => {
          const parsed = parseImportedRow(row, index, existingKeys, mappings)
          if (parsed.item && !parsed.duplicate) {
            existingKeys.add(contentKey(parsed.item))
          }
          return parsed
        })
        const accepted = parsedRows
          .filter((row): row is typeof row & { item: ContentItem } => Boolean(row.item) && !row.duplicate)
          .map((row) => row.item)
        const skipped = parsedRows.filter((row) => !row.item || row.duplicate)

        if (accepted.length === 0) {
          toast.error('没有识别到有效内容')
          setPendingImport({
            filename: file.name,
            accepted,
            skipped,
            totalRows: results.data.length,
            duplicateCount: parsedRows.filter((row) => row.duplicate).length,
            invalidCount: parsedRows.filter((row) => !row.item).length,
            mappings,
            ignoredColumns,
          })
          return
        }

        setPendingImport({
          filename: file.name,
          accepted,
          skipped,
          totalRows: results.data.length,
          duplicateCount: parsedRows.filter((row) => row.duplicate).length,
          invalidCount: parsedRows.filter((row) => !row.item).length,
          mappings,
          ignoredColumns,
        })
        toast.info(`已解析 ${accepted.length} 条可导入内容`)
      },
      error: () => toast.error('CSV 解析失败'),
    })

    event.currentTarget.value = ''
  }

  const confirmImport = () => {
    if (!pendingImport || pendingImport.accepted.length === 0) return
    ws.captureWorkspaceUndo('导入前状态')
    ws.setContent((current) => [...pendingImport.accepted, ...current])
    toast.success(`已导入 ${pendingImport.accepted.length} 条内容`)
    setPendingImport(null)
  }

  const confirmRestoreWorkspace = () => {
    if (!pendingRestore) return
    ws.captureWorkspaceUndo('恢复前状态')
    ws.applyWorkspaceSnapshot(pendingRestore.snapshot)
    setPendingRestore(null)
    toast.success('工作区已恢复')
  }

  const handleExportJson = () => {
    const payload: WorkspaceSnapshot & { summaries: PlatformSummary[]; insights: string[]; experiments: ActionExperiment[] } = {
      version: 3,
      exportedAt: new Date().toISOString(),
      content: normalizedContent,
      accounts: ws.accounts,
      goal: ws.goal,
      competitors: ws.competitors,
      competitorSnapshots: ws.competitorSnapshots,
      calendar: ws.calendar,
      summaries,
      insights,
      experiments,
    }

    downloadBlob(JSON.stringify(payload, null, 2), 'application/json;charset=utf-8', `overlook-report-${new Date().toISOString().slice(0, 10)}.json`)
    toast.success('JSON 已导出')
  }

  const handleExportWorkspace = () => {
    const snapshot = ws.createWorkspaceSnapshot()
    downloadBlob(JSON.stringify(snapshot, null, 2), 'application/json;charset=utf-8', `overlook-workspace-${new Date().toISOString().slice(0, 10)}.json`)
    toast.success('工作区备份已导出')
  }

  const handleRestoreWorkspace = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result))
        if (!isWorkspaceSnapshot(parsed)) {
          toast.error('备份文件结构不正确')
          return
        }
        const snapshot: WorkspaceSnapshot = {
          ...parsed,
          content: parsed.content.map(normalizeContentItem),
          competitorSnapshots: Array.isArray(parsed.competitorSnapshots) ? parsed.competitorSnapshots : [],
          calendar: Array.isArray(parsed.calendar) ? parsed.calendar : [],
        }
        setPendingRestore({
          filename: file.name,
          snapshot,
          version: snapshot.version,
          exportedAt: snapshot.exportedAt,
          metrics: [
            { label: '内容', current: normalizedContent.length, incoming: snapshot.content.length },
            { label: '账号', current: ws.accounts.length, incoming: snapshot.accounts.length },
            { label: '竞品', current: ws.competitors.length, incoming: snapshot.competitors.length },
            { label: '快照', current: ws.competitorSnapshots.length, incoming: snapshot.competitorSnapshots.length },
            { label: '排期', current: ws.calendar.length, incoming: snapshot.calendar.length },
          ],
        })
        toast.info('已读取备份，确认后恢复')
      } catch {
        toast.error('备份文件解析失败')
      }
    }
    reader.readAsText(file)
    event.currentTarget.value = ''
  }

  const handleExportCsv = () => {
    const csv = Papa.unparse(
      normalizedContent.map((item) => ({
        平台: item.platform,
        标题: item.title,
        类型: item.type,
        日期: item.publishedAt,
        小时: item.hour,
        播放量: item.views,
        点赞: item.likes,
        评论: item.comments,
        分享: item.shares,
        收藏: item.saves,
        涨粉: item.followersGained,
        内容支柱: item.pillar,
        活动: item.campaign,
        标签: item.tags.join(','),
        受众: item.audience,
        钩子: item.hook,
        意图: intentLabel[item.intent],
      })),
    )

    downloadBlob(csv, 'text/csv;charset=utf-8', `overlook-content-${new Date().toISOString().slice(0, 10)}.csv`)
    toast.success('CSV 已导出')
  }

  const handleExportReport = async () => {
    if (!reportRef.current) return
    const toastId = toast.loading('正在生成报告')

    try {
      const [{ jsPDF }, html2canvasModule] = await Promise.all([import('jspdf'), import('html2canvas')])
      const canvas = await html2canvasModule.default(reportRef.current, {
        backgroundColor: '#fbfaf7',
        scale: 2,
        logging: false,
      })
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 24
      const imageWidth = pageWidth - margin * 2
      const imageHeight = (canvas.height / canvas.width) * imageWidth
      const fittedHeight = Math.min(imageHeight, pageHeight - margin * 2)

      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, margin, imageWidth, fittedHeight)
      pdf.save(`overlook-brand-report-${new Date().toISOString().slice(0, 10)}.pdf`)
      toast.success('品牌报告 PDF 已生成', { id: toastId })
    } catch {
      toast.error('PDF 生成失败', { id: toastId })
    }
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
      toast.success('已安装')
    }
    setDeferredPrompt(null)
  }

  const handleGenerateCalendarAction = () => {
    const nextCalendar = createCalendar(normalizedContent, summaries, bestSlots).map((item, index) => {
      const experiment = experiments[index % Math.max(1, experiments.length)]
      return experiment
        ? {
            ...item,
            platform: experiment.platform,
            experiment: experiment.title,
            metric: experiment.metric,
            objective: intentLabel[normalizedContent[index % Math.max(1, normalizedContent.length)]?.intent ?? 'growth'],
          }
        : item
    })
    ws.setCalendar(nextCalendar)
    toast.success('本周计划已生成')
  }

  const copyPlan = async () => {
    const text = ws.calendar.map((item) => `${item.day} ${item.time}｜${item.platform}｜${item.title}｜${statusLabel[item.status]}`).join('\n')
    await navigator.clipboard.writeText(text)
    toast.success('计划已复制')
  }

  const statusLabel: Record<'draft' | 'scheduled' | 'done', string> = {
    draft: '草稿',
    scheduled: '已排期',
    done: '已完成',
  }

  return (
    <div className="app-shell">
      <Toaster position="top-right" richColors closeButton />
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onImportClick={() => fileInputRef.current?.click()}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
        onExportReport={handleExportReport}
        onResetWorkspace={ws.resetWorkspace}
        onInstall={handleInstall}
        showInstall={Boolean(deferredPrompt)}
      />
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={handleCSVImport} />
      <input ref={workspaceFileRef} type="file" accept="application/json,.json" className="sr-only" onChange={handleRestoreWorkspace} />

      <main className="app-main">
        <section className="workspace-header">
          <div className="workspace-title">
            <div className="eyebrow">{viewMeta[activeView].eyebrow}</div>
            <h1>{viewMeta[activeView].title}</h1>
            <p>{viewMeta[activeView].summary}</p>
          </div>
          <div className="status-strip" aria-label="总览状态">
            <p>
              <strong>{ws.content.length}</strong>
              <span>内容</span>
            </p>
            <p>
              <strong>{PLATFORMS.length}</strong>
              <span>平台</span>
            </p>
            <p>
              <strong>{Math.round(goalProgress.views)}%</strong>
              <span>播放目标</span>
            </p>
            <p>
              <strong>{totals.sponsorScore}</strong>
              <span>合作准备度</span>
            </p>
            <p>
              <strong>{offlineReady ? '可用' : '本地'}</strong>
              <span>{offlineReady ? '离线模式' : '浏览器保存'}</span>
            </p>
          </div>
        </section>

        {activeView === 'overview' && (
          <OverviewView
            totals={totals}
            trendData={trendData}
            contentMix={contentMix}
            experiments={experiments}
            summaries={summaries}
            campaignRows={campaignRows}
            contentLength={ws.content.length}
          />
        )}

        {activeView === 'content' && (
          <ContentView
            filteredContent={filteredContent}
            query={query}
            setQuery={setQuery}
            platformFilter={platformFilter}
            setPlatformFilter={setPlatformFilter}
            onAddContent={ws.addContent}
            onDeleteContent={ws.removeContent}
            onExportCsv={handleExportCsv}
          />
        )}

        {activeView === 'planner' && (
          <PlannerView
            goal={ws.goal}
            setGoal={ws.setGoal}
            totals={totals}
            goalProgress={goalProgress}
            bestSlots={bestSlots}
            calendar={ws.calendar}
            onGenerateCalendar={handleGenerateCalendarAction}
            onCopyPlan={copyPlan}
            onToggleCalendarStatus={ws.toggleCalendarStatus}
            calendarPlatformFilter={calendarPlatformFilter}
            setCalendarPlatformFilter={setCalendarPlatformFilter}
            visibleCalendar={visibleCalendar}
            repurposeCards={repurposeCards}
            topContentTitle={topContent[0]?.title}
          />
        )}

        {activeView === 'benchmarks' && (
          <BenchmarksView
            competitors={ws.competitors}
            competitorSnapshots={ws.competitorSnapshots}
            benchmarkRows={benchmarkRows}
            latestSnapshots={latestSnapshots}
            competitorDraft={scanner.competitorDraft}
            setCompetitorDraft={scanner.setCompetitorDraft}
            competitorScan={scanner.competitorScan}
            markCompetitorDraftManual={scanner.markCompetitorDraftManual}
            triggerScanPending={scanner.triggerScanPending}
            resetCompetitorScan={scanner.resetCompetitorScan}
            onAddCompetitor={ws.addCompetitor}
            onDeleteCompetitor={ws.removeCompetitor}
            onCaptureSnapshots={ws.captureCompetitorSnapshotsAction}
          />
        )}

        {activeView === 'accounts' && (
          <AccountsView
            accounts={ws.accounts}
            setAccounts={ws.setAccounts}
            offlineReady={offlineReady}
            contentLength={ws.content.length}
            sponsorScore={totals.sponsorScore}
            competitorsLength={ws.competitors.length}
            onExportWorkspace={handleExportWorkspace}
            onRestoreWorkspaceClick={() => workspaceFileRef.current?.click()}
            lastWorkspaceUndo={ws.lastWorkspaceUndo}
            onRestoreLastWorkspaceUndo={ws.restoreLastWorkspaceUndo}
            hideSensitiveInReport={ws.hideSensitiveInReport}
            setHideSensitiveInReport={ws.setHideSensitiveInReport}
          />
        )}
      </main>

      {pendingImport && <ImportPreviewModal preview={pendingImport} onCancel={() => setPendingImport(null)} onConfirm={confirmImport} />}
      {pendingRestore && (
        <RestorePreviewModal preview={pendingRestore} onCancel={() => setPendingRestore(null)} onConfirm={confirmRestoreWorkspace} />
      )}

      <ReportSheet
        refNode={reportRef}
        totals={totals}
        summaries={summaries}
        insights={insights}
        experiments={experiments}
        topContent={topContent}
        calendar={ws.calendar}
        goal={ws.goal}
        accounts={ws.accounts}
        hideSensitive={ws.hideSensitiveInReport}
      />
    </div>
  )
}

export default OverlookApp
