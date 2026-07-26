import { useEffect, useState } from 'react'
import { Toaster, toast } from 'sonner'

import { Navbar } from './components/Navbar'
import { WorkspaceToolbar } from './components/WorkspaceToolbar'
import { ImportPreviewModal } from './components/ImportPreviewModal'
import { RestorePreviewModal } from './components/RestorePreviewModal'
import { ReportSheet } from './components/ReportSheet'
import { OverviewView } from './components/OverviewView'
import { ContentView } from './components/ContentView'
import { PlannerView } from './components/PlannerView'
import { BenchmarksView } from './components/BenchmarksView'
import { AccountsView } from './components/AccountsView'

import { useWorkspaceState } from './hooks/useWorkspaceState'
import { useCompetitorScan } from './hooks/useCompetitorScan'
import { useDashboardData } from './hooks/useDashboardData'
import { useWorkspaceFiles } from './features/workspace/useWorkspaceFiles'

import type { Platform, ViewKey } from './types'
import { PLATFORMS } from './types'
import { intentLabel, statusLabel } from './utils/dashboardHelpers'
import { createCalendar } from './utils/calendarHelpers'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

type Theme = 'dark' | 'light'

const THEME_STORAGE_KEY = 'overlook-theme'
function readStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
    return storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark'
  } catch {
    return 'dark'
  }
}

function persistTheme(theme: Theme) {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme)
  } catch {
    // Theme persistence is optional; the in-memory UI state still updates.
  }
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

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [offlineReady, setOfflineReady] = useState(false)

  // workspace states and actions hook
  const ws = useWorkspaceState()

  // competitor scan states and actions hook
  const scanner = useCompetitorScan()

  const [theme, setTheme] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    persistTheme(theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  useEffect(() => {
    if (import.meta.env.PROD && 'serviceWorker' in navigator && window.location.protocol !== 'file:') {
      const swUrl = `${import.meta.env.BASE_URL}sw.js`
      navigator.serviceWorker
        .register(swUrl)
        .then(() => navigator.serviceWorker.ready)
        .then(() => setOfflineReady(true))
        .catch(() => setOfflineReady(false))
    } else if (import.meta.env.DEV && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations
          .filter((registration) => registration.active?.scriptURL.endsWith('/sw.js'))
          .forEach((registration) => registration.unregister())
      })
    }

    const installHandler = (event: Event) => {
      event.preventDefault()
      setDeferredPrompt(event as BeforeInstallPromptEvent)
    }

    window.addEventListener('beforeinstallprompt', installHandler)
    return () => window.removeEventListener('beforeinstallprompt', installHandler)
  }, [])

  const {
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
  } = useDashboardData({
    content: ws.content,
    accounts: ws.accounts,
    goal: ws.goal,
    competitors: ws.competitors,
    competitorSnapshots: ws.competitorSnapshots,
    calendar: ws.calendar,
    query,
    platformFilter,
    calendarPlatformFilter,
  })

  const {
    pendingImport,
    setPendingImport,
    pendingRestore,
    setPendingRestore,
    fileInputRef,
    workspaceFileRef,
    reportRef,
    handleCSVImport,
    confirmImport,
    confirmRestoreWorkspace,
    handleExportJson,
    handleExportWorkspace,
    handleRestoreWorkspace,
    handleExportCsv,
    handleExportReport,
  } = useWorkspaceFiles({
    workspace: ws,
    normalizedContent,
    summaries,
    insights,
    experiments,
  })

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
    ws.captureWorkspaceUndo('生成排期前状态')
    if (ws.updateCalendar(nextCalendar)) toast.success('本周计划已生成，可在“账号”页撤销')
  }

  const copyPlan = async () => {
    const text = ws.calendar.map((item) => `${item.day} ${item.time}｜${item.platform}｜${item.title}｜${statusLabel[item.status]}`).join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('计划已复制')
    } catch {
      toast.error('剪贴板不可用，请手动复制排期')
    }
  }

  return (
    <div className="app-shell">
      <Toaster position="top-right" richColors closeButton />
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onInstall={handleInstall}
        showInstall={Boolean(deferredPrompt)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={handleCSVImport} />
      <input ref={workspaceFileRef} type="file" accept="application/json,.json" className="sr-only" onChange={handleRestoreWorkspace} />

      <main className="app-main">
        <section className={`workspace-header${activeView === 'overview' ? ' workspace-header--overview' : ''}`}>
          <div className="workspace-heading-row">
            <div className="workspace-title">
              <div className="eyebrow">{viewMeta[activeView].eyebrow}</div>
              <h1>{viewMeta[activeView].title}</h1>
              <p>{viewMeta[activeView].summary}</p>
            </div>
            <WorkspaceToolbar
              onImportClick={() => fileInputRef.current?.click()}
              onExportCsv={handleExportCsv}
              onExportJson={handleExportJson}
              onExportReport={handleExportReport}
            />
          </div>
          {activeView === 'overview' && (
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
                <strong>{offlineReady ? '可用' : '本地'}</strong>
                <span>{offlineReady ? '离线模式' : '浏览器保存'}</span>
              </p>
            </div>
          )}
        </section>

        <>
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
            onResetWorkspace={ws.resetWorkspace}
          />
          )}
        </>
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
