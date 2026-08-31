import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Download, Eye, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import type { ContentIntent, ContentItem, Platform } from '../types'
import { PLATFORMS } from '../types'
import { formatNumber, intentLabel, intentOptions, toNumber } from '../utils/dashboardHelpers'
import { splitTags } from '../utils/importHelpers'
import { platformColors, platformSoftColors } from '../utils/mockData'
import { SectionTitle } from './SectionTitle'
import { ContentReviewDrawer } from './ContentReviewDrawer'

type ContentDraft = Omit<ContentItem, 'id'>
type SortMode = 'newest' | 'views' | 'engagement' | 'saves'

interface ContentViewProps {
  allContent: ContentItem[]
  filteredContent: ContentItem[]
  query: string
  setQuery: (val: string) => void
  platformFilter: 'all' | Platform
  setPlatformFilter: (val: 'all' | Platform) => void
  onAddContent: (draft: ContentDraft) => void
  onUpdateContent: (id: string, draft: ContentDraft) => void
  onDeleteContent: (id: string) => void
  onExportCsv: () => void
}

const emptyDraft = (): ContentDraft => ({
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

const toDraft = (item: ContentItem): ContentDraft => {
  const { id, ...draft } = item
  void id
  return draft
}
const engagementOf = (item: ContentItem) => item.likes + item.comments + item.shares + item.saves

export function ContentView({
  allContent,
  filteredContent,
  query,
  setQuery,
  platformFilter,
  setPlatformFilter,
  onAddContent,
  onUpdateContent,
  onDeleteContent,
  onExportCsv,
}: ContentViewProps) {
  const [draft, setDraft] = useState<ContentDraft>(emptyDraft)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isComposerOpen, setIsComposerOpen] = useState(false)
  const [reviewItem, setReviewItem] = useState<ContentItem | null>(null)
  const [sortMode, setSortMode] = useState<SortMode>('newest')

  const sortedContent = useMemo(
    () =>
      [...filteredContent].sort((a, b) => {
        if (sortMode === 'views') return b.views - a.views
        if (sortMode === 'engagement') return engagementOf(b) - engagementOf(a)
        if (sortMode === 'saves') return b.saves - a.saves
        return `${b.publishedAt}-${String(b.hour).padStart(2, '0')}`.localeCompare(
          `${a.publishedAt}-${String(a.hour).padStart(2, '0')}`,
        )
      }),
    [filteredContent, sortMode],
  )

  const closeComposer = () => {
    setIsComposerOpen(false)
    setEditingId(null)
  }

  const openCreate = () => {
    setEditingId(null)
    setDraft(emptyDraft())
    setIsComposerOpen(true)
  }

  const openEdit = (item: ContentItem) => {
    setReviewItem(null)
    setEditingId(item.id)
    setDraft(toDraft(item))
    setIsComposerOpen(true)
  }

  useEffect(() => {
    if (!isComposerOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeComposer()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [isComposerOpen])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!draft.title.trim()) return
    if (editingId) onUpdateContent(editingId, draft)
    else onAddContent(draft)
    closeComposer()
  }

  return (
    <div className="view-stack view-stack--content">
      {reviewItem && (
        <ContentReviewDrawer
          item={reviewItem}
          platformItems={allContent.filter((item) => item.platform === reviewItem.platform)}
          onClose={() => setReviewItem(null)}
          onEdit={() => openEdit(reviewItem)}
        />
      )}
      {isComposerOpen && (
        <>
          <button className="composer-backdrop" onClick={closeComposer} aria-label="关闭内容编辑面板" />
          <section
            className="composer-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="composer-title"
          >
            <header className="composer-drawer__header">
              <div>
                <span>{editingId ? '内容维护' : '内容资产'}</span>
                <h2 id="composer-title">{editingId ? '编辑内容' : '新增内容'}</h2>
                <p>{editingId ? '修改后将即时更新看板，并保留可撤销状态。' : '分组录入核心信息、表现数据与内容策略。'}</p>
              </div>
              <button className="icon-button" onClick={closeComposer} aria-label="关闭内容编辑">
                <X size={18} />
              </button>
            </header>

            <form className="content-form content-form--drawer" onSubmit={handleSubmit}>
              <fieldset className="form-section">
                <legend>核心信息</legend>
                <div className="form-section__grid">
                  <label>
                    平台
                    <select value={draft.platform} onChange={(event) => setDraft({ ...draft, platform: event.target.value as Platform })}>
                      {PLATFORMS.map((platform) => <option key={platform}>{platform}</option>)}
                    </select>
                  </label>
                  <label className="span-2">
                    标题
                    <input autoFocus required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="输入内容标题" />
                  </label>
                  <label>
                    类型
                    <input value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value })} />
                  </label>
                  <label>
                    发布日期
                    <input type="date" value={draft.publishedAt} onChange={(event) => setDraft({ ...draft, publishedAt: event.target.value })} />
                  </label>
                  <label>
                    发布时间
                    <input type="number" min="0" max="23" value={draft.hour} onChange={(event) => setDraft({ ...draft, hour: Math.min(23, Math.max(0, toNumber(event.target.value))) })} />
                  </label>
                </div>
              </fieldset>

              <fieldset className="form-section">
                <legend>表现数据</legend>
                <div className="form-section__grid form-section__grid--metrics">
                  {([
                    ['播放', 'views'],
                    ['点赞', 'likes'],
                    ['评论', 'comments'],
                    ['分享', 'shares'],
                    ['收藏', 'saves'],
                    ['涨粉', 'followersGained'],
                  ] as const).map(([label, key]) => (
                    <label key={key}>
                      {label}
                      <input type="number" min="0" value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: toNumber(event.target.value) })} />
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset className="form-section">
                <legend>内容策略</legend>
                <div className="form-section__grid">
                  <label>
                    内容支柱
                    <input value={draft.pillar} onChange={(event) => setDraft({ ...draft, pillar: event.target.value })} />
                  </label>
                  <label>
                    系列
                    <input value={draft.campaign} onChange={(event) => setDraft({ ...draft, campaign: event.target.value })} />
                  </label>
                  <label>
                    受众
                    <input value={draft.audience} onChange={(event) => setDraft({ ...draft, audience: event.target.value })} />
                  </label>
                  <label>
                    意图
                    <select value={draft.intent} onChange={(event) => setDraft({ ...draft, intent: event.target.value as ContentIntent })}>
                      {intentOptions.map((intent) => <option value={intent} key={intent}>{intentLabel[intent]}</option>)}
                    </select>
                  </label>
                  <label className="span-2">
                    标签
                    <input value={draft.tags.join(', ')} onChange={(event) => setDraft({ ...draft, tags: splitTags(event.target.value) })} placeholder="模板, 工具, 复盘" />
                  </label>
                  <label className="span-2">
                    开场钩子
                    <input value={draft.hook} onChange={(event) => setDraft({ ...draft, hook: event.target.value })} placeholder="开头承诺、冲突或反差点" />
                  </label>
                </div>
              </fieldset>

              <div className="composer-drawer__actions">
                <button className="action-button action-button--ghost" type="button" onClick={closeComposer}>取消</button>
                <button className="action-button" type="submit">
                  {editingId ? <Pencil size={16} /> : <Plus size={16} />}
                  {editingId ? '保存修改' : '保存内容'}
                </button>
              </div>
            </form>
          </section>
        </>
      )}

      <section className="panel content-library">
        <div className="content-library__heading">
          <SectionTitle icon={<Search size={18} />} title="内容资产" action={`${filteredContent.length} 条`} />
          <button className="action-button" onClick={openCreate}><Plus size={16} />新增内容</button>
        </div>
        <div className="table-toolbar">
          <div className="search-field">
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索标题、标签、受众、系列" aria-label="搜索内容库" />
          </div>
          <select value={platformFilter} onChange={(event) => setPlatformFilter(event.target.value as 'all' | Platform)} aria-label="按平台筛选内容">
            <option value="all">全部平台</option>
            {PLATFORMS.map((platform) => <option key={platform}>{platform}</option>)}
          </select>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value as SortMode)} aria-label="内容排序">
            <option value="newest">最新发布</option>
            <option value="views">播放最高</option>
            <option value="engagement">互动最高</option>
            <option value="saves">收藏最高</option>
          </select>
          <button className="action-button action-button--ghost" onClick={onExportCsv}><Download size={16} />CSV</button>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr><th>内容</th><th>平台</th><th>播放</th><th>互动</th><th>收藏</th><th>日期</th><th aria-label="操作" /></tr>
            </thead>
            <tbody>
              {sortedContent.length === 0 ? (
                <tr className="empty-row"><td colSpan={7}><strong>暂时没有匹配内容</strong><span>调整搜索条件，或新增第一条内容记录。</span></td></tr>
              ) : sortedContent.map((item) => (
                <tr key={item.id}>
                  <td data-label="内容">
                    <button className="content-title-button" onClick={() => setReviewItem(item)}>{item.title}</button>
                    <small>{item.type} · {item.pillar} · {item.campaign} · {item.audience} · {intentLabel[item.intent]}</small>
                    <div className="tag-row">{item.tags.slice(0, 4).map((tag) => <span key={`${item.id}-${tag}`}>{tag}</span>)}</div>
                  </td>
                  <td data-label="平台"><span className="platform-chip" style={{ background: platformSoftColors[item.platform], color: platformColors[item.platform] }}>{item.platform}</span></td>
                  <td data-label="播放">{formatNumber(item.views)}</td>
                  <td data-label="互动">{formatNumber(engagementOf(item))}</td>
                  <td data-label="收藏">{formatNumber(item.saves)}</td>
                  <td data-label="日期">{item.publishedAt.slice(5)} {String(item.hour).padStart(2, '0')}:00</td>
                  <td data-label="操作">
                    <div className="row-actions">
                      <button className="icon-button" onClick={() => setReviewItem(item)} aria-label={`复盘 ${item.title}`}><Eye size={15} /></button>
                      <button className="icon-button" onClick={() => openEdit(item)} aria-label={`编辑 ${item.title}`}><Pencil size={15} /></button>
                      <button className="icon-button icon-button--danger" onClick={() => onDeleteContent(item.id)} aria-label={`删除 ${item.title}`}><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
