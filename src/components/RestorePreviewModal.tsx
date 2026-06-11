import { useEffect } from 'react'
import { ShieldCheck } from 'lucide-react'
import type { WorkspaceSnapshot } from '../types'
import { plainNumber } from '../utils/dashboardHelpers'
import { SectionTitle } from './SectionTitle'

export type RestorePreview = {
  filename: string
  snapshot: WorkspaceSnapshot
  version: number
  exportedAt?: string
  metrics: Array<{ label: string; current: number; incoming: number }>
}

interface RestorePreviewModalProps {
  preview: RestorePreview
  onCancel: () => void
  onConfirm: () => void
}

function useEscapeClose(onClose: () => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])
}

export function RestorePreviewModal({ preview, onCancel, onConfirm }: RestorePreviewModalProps) {
  useEscapeClose(onCancel)
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="工作区恢复预览">
      <section className="modal-panel">
        <SectionTitle icon={<ShieldCheck size={18} />} title="恢复前确认" action={preview.filename} />
        <div className="restore-meta">
          <span>备份版本 v{preview.version}</span>
          <span>{preview.exportedAt ? new Date(preview.exportedAt).toLocaleString('zh-CN') : '未记录导出时间'}</span>
        </div>
        <div className="restore-grid">
          {preview.metrics.map((metric) => (
            <div className="restore-card" key={metric.label}>
              <span>{metric.label}</span>
              <strong>
                {plainNumber.format(metric.current)} <em>→</em> {plainNumber.format(metric.incoming)}
              </strong>
            </div>
          ))}
        </div>
        <div className="preview-row preview-row--warning">
          <strong>确认后会替换当前本地工作区</strong>
          <span>建议先导出当前工作区备份；取消不会改动任何本地数据。</span>
        </div>
        <div className="modal-actions">
          <button className="action-button action-button--ghost" onClick={onCancel} autoFocus>
            取消
          </button>
          <button className="action-button" onClick={onConfirm}>
            确认恢复
          </button>
        </div>
      </section>
    </div>
  )
}
