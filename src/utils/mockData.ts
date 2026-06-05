import type { PlatformData, ContentItem } from './types'

export const mockPlatformData: PlatformData[] = [
  {
    platform: 'Bilibili',
    views: 124800,
    likes: 8920,
    comments: 1240,
    shares: 680,
    followers: 12400,
    engagement: 8.7,
    topContent: '「独立开发者如何用AI在3个月内变现」',
    growth: 12.4
  },
  {
    platform: 'Xiaohongshu',
    views: 89600,
    likes: 15600,
    comments: 980,
    shares: 1420,
    followers: 8700,
    engagement: 21.3,
    topContent: '「我的第一套独立开发工具箱分享」',
    growth: 18.9
  },
  {
    platform: 'Douyin',
    views: 245600,
    likes: 32400,
    comments: 2150,
    shares: 1890,
    followers: 18900,
    engagement: 15.8,
    topContent: '「3个小技巧让你的内容爆款」',
    growth: 9.2
  }
]

export const mockContent: ContentItem[] = [
  { id: 1, platform: 'Bilibili', title: '独立开发者如何用AI在3个月内变现', views: 45200, likes: 3200, date: '2026-05-28', type: '视频' },
  { id: 2, platform: 'Xiaohongshu', title: '我的第一套独立开发工具箱分享', views: 28400, likes: 5100, date: '2026-05-25', type: '笔记' },
  { id: 3, platform: 'Douyin', title: '3个小技巧让你的内容爆款', views: 89200, likes: 12400, date: '2026-05-22', type: '短视频' },
  { id: 4, platform: 'Bilibili', title: 'Claude Code 实战：从0到MVP', views: 31800, likes: 2100, date: '2026-05-20', type: '视频' },
  { id: 5, platform: 'Xiaohongshu', title: '个人创作者的2026增长复盘', views: 15600, likes: 2890, date: '2026-05-18', type: '笔记' },
]

export const COLORS = ['#007AFF', '#34C759', '#FF9500'] as const
