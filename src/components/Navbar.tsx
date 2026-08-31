import { BarChart3, CalendarDays, Database, Gauge, Moon, Radar, Sun, UserRound } from 'lucide-react'
import type { ViewKey } from '../types'

interface NavbarProps {
  activeView: ViewKey
  onViewChange: (view: ViewKey) => void
  onInstall?: () => void
  showInstall: boolean
  theme: 'dark' | 'light'
  onToggleTheme: () => void
}

const tabs: Array<{ key: ViewKey; label: string; icon: typeof Gauge }> = [
  { key: 'overview', label: '总览', icon: Gauge },
  { key: 'content', label: '内容库', icon: Database },
  { key: 'planner', label: '计划', icon: CalendarDays },
  { key: 'benchmarks', label: '对标', icon: Radar },
  { key: 'accounts', label: '账号', icon: UserRound },
]

export function Navbar({
  activeView,
  onViewChange,
  onInstall,
  showInstall,
  theme,
  onToggleTheme,
}: NavbarProps) {
  const renderTabs = (className: string) => (
    <nav className={className} aria-label="主视图">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const active = activeView === tab.key
        return (
          <button
            key={tab.key}
            data-view={tab.key}
            className={active ? 'tab-button tab-button--active' : 'tab-button'}
            onClick={() => onViewChange(tab.key)}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={15} />
            <span>{tab.label}</span>
          </button>
        )
      })}
    </nav>
  )

  return (
    <>
      <header className="app-nav">
        <div className="app-nav__inner">
          <button className="brand-button" onClick={() => onViewChange('overview')} aria-label="回到总览">
            <span className="brand-mark">
              <BarChart3 size={18} />
            </span>
            <span>
              <strong>Overlook</strong>
              <small>Creator Ops</small>
            </span>
          </button>

          {renderTabs('tab-strip tab-strip--desktop')}

          <div className="nav-actions nav-actions--quiet" aria-label="外观与工作区">
            <div className="sidebar-state">
              <span className="sidebar-state__dot" />
              <span>
                <strong>本地工作区</strong>
                <small>数据仅保存在此设备</small>
              </span>
            </div>
            <div className="command-group command-group--quiet">
              <button
                className="action-button action-button--ghost"
                onClick={onToggleTheme}
                title={theme === 'dark' ? '切换至亮色模式' : '切换至暗色模式'}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                <span>{theme === 'dark' ? '亮色' : '暗色'}</span>
              </button>
              {showInstall && onInstall && (
                <button className="action-button action-button--install" onClick={onInstall}>
                  安装
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
      {renderTabs('tab-strip tab-strip--mobile')}
    </>
  )
}
