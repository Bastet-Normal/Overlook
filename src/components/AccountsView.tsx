import { ShieldCheck, Smartphone, FileText, Download, Database, Undo2, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { Account } from '../types'
import type { WorkspaceUndo } from '../hooks/useWorkspaceState'
import { accountStatusLabel, toNumber } from '../utils/dashboardHelpers'
import { SectionTitle } from './SectionTitle'

interface AccountsViewProps {
  accounts: Account[]
  setAccounts: (val: Account[] | ((curr: Account[]) => Account[])) => void
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
  setAccounts,
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
}: AccountsViewProps) {
  return (
    <div className="view-stack view-stack--accounts">
      <section className="account-grid">
        {accounts.map((account) => (
          <article className="panel account-card" key={account.platform}>
            <SectionTitle icon={<ShieldCheck size={18} />} title={account.platform} action={accountStatusLabel[account.status]} />
            <label>
              账号
              <input
                value={account.handle}
                onChange={(event) =>
                  setAccounts((current) =>
                    current.map((entry) => (entry.platform === account.platform ? { ...entry, handle: event.target.value } : entry)),
                  )
                }
              />
            </label>
            <label>
              粉丝
              <input
                type="number"
                min="0"
                value={account.followers}
                onChange={(event) =>
                  setAccounts((current) =>
                    current.map((entry) =>
                      entry.platform === account.platform ? { ...entry, followers: toNumber(event.target.value), status: 'manual' } : entry,
                    ),
                  )
                }
              />
            </label>
            <label>
              状态
              <select
                value={account.status}
                onChange={(event) =>
                  setAccounts((current) =>
                    current.map((entry) =>
                      entry.platform === account.platform ? { ...entry, status: event.target.value as Account['status'] } : entry,
                    ),
                  )
                }
              >
                <option value="connected">connected</option>
                <option value="manual">manual</option>
                <option value="missing">missing</option>
              </select>
            </label>
            <small>Last sync: {account.lastSync}</small>
          </article>
        ))}
      </section>

      <section className="dashboard-grid">
        <article className="panel">
          <SectionTitle icon={<Smartphone size={18} />} title="PWA" action={offlineReady ? '离线就绪' : '等待缓存'} />
          <div className="health-list">
            <HealthRow ok={offlineReady} label="Service Worker" />
            <HealthRow ok={contentLength > 0} label="本地数据" />
            <HealthRow ok={sponsorScore >= 60} label="合作报告素材" />
            <HealthRow ok={competitorsLength > 0} label="竞品样本" />
          </div>
        </article>

        <article className="panel">
          <SectionTitle icon={<FileText size={18} />} title="数据安全" action="v3" />
          <div className="backup-actions">
            <button className="action-button" onClick={onExportWorkspace}>
              <Download size={16} />
              导出工作区
            </button>
            <button className="action-button action-button--ghost" onClick={onRestoreWorkspaceClick}>
              <Database size={16} />
              恢复工作区
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
            <HealthRow ok label="恢复前结构校验" />
            {lastWorkspaceUndo && <HealthRow ok label="最近一次大改可撤销" />}
            <HealthRow ok label="本地优先存储" />
          </div>
        </article>
      </section>
    </div>
  )
}
