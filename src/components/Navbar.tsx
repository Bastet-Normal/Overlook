import { BarChart3, User } from 'lucide-react'
import { Dispatch, SetStateAction } from 'react'

interface NavbarProps {
  activeTab: string
  setActiveTab: Dispatch<SetStateAction<'dashboard' | 'platforms' | 'insights' | 'accounts'>>
  onExport: () => void
  onImportClick: () => void
  onDownloadSample: () => void
  onClearImported: () => void
  hasImported: boolean
  onThemeToggle: () => void
}

export function Navbar({ activeTab, setActiveTab, onExport, onImportClick, onDownloadSample, onClearImported, hasImported, onThemeToggle }: NavbarProps) {
  const tabs = [
    { key: 'dashboard' as const, label: '概览' },
    { key: 'platforms' as const, label: '平台' },
    { key: 'insights' as const, label: '洞察' },
    { key: 'accounts' as const, label: '账号' },
  ]

  return (
    <nav className="apple-nav">
      <div className="max-w-7xl mx-auto px-8 flex items-center justify-between h-14">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#007AFF] rounded-full flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-semibold text-xl tracking-tight">Overlook</div>
            <div className="text-[10px] text-[#86868B] -mt-1">Creator Insights</div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`apple-btn px-4 py-1.5 text-sm rounded-full transition-all ${
                activeTab === tab.key 
                  ? 'bg-[#1D1D1F] text-white' 
                  : 'hover:bg-[#E8E8ED] text-[#1D1D1F]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onExport} className="apple-btn apple-btn-secondary text-sm">
            <Download className="w-4 h-4" /> 导出报告
          </button>
          <button onClick={onImportClick} className="apple-btn apple-btn-secondary text-sm">
            <Upload className="w-4 h-4" /> 导入CSV
          </button>
          <button onClick={onDownloadSample} className="apple-btn apple-btn-ghost text-sm">
            下载示例 CSV
          </button>
          {hasImported && (
            <button onClick={onClearImported} className="apple-btn apple-btn-ghost text-sm text-[#FF3B30]">
              清除导入
            </button>
          )}
          <button 
            onClick={onThemeToggle} 
            className="apple-btn apple-btn-secondary p-2"
            title="切换主题 (Apple-like)"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 bg-[#E8E8ED] dark:bg-[#2C2C2E] rounded-full flex items-center justify-center">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </nav>
  )
}
