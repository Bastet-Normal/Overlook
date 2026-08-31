import { ShieldCheck, Smartphone, FileText, Download, Database, Undo2, CheckCircle2, AlertTriangle, RefreshCw, Upload, FileDown, Link2 } from 'lucide-react'
import type { Account, Platform } from '../types'
import type { WorkspaceUndo } from '../hooks/useWorkspaceState'
import { accountStatusLabel, toNumber } from '../utils/dashboardHelpers'
import { SectionTitle } from './SectionTitle'

interface AccountsViewProps {
  accounts: Account[]
  onUpdateAccount: (platform: Platform, patch: Partial<Account>) => void
  contentCounts: Record<Platform, number>
  onImportClick: () => void
  onDownloadTemplate: () => void
  offlineReady: boolean
  contentLength: number
  sponsorScore: number
  competitorsLength: number
  onExportWorkspace: () => void
  onRestoreWorkspaceClick: () => void
  lastWorkspaceUndo: WorkspaceUndo | null
  onRestoreLastWorkspaceUndo: () => void
  hideSensitiveInReport: boolean
  setHideSensitiveInReport: (val: boolean | ((curr: boolean) => boolean)) => void
  onResetWorkspace: () => void
}

function HealthRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="health-row">
      {ok ? <CheckCircle2 size={16} className="positive" /> : <AlertTriangle size={16} className="negative" />}
      <span>{label}</span>
    </div>
  )
}

export function AccountsView({
  accounts,
  onUpdateAccount,
  contentCounts,
  onImportClick,
  onDownloadTemplate,
  offlineReady,
  contentLength,
  sponsorScore,
  competitorsLength,
  onExportWorkspace,
  onRestoreWorkspaceClick,
  lastWorkspaceUndo,
  onRestoreLastWorkspaceUndo,
  hideSensitiveInReport,
  setHideSensitiveInReport,
  onResetWorkspace,
}: AccountsViewProps) {
  return (
    <div className="view-stack view-stack--accounts">
      <section className="panel sync-center">
        <div className="sync-center__heading">
          <SectionTitle icon={<Link2 size={18} />} title="数据同步中心" action="本地优先" />
          <div className="section-actions">
            <button className="action-button" onClick={onImportClick}><Upload size={16} />导入平台数据</button>
            <button className="action-button action-button--ghost" onClick={onDownloadTemplate}><FileDown size={16} />下载模板</button>
          </div>
        </div>
        <p className="sync-center__notice">当前版本通过 CSV 或手动维护同步数据；只有配置官方接口后才能标记为“接口连接”。模拟竞品数据会始终单独标识，不计作真实同步。</p>
        <div className="sync-source-grid">
          {accounts.map((account) => (
            <article key={`source-${account.platform}`}>
              <div><strong>{account.platform}</strong><span className={`source-status source-status--${account.status}`}>{accountStatusLabel[account.status]}</span></div>
              <p>{contentCounts[account.platform]} 条内容 · {account.followers.toLocaleString('zh-CN')} 粉丝</p>
              <small>最近维护 {account.lastSync || '未记录'}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="account-grid">
        {accounts.map((account) => (
          <article className="panel account-card" key={account.platform}>
            <SectionTitle icon={<ShieldCheck size={18} />} title={account.platform} action={accountStatusLabel[account.status]} />
            <label>
              账号
              <input
                value={account.handle}
                onChange={(event) => onUpdateAccount(account.platform, { handle: event.target.value, status: 'manual' })}
              />
            </label>
            <label>
              粉丝
              <input
                type="number"
                min="0"
                value={account.followers}
                onChange={(event) => onUpdateAccount(account.platform, { followers: toNumber(event.target.value), status: 'manual' })}
              />
            </label>
            <label>
              状态
              <select
                value={account.status}
                onChange={(event) => onUpdateAccount(account.platform, { status: event.target.value as Account['status'] })}
              >
                <option value="connected">接口连接（需配置）</option>
                <option value="manual">手动维护</option>
                <option value="missing">待配置</option>
              </select>
            </label>
            <small>最后更新：{account.lastSync}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <SectionTitle icon={<Smartphone size={18} />} title="离线能力" action={offlineReady ? '已就绪' : '准备中'} />
          <div className="health-list">
            <HealthRow ok={offlineReady} label="页面离线缓存" />
            <HealthRow ok={contentLength > 0} label="本地数据" />
            <HealthRow ok={sponsorScore >= 60} label="合作报告素材" />
            <HealthRow ok={competitorsLength > 0} label="竞品样本" />
          </div>
        </article>

        <article className="panel">
          <SectionTitle icon={<FileText size={18} />} title="数据安全" action="v4 · 单文档" />
          <div className="backup-actions">
            <button className="action-button" onClick={onExportWorkspace}>
              <Download size={16} />
              导出工作区
            </button>
            <button className="action-button action-button--ghost" onClick={onRestoreWorkspaceClick}>
              <Database size={16} />
              恢复工作区
            </button>
            <button className="action-button action-button--danger" onClick={onResetWorkspace}>
              <RefreshCw size={16} />
              恢复示例
            </button>
          </div>
          {lastWorkspaceUndo && (
            <div className="undo-card">
              <div>
                <strong>{lastWorkspaceUndo.label}</strong>
                <span>{new Date(lastWorkspaceUndo.capturedAt).toLocaleString('zh-CN')}</span>
              </div>
              <button className="action-button action-button--ghost" onClick={onRestoreLastWorkspaceUndo}>
                <Undo2 size={15} />
                撤销
              </button>
            </div>
          )}
          <label className="toggle-row">
            <input type="checkbox" checked={hideSensitiveInReport} onChange={(event) => setHideSensitiveInReport(event.target.checked)} />
            <span>报告中隐藏账号 handle</span>
          </label>
          <div className="health-list">
            <HealthRow ok label="完整工作区备份" />
            <HealthRow ok label="逐字段恢复校验" />
            {lastWorkspaceUndo && <HealthRow ok label="最近一次大改可撤销" />}
            <HealthRow ok label="原子化本地工作区" />
          </div>
        </article>
      </section>
    </div>
  )
}
