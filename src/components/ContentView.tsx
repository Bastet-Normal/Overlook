import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Plus, Search, Download, Trash2, X } from 'lucide-react'
import type { ContentIntent, ContentItem, Platform } from '../types'
import { PLATFORMS } from '../types'
import { formatNumber, intentLabel, intentOptions, toNumber } from '../utils/dashboardHelpers'
import { splitTags } from '../utils/importHelpers'
import { platformSoftColors, platformColors } from '../utils/mockData'
import { SectionTitle } from './SectionTitle'

interface ContentViewProps {
  filteredContent: ContentItem[]
  query: string
  setQuery: (val: string) => void
  platformFilter: 'all' | Platform
  setPlatformFilter: (val: 'all' | Platform) => void
  onAddContent: (draft: Omit<ContentItem, 'id'>) => void
  onDeleteContent: (id: string) => void
  onExportCsv: () => void
}

const emptyDraft = (): Omit<ContentItem, 'id'> => ({
  platform: 'Bilibili',
  title: '',
  type: '长视频',
  publishedAt: new Date().toISOString().slice(0, 10),
  hour: 10,
  views: 0,
  likes: 0,
  comments: 0,
  shares: 0,
  saves: 0,
  followersGained: 0,
  pillar: '内容增长',
  campaign: '默认系列',
  tags: [],
  audience: '个人创作者',
  hook: '',
  intent: 'growth',
})

export function ContentView({
  filteredContent,
  query,
  setQuery,
  platformFilter,
  setPlatformFilter,
  onAddContent,
  onDeleteContent,
  onExportCsv,
}: ContentViewProps) {
  const [draft, setDraft] = useState<Omit<ContentItem, 'id'>>(emptyDraft)
  const [isComposerOpen, setIsComposerOpen] = useState(false)

  useEffect(() => {
    if (!isComposerOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsComposerOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isComposerOpen])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.title.trim()) {
      return
    }
    onAddContent(draft)
    setDraft({
      ...emptyDraft(),
      platform: draft.platform,
      type: draft.type,
      hour: draft.hour,
    })
    setIsComposerOpen(false)
  }

  return (
    <div className="view-stack view-stack--content">
      {isComposerOpen && (
        <>
          <button className="composer-backdrop" onClick={() => setIsComposerOpen(false)} aria-label="关闭新增内容面板" />
          <section className="composer-drawer" role="dialog" aria-modal="true" aria-labelledby="composer-title">
            <header className="composer-drawer__header">
              <div>
                <span>内容资产</span>
                <h2 id="composer-title">新增内容</h2>
                <p>先录入核心表现，需要时再补充内容标签。</p>
              </div>
              <button className="icon-button" onClick={() => setIsComposerOpen(false)} aria-label="关闭新增内容">
                <X size={18} />
              </button>
            </header>
            <form className="content-form content-form--drawer" onSubmit={handleSubmit}>
          <label>
            平台
            <select value={draft.platform} onChange={(event) => setDraft({ ...draft, platform: event.target.value as Platform })}>
              {PLATFORMS.map((platform) => (
                <option key={platform}>{platform}</option>
              ))}
            </select>
          </label>
          <label className="span-2">
            标题
            <input value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="内容标题" />
          </label>
          <label>
            类型
            <input value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} />
          </label>
          <label>
            日期
            <input type="date" value={draft.publishedAt} onChange={(event) => setDraft({ ...draft, publishedAt: event.target.value })} />
          </label>
          <label>
            小时
            <input type="number" min="0" max="23" value={draft.hour} onChange={(event) => setDraft({ ...draft, hour: Math.min(23, Math.max(0, toNumber(event.target.value))) })} />
          </label>
          <label>
            播放
            <input type="number" min="0" value={draft.views} onChange={(event) => setDraft({ ...draft, views: toNumber(event.target.value) })} />
          </label>
          <label>
            点赞
            <input type="number" min="0" value={draft.likes} onChange={(event) => setDraft({ ...draft, likes: toNumber(event.target.value) })} />
          </label>
          <label>
            收藏
            <input type="number" min="0" value={draft.saves} onChange={(event) => setDraft({ ...draft, saves: toNumber(event.target.value) })} />
          </label>
          <label>
            涨粉
            <input
              type="number"
              min="0"
              value={draft.followersGained}
              onChange={(event) => setDraft({ ...draft, followersGained: toNumber(event.target.value) })}
            />
          </label>
          <label>
            支柱
            <input value={draft.pillar} onChange={(event) => setDraft({ ...draft, pillar: event.target.value })} />
          </label>
          <label>
            系列
            <input value={draft.campaign} onChange={(event) => setDraft({ ...draft, campaign: event.target.value })} />
          </label>
          <label className="span-2">
            标签
            <input value={draft.tags.join(', ')} onChange={(event) => setDraft({ ...draft, tags: splitTags(event.target.value) })} placeholder="模板, 工具, 复盘" />
          </label>
          <label>
            受众
            <input value={draft.audience} onChange={(event) => setDraft({ ...draft, audience: event.target.value })} />
          </label>
          <label className="span-2">
            钩子
            <input value={draft.hook} onChange={(event) => setDraft({ ...draft, hook: event.target.value })} placeholder="开头承诺或反差点" />
          </label>
          <label>
            意图
            <select value={draft.intent} onChange={(event) => setDraft({ ...draft, intent: event.target.value as ContentIntent })}>
              {intentOptions.map((intent) => (
                <option value={intent} key={intent}>
                  {intentLabel[intent]}
                </option>
              ))}
            </select>
          </label>
              <div className="composer-drawer__actions">
                <button className="action-button action-button--ghost" type="button" onClick={() => setIsComposerOpen(false)}>
                  取消
                </button>
                <button className="action-button" type="submit">
                  <Plus size={16} />
                  保存内容
                </button>
              </div>
            </form>
          </section>
        </>
      )}

      <section className="panel content-library">
        <div className="content-library__heading">
          <SectionTitle icon={<Search size={18} />} title="内容资产" action={`${filteredContent.length} 条`} />
          <button className="action-button" onClick={() => setIsComposerOpen(true)}>
            <Plus size={16} />
            新增内容
          </button>
        </div>
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="搜索标题、标签、受众、系列"
              aria-label="搜索内容库"
            />
          </div>
          <select
            value={platformFilter}
            onChange={(event) => setPlatformFilter(event.target.value as 'all' | Platform)}
            aria-label="按平台筛选内容"
          >
            <option value="all">全部平台</option>
            {PLATFORMS.map((platform) => (
              <option key={platform}>{platform}</option>
            ))}
          </select>
          <button className="action-button action-button--ghost" onClick={onExportCsv}>
            <Download size={16} />
            CSV
          </button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>内容</th>
                <th>平台</th>
                <th>播放</th>
                <th>互动</th>
                <th>收藏</th>
                <th>日期</th>
                <th aria-label="操作" />
              </tr>
            </thead>
            <tbody>
              {filteredContent.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: '28px' }}>
                    暂无内容记录。点击“新增内容”录入，或使用页面顶部的“导入”。
                  </td>
                </tr>
              ) : (
                filteredContent.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <strong>{item.title}</strong>
                      <small>
                        {item.type} · {item.pillar} · {item.campaign} · {item.audience} · {intentLabel[item.intent]}
                      </small>
                      <div className="tag-row">
                        {item.tags.slice(0, 4).map((tag) => (
                          <span key={`${item.id}-${tag}`}>{tag}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="platform-chip" style={{ background: platformSoftColors[item.platform], color: platformColors[item.platform] }}>
                        {item.platform}
                      </span>
                    </td>
                    <td>{formatNumber(item.views)}</td>
                    <td>{formatNumber(item.likes + item.comments + item.shares + item.saves)}</td>
                    <td>{formatNumber(item.saves)}</td>
                    <td>
                      {item.publishedAt.slice(5)} {String(item.hour).padStart(2, '0')}:00
                    </td>
                    <td>
                      <button
                        className="icon-button icon-button--danger"
                        onClick={() => onDeleteContent(item.id)}
                        aria-label={`删除 ${item.title}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
