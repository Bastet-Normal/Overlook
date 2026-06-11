import { useEffect } from 'react'
import { Database } from 'lucide-react'
import type { ContentItem } from '../types'
import type { ImportColumnMapping, ParsedImportRow } from '../utils/importHelpers'
import { SectionTitle } from './SectionTitle'

export type ImportPreview = {
  filename: string
  accepted: ContentItem[]
  skipped: ParsedImportRow[]
  totalRows: number
  duplicateCount: number
  invalidCount: number
  mappings: ImportColumnMapping[]
  ignoredColumns: string[]
}

interface ImportPreviewModalProps {
  preview: ImportPreview
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

export function ImportPreviewModal({ preview, onCancel, onConfirm }: ImportPreviewModalProps) {
  useEscapeClose(onCancel)
  const recognizedCount = preview.mappings.filter((mapping) => mapping.source).length
  const missingRequired = preview.mappings.filter((mapping) => mapping.required && !mapping.source)

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-label="CSV 导入预览">
      <section className="modal-panel">
        <SectionTitle icon={<Database size={18} />} title="CSV 导入预览" action={preview.filename} />
        <div className="preview-metrics">
          <div>
            <strong>{preview.totalRows}</strong>
            <span>总行数</span>
          </div>
          <div>
            <strong>{preview.accepted.length}</strong>
            <span>可导入</span>
          </div>
          <div>
            <strong>{preview.duplicateCount}</strong>
            <span>重复</span>
          </div>
          <div>
            <strong>{preview.invalidCount}</strong>
            <span>无效</span>
          </div>
        </div>
        <div className="mapping-summary" aria-label="CSV 列识别结果">
          <div>
            <strong>{recognizedCount}</strong>
            <span>已识别字段</span>
          </div>
          <div>
            <strong>{preview.ignoredColumns.length}</strong>
            <span>忽略列</span>
          </div>
          <div className={missingRequired.length > 0 ? 'mapping-warning' : ''}>
            <strong>{missingRequired.length}</strong>
            <span>缺少必填</span>
          </div>
        </div>
        <div className="mapping-grid">
          {preview.mappings.map((mapping) => (
            <span className={mapping.source ? 'mapping-chip' : 'mapping-chip mapping-chip--missing'} key={mapping.field}>
              {mapping.label}
              <em>{mapping.source ?? (mapping.required ? '未匹配' : '默认')}</em>
            </span>
          ))}
          {preview.ignoredColumns.slice(0, 6).map((column) => (
            <span className="mapping-chip mapping-chip--ignored" key={`ignored-${column}`}>
              未使用
              <em>{column}</em>
            </span>
          ))}
        </div>
        <div className="preview-list">
          {preview.accepted.slice(0, 5).map((item) => (
            <div className="preview-row" key={item.id}>
              <strong>{item.title}</strong>
              <span>
                {item.platform} · {item.publishedAt} · {item.tags.join(', ') || '无标签'}
              </span>
            </div>
          ))}
          {preview.skipped.slice(0, 5).map((row) => (
            <div className="preview-row preview-row--warning" key={`skip-${row.rowNumber}`}>
              <strong>第 {row.rowNumber} 行跳过</strong>
              <span>{row.issues.join('、') || '无法识别'}</span>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button className="action-button action-button--ghost" onClick={onCancel} autoFocus>
            取消
          </button>
          <button className="action-button" onClick={onConfirm} disabled={preview.accepted.length === 0}>
            确认导入
          </button>
        </div>
      </section>
    </div>
  )
}
