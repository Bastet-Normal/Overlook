import { useEffect, useMemo } from 'react'
import { BarChart3, Copy, Pencil, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import type { ContentItem } from '../types'
import { formatNumber, formatPercent, intentLabel } from '../utils/dashboardHelpers'

interface ContentReviewDrawerProps {
  item: ContentItem
  platformItems: ContentItem[]
  onClose: () => void
  onEdit: () => void
}

const interactionsOf = (item: ContentItem) => item.likes + item.comments + item.shares + item.saves
const rate = (value: number, views: number) => (views > 0 ? (value / views) * 100 : 0)

export function ContentReviewDrawer({ item, platformItems, onClose, onEdit }: ContentReviewDrawerProps) {
  const review = useMemo(() => {
    const peers = platformItems.length > 0 ? platformItems : [item]
    const average = (pick: (entry: ContentItem) => number) => peers.reduce((sum, entry) => sum + pick(entry), 0) / peers.length
    const interactions = interactionsOf(item)
    const engagementRate = rate(interactions, item.views)
    const saveRate = rate(item.saves, item.views)
    const shareRate = rate(item.shares, item.views)
    const followerRate = rate(item.followersGained, item.views)
    const avgViews = average((entry) => entry.views)
    const avgEngagement = average((entry) => rate(interactionsOf(entry), entry.views))
    const avgSaves = average((entry) => rate(entry.saves, entry.views))
    const avgShares = average((entry) => rate(entry.shares, entry.views))
    const viewIndex = avgViews > 0 ? item.views / avgViews : 1
    const engagementIndex = avgEngagement > 0 ? engagementRate / avgEngagement : 1
    const qualityScore = Math.round(Math.min(100, Math.max(0, 46 * Math.min(1.4, viewIndex) + 34 * Math.min(1.4, engagementIndex) + 20 * Math.min(1, followerRate / 1.2))))
    const recommendations: string[] = []

    if (viewIndex >= 1.25) recommendations.push('播放显著高于平台均值，适合延展为同主题系列。')
    else recommendations.push('播放尚未拉开差距，下次优先重做标题与前 3 秒钩子。')
    if (saveRate >= avgSaves) recommendations.push('收藏率高于平台均值，可补充模板、清单或资料领取承诺。')
    else recommendations.push('收藏意图偏弱，增加步骤总结、清单或可复用结论。')
    if (shareRate >= avgShares) recommendations.push('转发信号良好，保留当前冲突点与结果表达。')
    else recommendations.push('转发率低于平台均值，强化观点反差和可转述的一句话结论。')

    return { interactions, engagementRate, saveRate, shareRate, followerRate, avgViews, avgEngagement, viewIndex, qualityScore, recommendations }
  }, [item, platformItems])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose])

  const copyReview = async () => {
    const summary = [
      `《${item.title}》复盘`,
      `${item.platform} · ${item.publishedAt} ${String(item.hour).padStart(2, '0')}:00`,
      `播放 ${formatNumber(item.views)}｜互动率 ${formatPercent(review.engagementRate)}｜收藏率 ${formatPercent(review.saveRate)}｜转粉率 ${formatPercent(review.followerRate)}`,
      `综合评分 ${review.qualityScore}/100｜相对平台均播 ${review.viewIndex.toFixed(1)}×`,
      ...review.recommendations.map((recommendation, index) => `${index + 1}. ${recommendation}`),
    ].join('\n')
    try {
      await navigator.clipboard.writeText(summary)
      toast.success('复盘结论已复制')
    } catch {
      toast.error('剪贴板不可用，请手动复制')
    }
  }

  return (
    <>
      <button className="composer-backdrop" onClick={onClose} aria-label="关闭内容复盘" />
      <section className="composer-drawer review-drawer" role="dialog" aria-modal="true" aria-labelledby="review-title">
        <header className="composer-drawer__header">
          <div>
            <span>发布后复盘</span>
            <h2 id="review-title">内容表现详情</h2>
            <p>{item.platform} · {item.type} · {item.publishedAt}</p>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="关闭内容复盘"><X size={18} /></button>
        </header>

        <div className="review-hero">
          <div>
            <span>{item.campaign} · {intentLabel[item.intent]}</span>
            <h3>{item.title}</h3>
            <p>{item.hook}</p>
          </div>
          <div className="review-score" aria-label={`综合评分 ${review.qualityScore} 分`}>
            <strong>{review.qualityScore}</strong>
            <span>/100</span>
          </div>
        </div>

        <div className="review-metric-grid">
          <article><span>播放</span><strong>{formatNumber(item.views)}</strong><small>平台均值 {formatNumber(review.avgViews)}</small></article>
          <article><span>互动率</span><strong>{formatPercent(review.engagementRate)}</strong><small>平台均值 {formatPercent(review.avgEngagement)}</small></article>
          <article><span>收藏率</span><strong>{formatPercent(review.saveRate)}</strong><small>{formatNumber(item.saves)} 次收藏</small></article>
          <article><span>转发率</span><strong>{formatPercent(review.shareRate)}</strong><small>{formatNumber(item.shares)} 次分享</small></article>
          <article><span>转粉率</span><strong>{formatPercent(review.followerRate)}</strong><small>{formatNumber(item.followersGained)} 新增粉丝</small></article>
          <article><span>播放指数</span><strong>{review.viewIndex.toFixed(1)}×</strong><small>相对平台均播</small></article>
        </div>

        <section className="review-section">
          <div className="review-section__title"><Sparkles size={16} /><strong>下一轮动作</strong></div>
          <div className="review-action-list">
            {review.recommendations.map((recommendation, index) => (
              <article key={recommendation}><span>{index + 1}</span><p>{recommendation}</p></article>
            ))}
          </div>
        </section>

        <section className="review-section">
          <div className="review-section__title"><BarChart3 size={16} /><strong>策略标签</strong></div>
          <div className="tag-row">
            <span>{item.pillar}</span><span>{item.audience}</span>{item.tags.map((tag) => <span key={tag}>{tag}</span>)}
          </div>
        </section>

        <div className="composer-drawer__actions">
          <button className="action-button action-button--ghost" onClick={copyReview}><Copy size={16} />复制复盘</button>
          <button className="action-button" onClick={onEdit}><Pencil size={16} />编辑数据</button>
        </div>
      </section>
    </>
  )
}
