import { useEffect, useRef, useState } from 'react'
import type { CompetitorDraft, Platform } from '../types'
import { estimateCompetitorFromHandle } from '../utils/dashboardHelpers'
import { fetchExternalCompetitorScan } from '../utils/importHelpers'

const EXTERNAL_SCAN_ENDPOINT = String(import.meta.env.VITE_OVERLOOK_SCAN_ENDPOINT ?? '').trim()
const SCAN_PENDING_MESSAGE = EXTERNAL_SCAN_ENDPOINT ? '正在扫描外部数据源' : '正在生成本地估算'

export const emptyCompetitorDraft: CompetitorDraft = {
  platform: 'Xiaohongshu',
  name: '',
  followers: 0,
  avgViews: 0,
  engagementRate: 0,
  angle: '',
  scanSource: 'manual',
  scanConfidence: 0,
  scannedAt: '',
}

export function useCompetitorScan() {
  const [competitorDraft, setCompetitorDraft] = useState<CompetitorDraft>(emptyCompetitorDraft)
  const [competitorScan, setCompetitorScan] = useState<{ status: 'idle' | 'scanning' | 'ready' | 'manual'; message: string }>({
    status: 'idle',
    message: '输入账号后自动扫描',
  })
  const scanRequestRef = useRef(0)

  useEffect(() => {
    const name = competitorDraft.name.trim()
    const platform = competitorDraft.platform
    if (!name) {
      return
    }

    const requestId = scanRequestRef.current + 1
    scanRequestRef.current = requestId
    let controller: AbortController | null = null
    const timer = window.setTimeout(async () => {
      if (scanRequestRef.current !== requestId) return
      let scannedDraft = estimateCompetitorFromHandle(platform, name)
      let scanMessage = `本地估算 · 可信度 ${scannedDraft.scanConfidence}%`

      if (EXTERNAL_SCAN_ENDPOINT) {
        controller = new AbortController()
        const timeout = window.setTimeout(() => controller?.abort(), 3500)
        try {
          const externalDraft = await fetchExternalCompetitorScan(EXTERNAL_SCAN_ENDPOINT, platform, name, controller.signal)
          if (externalDraft) {
            scannedDraft = externalDraft
            scanMessage = `外部数据 · 可信度 ${externalDraft.scanConfidence}%`
          } else {
            scanMessage = `接口无有效数据 · ${scanMessage}`
          }
        } catch {
          scanMessage = `接口不可用 · ${scanMessage}`
        } finally {
          window.clearTimeout(timeout)
        }
      }

      if (scanRequestRef.current !== requestId) return
      setCompetitorDraft((current: CompetitorDraft) => {
        if (current.name.trim() !== name || current.platform !== platform) return current
        return { ...current, ...scannedDraft }
      })
      setCompetitorScan({ status: 'ready', message: scanMessage })
    }, 650)

    return () => {
      window.clearTimeout(timer)
      controller?.abort()
    }
  }, [competitorDraft.name, competitorDraft.platform])

  const markCompetitorDraftManual = (patch: Partial<CompetitorDraft>) => {
    scanRequestRef.current += 1
    setCompetitorDraft((current: CompetitorDraft) => ({
      ...current,
      ...patch,
      scanSource: 'manual',
      scanConfidence: 100,
      scannedAt: new Date().toISOString(),
    }))
    setCompetitorScan({ status: 'manual', message: '手动修正 · 以你填写为准' })
  }

  const triggerScanPending = (_platform: Platform, name: string) => {
    if (name.trim()) {
      setCompetitorScan({ status: 'scanning', message: SCAN_PENDING_MESSAGE })
    } else {
      setCompetitorScan({ status: 'idle', message: '输入账号后自动扫描' })
    }
  }

  const resetCompetitorScan = () => {
    setCompetitorDraft(emptyCompetitorDraft)
    setCompetitorScan({ status: 'idle', message: '输入账号后自动扫描' })
  }

  return {
    competitorDraft,
    setCompetitorDraft,
    competitorScan,
    setCompetitorScan,
    markCompetitorDraftManual,
    triggerScanPending,
    resetCompetitorScan,
  }
}
export { SCAN_PENDING_MESSAGE }
