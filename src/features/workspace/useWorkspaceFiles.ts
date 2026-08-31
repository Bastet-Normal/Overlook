import { useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import Papa from 'papaparse'
import { toast } from 'sonner'

import type { ImportPreview } from '../../components/ImportPreviewModal'
import type { RestorePreview } from '../../components/RestorePreviewModal'
import type { PlatformSummary, WorkspaceSnapshot } from '../../types'
import { MAX_CONTENT_ITEMS, validateWorkspaceSnapshot, WORKSPACE_VERSION } from '../../domain/workspaceSchema'
import type { ActionExperiment } from '../../utils/calendarHelpers'
import { downloadBlob, intentLabel } from '../../utils/dashboardHelpers'
import {
  buildImportMapping,
  contentKey,
  normalizeContentItem,
  parseImportedRow,
} from '../../utils/importHelpers'
import type { useWorkspaceState } from '../../hooks/useWorkspaceState'
import { exportElementToPdf } from '../../services/pdfReport'

type WorkspaceController = ReturnType<typeof useWorkspaceState>

type WorkspaceFilesInput = {
  workspace: WorkspaceController
  normalizedContent: WorkspaceSnapshot['content']
  summaries: PlatformSummary[]
  insights: string[]
  experiments: ActionExperiment[]
}

export function useWorkspaceFiles({
  workspace,
  normalizedContent,
  summaries,
  insights,
  experiments,
}: WorkspaceFilesInput) {
  const [pendingImport, setPendingImport] = useState<ImportPreview | null>(null)
  const [pendingRestore, setPendingRestore] = useState<RestorePreview | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const workspaceFileRef = useRef<HTMLInputElement>(null)
  const reportRef = useRef<HTMLDivElement>(null)

  const handleCSVImport = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) {
      toast.error('CSV 不能超过 5 MB')
      event.currentTarget.value = ''
      return
    }

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length > MAX_CONTENT_ITEMS) {
          toast.error(`单次最多导入 ${MAX_CONTENT_ITEMS.toLocaleString('zh-CN')} 条内容`)
          return
        }
        if (results.errors.length > 0) {
          toast.error(`CSV 有 ${results.errors.length} 处解析错误，请检查格式`)
          return
        }

        const existingKeys = new Set(normalizedContent.map(contentKey))
        const headers = results.meta.fields?.filter(Boolean) ?? Object.keys(results.data[0] ?? {})
        const { mappings, ignoredColumns } = buildImportMapping(headers)
        const parsedRows = results.data.map((row, index) => {
          const parsed = parseImportedRow(row, index, existingKeys, mappings)
          if (parsed.item && !parsed.duplicate) existingKeys.add(contentKey(parsed.item))
          return parsed
        })
        const accepted = parsedRows
          .filter((row): row is typeof row & { item: WorkspaceSnapshot['content'][number] } => Boolean(row.item) && !row.duplicate)
          .map((row) => row.item)
        const skipped = parsedRows.filter((row) => !row.item || row.duplicate)
        const preview: ImportPreview = {
          filename: file.name,
          accepted,
          skipped,
          totalRows: results.data.length,
          duplicateCount: parsedRows.filter((row) => row.duplicate).length,
          invalidCount: parsedRows.filter((row) => !row.item).length,
          mappings,
          ignoredColumns,
        }
        setPendingImport(preview)
        if (accepted.length === 0) toast.error('没有识别到有效内容')
        else toast.info(`已解析 ${accepted.length} 条可导入内容`)
      },
      error: () => toast.error('CSV 解析失败'),
    })

    event.currentTarget.value = ''
  }

  const confirmImport = () => {
    if (!pendingImport || pendingImport.accepted.length === 0) return
    workspace.captureWorkspaceUndo('导入前状态')
    if (workspace.updateContent((current) => [...pendingImport.accepted, ...current])) {
      toast.success(`已导入 ${pendingImport.accepted.length} 条内容`)
      setPendingImport(null)
    }
  }

  const confirmRestoreWorkspace = () => {
    if (!pendingRestore) return
    workspace.captureWorkspaceUndo('恢复前状态')
    if (workspace.applyWorkspaceSnapshot(pendingRestore.snapshot)) {
      setPendingRestore(null)
      toast.success('工作区已恢复')
    }
  }

  const handleExportJson = () => {
    const payload: WorkspaceSnapshot & {
      summaries: PlatformSummary[]
      insights: string[]
      experiments: ActionExperiment[]
    } = {
      version: WORKSPACE_VERSION,
      exportedAt: new Date().toISOString(),
      content: normalizedContent,
      accounts: workspace.accounts,
      goal: workspace.goal,
      competitors: workspace.competitors,
      competitorSnapshots: workspace.competitorSnapshots,
      calendar: workspace.calendar,
      summaries,
      insights,
      experiments,
    }
    downloadBlob(
      JSON.stringify(payload, null, 2),
      'application/json;charset=utf-8',
      `overlook-report-${new Date().toISOString().slice(0, 10)}.json`,
    )
    toast.success('JSON 已导出')
  }

  const handleExportWorkspace = () => {
    downloadBlob(
      JSON.stringify(workspace.createWorkspaceSnapshot(), null, 2),
      'application/json;charset=utf-8',
      `overlook-workspace-${new Date().toISOString().slice(0, 10)}.json`,
    )
    toast.success('工作区备份已导出')
  }

  const handleRestoreWorkspace = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      toast.error('工作区备份不能超过 10 MB')
      event.currentTarget.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      try {
        const result = validateWorkspaceSnapshot(JSON.parse(String(reader.result)))
        if (!result.success) {
          toast.error(result.errors[0] ?? '备份文件结构不正确')
          return
        }
        const snapshot: WorkspaceSnapshot = {
          ...result.data,
          content: result.data.content.map(normalizeContentItem),
        }
        setPendingRestore({
          filename: file.name,
          snapshot,
          version: snapshot.version,
          exportedAt: snapshot.exportedAt,
          metrics: [
            { label: '内容', current: normalizedContent.length, incoming: snapshot.content.length },
            { label: '账号', current: workspace.accounts.length, incoming: snapshot.accounts.length },
            { label: '竞品', current: workspace.competitors.length, incoming: snapshot.competitors.length },
            {
              label: '快照',
              current: workspace.competitorSnapshots.length,
              incoming: snapshot.competitorSnapshots.length,
            },
            { label: '排期', current: workspace.calendar.length, incoming: snapshot.calendar.length },
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
      { escapeFormulae: true },
    )
    downloadBlob(
      csv,
      'text/csv;charset=utf-8',
      `overlook-content-${new Date().toISOString().slice(0, 10)}.csv`,
    )
    toast.success('CSV 已导出')
  }

  const handleDownloadImportTemplate = () => {
    const template = Papa.unparse([
      {
        平台: 'Douyin',
        标题: '示例：把平台导出的数据粘贴到对应列',
        类型: '短视频',
        日期: new Date().toISOString().slice(0, 10),
        小时: 12,
        播放量: 0,
        点赞: 0,
        评论: 0,
        分享: 0,
        收藏: 0,
        涨粉: 0,
        内容支柱: '内容增长',
        活动: '默认系列',
        标签: '示例,待替换',
        受众: '目标受众',
        钩子: '开场钩子',
        意图: '拉新',
      },
    ], { escapeFormulae: true })
    downloadBlob(`\uFEFF${template}`, 'text/csv;charset=utf-8', 'overlook-import-template.csv')
    toast.success('导入模板已下载')
  }

  const handleExportReport = async () => {
    if (!reportRef.current) return
    const toastId = toast.loading('正在生成报告')
    try {
      await exportElementToPdf(
        reportRef.current,
        `overlook-brand-report-${new Date().toISOString().slice(0, 10)}.pdf`,
      )
      toast.success('品牌报告 PDF 已生成', { id: toastId })
    } catch {
      toast.error('PDF 生成失败', { id: toastId })
    }
  }

  return {
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
    handleDownloadImportTemplate,
    handleExportReport,
  }
}
