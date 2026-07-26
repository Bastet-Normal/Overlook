import { useEffect, useRef } from 'react'
import { ChevronDown, Download, FileJson, FileText, Upload } from 'lucide-react'

interface WorkspaceToolbarProps {
  onImportClick: () => void
  onExportCsv: () => void
  onExportJson: () => void
  onExportReport: () => void
}

export function WorkspaceToolbar({
  onImportClick,
  onExportCsv,
  onExportJson,
  onExportReport,
}: WorkspaceToolbarProps) {
  const menuRef = useRef<HTMLDetailsElement>(null)

  useEffect(() => {
    const closeMenu = () => menuRef.current?.removeAttribute('open')
    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) closeMenu()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const runExport = (action: () => void) => {
    menuRef.current?.removeAttribute('open')
    action()
  }

  return (
    <div className="workspace-toolbar" aria-label="工作区快捷操作">
      <button className="action-button" onClick={onImportClick}>
        <Upload size={15} />
        导入
      </button>
      <details className="export-menu" ref={menuRef}>
        <summary className="action-button action-button--ghost">
          <Download size={15} />
          导出
          <ChevronDown size={14} />
        </summary>
        <div className="export-menu__panel">
          <button className="toolbar-button" onClick={() => runExport(onExportCsv)}>
            <Download size={15} />
            <span>内容数据</span>
            <small>CSV</small>
          </button>
          <button className="toolbar-button" onClick={() => runExport(onExportJson)}>
            <FileJson size={15} />
            <span>工作区数据</span>
            <small>JSON</small>
          </button>
          <button className="toolbar-button" onClick={() => runExport(onExportReport)}>
            <FileText size={15} />
            <span>合作报告</span>
            <small>PDF</small>
          </button>
        </div>
      </details>
    </div>
  )
}
