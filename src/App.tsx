import { useState, useMemo, useEffect } from 'react'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { 
  Users, Eye, Heart, MessageCircle, TrendingUp, Calendar, Download, Upload, 
  Plus, Settings, BarChart3, Lightbulb, User 
} from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// Apple-inspired Overlook - Unified Creator Insights for Personal Creators
// Platforms: Bilibili, Xiaohongshu (Little Red Book), Douyin

interface PlatformData {
  platform: string
  views: number
  likes: number
  comments: number
  shares: number
  followers: number
  engagement: number
  topContent: string
  growth: number
}

interface ContentItem {
  id: number
  platform: string
  title: string
  views: number
  likes: number
  date: string
  type: string
}

const PLATFORMS = ['Bilibili', 'Xiaohongshu', 'Douyin'] as const

// Realistic mock data for personal creators (2026 context)
const mockPlatformData: PlatformData[] = [
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

const mockContent: ContentItem[] = [
  { id: 1, platform: 'Bilibili', title: '独立开发者如何用AI在3个月内变现', views: 45200, likes: 3200, date: '2026-05-28', type: '视频' },
  { id: 2, platform: 'Xiaohongshu', title: '我的第一套独立开发工具箱分享', views: 28400, likes: 5100, date: '2026-05-25', type: '笔记' },
  { id: 3, platform: 'Douyin', title: '3个小技巧让你的内容爆款', views: 89200, likes: 12400, date: '2026-05-22', type: '短视频' },
  { id: 4, platform: 'Bilibili', title: 'Claude Code 实战：从0到MVP', views: 31800, likes: 2100, date: '2026-05-20', type: '视频' },
  { id: 5, platform: 'Xiaohongshu', title: '个人创作者的2026增长复盘', views: 15600, likes: 2890, date: '2026-05-18', type: '笔记' },
]

const COLORS = ['#007AFF', '#34C759', '#FF9500']

function OverlookApp() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'platforms' | 'insights' | 'accounts'>('dashboard')
  const [accounts, setAccounts] = useState([
    { platform: 'Bilibili', username: '@yourname', connected: true },
    { platform: 'Xiaohongshu', username: '@yourname', connected: true },
    { platform: 'Douyin', username: '@yourname', connected: true },
  ])

  // Apple-style theme initialization (respect previous choice or system)
  useEffect(() => {
    const saved = localStorage.getItem('overlook-theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  const [showAddAccount, setShowAddAccount] = useState(false)

  // Calculate totals
  const totalViews = mockPlatformData.reduce((sum, p) => sum + p.views, 0)
  const totalLikes = mockPlatformData.reduce((sum, p) => sum + p.likes, 0)
  const totalFollowers = mockPlatformData.reduce((sum, p) => sum + p.followers, 0)
  const avgEngagement = (mockPlatformData.reduce((sum, p) => sum + p.engagement, 0) / mockPlatformData.length).toFixed(1)

  // Cross-platform comparison data for charts
  const comparisonData = mockPlatformData.map(p => ({
    name: p.platform,
    views: Math.round(p.views / 1000),
    engagement: p.engagement,
  }))

  // Engagement distribution data (total interactions: likes + comments + shares per platform) - memoized for perf
  const engagementData = useMemo(() => mockPlatformData.map(p => ({
    name: p.platform,
    value: p.likes + p.comments + p.shares,
  })), [])

  // Mock deterministic 30-day growth trend data for last 30 days (smooth natural growth) - memoized
  const growthTrendData = useMemo(() => Array.from({ length: 30 }, (_, i) => {
    const day = i + 1
    const base = 16500 + (i * 320) // steady upward trend
    const wave = Math.sin(i * 0.7) * 2400 + Math.cos(i * 0.3) * 1100
    const value = Math.round(Math.max(13500, base + wave))
    return { day, value }
  }), [])

  // Simple AI insights (rule-based, ready for real Claude integration)
  const insights = [
    "你的小红书笔记种草力最强（21.3%互动率），建议把B站长视频的核心观点拆成3-5篇小红书笔记。",
    "抖音短视频增长稳健，但评论区互动低于平均。尝试在视频结尾加明确问题引导评论。",
    "B站观众更偏好深度内容。把抖音爆款的「3个技巧」扩展成完整教程视频，预计能获得2-3倍播放。",
    "跨平台最佳发布时间：小红书晚上8-10点，B站周末上午，抖音工作日中午。",
  ]

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      platforms: mockPlatformData,
      content: mockContent,
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `overlook-report-${new Date().toISOString().slice(0,10)}.json`
    a.click()
    toast.success('报告已导出（可直接上传GitHub或分享）')
  }

  const handleCSVImport = () => {
    // Simulate CSV import for personal creators (e.g. from platform exports)
    // Expected header row (match sample-data.csv): 平台,标题,播放量,点赞,日期,类型
    // Download the sample CSV using the "下载示例 CSV" button next to the import button for testing
    toast.success('CSV导入成功！已同步 12 条新内容数据（MVP演示）')
    // In real: use papaparse
  }

  const handleDownloadSample = () => {
    const a = document.createElement('a')
    a.href = '/sample-data.csv'
    a.download = 'sample-data.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const addMockAccount = (platform: string) => {
    if (!accounts.find(a => a.platform === platform)) {
      setAccounts([...accounts, { platform, username: '@yourname', connected: true }])
    }
    setShowAddAccount(false)
    toast.success(`已连接 ${platform} 账号`)
  }

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F]">
      <Toaster position="top-center" richColors closeButton />

      {/* Apple-style Navigation */}
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
            {(['dashboard', 'platforms', 'insights', 'accounts'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`apple-btn px-4 py-1.5 text-sm rounded-full transition-all ${
                  activeTab === tab 
                    ? 'bg-[#1D1D1F] text-white' 
                    : 'hover:bg-[#E8E8ED] text-[#1D1D1F]'
                }`}
              >
                {tab === 'dashboard' && '概览'}
                {tab === 'platforms' && '平台'}
                {tab === 'insights' && '洞察'}
                {tab === 'accounts' && '账号'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={handleExport} className="apple-btn apple-btn-secondary text-sm">
              <Download className="w-4 h-4" /> 导出报告
            </button>
            <button onClick={handleCSVImport} className="apple-btn apple-btn-secondary text-sm">
              <Upload className="w-4 h-4" /> 导入CSV
            </button>
            <button onClick={handleDownloadSample} className="apple-btn apple-btn-ghost text-sm">
              下载示例 CSV
            </button>
            <button 
              onClick={() => {
                const isDark = document.documentElement.classList.toggle('dark')
                localStorage.setItem('overlook-theme', isDark ? 'dark' : 'light')
                toast.success(isDark ? '已切换到深色模式（Apple 风格）' : '已切换到浅色模式')
              }} 
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

      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Hero Header - Apple clean */}
        <div className="mb-10">
          <div className="flex items-end justify-between">
            <div>
              <h1 className="apple-h1">Overlook</h1>
              <p className="apple-body mt-2 max-w-md">
                专为个人创作者打造的一站式数据看板。B站 · 小红书 · 抖音，全部数据，一目了然。
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-[#86868B]">最后同步</div>
              <div className="font-medium">刚刚 · 2026年6月</div>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* DASHBOARD TAB - Unified Overview */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* KPI Cards - Apple generous cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="apple-card p-6">
                  <div className="flex items-center gap-3 text-[#86868B] mb-2">
                    <Eye className="w-4 h-4" /> 总播放
                  </div>
                  <div className="text-4xl font-semibold tracking-tighter">{(totalViews / 1000).toFixed(0)}K</div>
                  <div className="text-sm text-[#34C759] mt-1">+14% 本月</div>
                </div>
                <div className="apple-card p-6">
                  <div className="flex items-center gap-3 text-[#86868B] mb-2">
                    <Heart className="w-4 h-4" /> 总点赞
                  </div>
                  <div className="text-4xl font-semibold tracking-tighter">{(totalLikes / 1000).toFixed(0)}K</div>
                  <div className="text-sm text-[#34C759] mt-1">+22% 本月</div>
                </div>
                <div className="apple-card p-6">
                  <div className="flex items-center gap-3 text-[#86868B] mb-2">
                    <Users className="w-4 h-4" /> 总粉丝
                  </div>
                  <div className="text-4xl font-semibold tracking-tighter">{(totalFollowers / 1000).toFixed(0)}K</div>
                  <div className="text-sm text-[#34C759] mt-1">+9% 本月</div>
                </div>
                <div className="apple-card p-6">
                  <div className="flex items-center gap-3 text-[#86868B] mb-2">
                    <BarChart3 className="w-4 h-4" /> 平均互动率
                  </div>
                  <div className="text-4xl font-semibold tracking-tighter">{avgEngagement}%</div>
                  <div className="text-sm text-[#FF9500] mt-1">小红书表现突出</div>
                </div>
              </div>

              {/* Cross Platform Comparison Chart */}
              <div className="apple-card p-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="apple-h3">跨平台表现对比</h3>
                    <p className="text-sm text-[#86868B]">过去30天数据</p>
                  </div>
                  <button onClick={() => setActiveTab('platforms')} className="apple-btn apple-btn-ghost text-sm">
                    查看详情 →
                  </button>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={comparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E8ED" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="views" fill="#007AFF" radius={6} name="播放量 (千)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Charts Section: Engagement Distribution Pie + 30-day Growth Trend Line - Apple aesthetic */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Engagement Distribution PieChart - clean donut with Apple palette */}
                <div className="apple-card p-8">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="apple-h3">互动分布</h3>
                      <p className="text-sm text-[#86868B]">各平台总互动贡献占比</p>
                    </div>
                  </div>
                  <div className="h-72 -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={engagementData}
                          cx="50%"
                          cy="48%"
                          labelLine={false}
                          outerRadius={95}
                          innerRadius={52}
                          dataKey="value"
                          nameKey="name"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {engagementData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E8E8ED',
                            borderRadius: '10px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                            fontSize: '13px'
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={32}
                          iconType="circle"
                          iconSize={8}
                          formatter={(value) => (
                            <span style={{ color: '#1D1D1F', fontSize: '13px', fontWeight: 500 }}>{value}</span>
                          )}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Growth Trend Line Chart - last 30 days, smooth Apple-style */}
                <div className="apple-card p-8">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h3 className="apple-h3">增长趋势</h3>
                      <p className="text-sm text-[#86868B]">过去30天每日互动量（模拟数据）</p>
                    </div>
                  </div>
                  <div className="h-72 -mx-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={growthTrendData}>
                        <CartesianGrid strokeDasharray="2 2" stroke="#E8E8ED" />
                        <XAxis 
                          dataKey="day" 
                          tick={{ fontSize: 10, fill: '#86868B' }} 
                          interval={5}
                          tickLine={{ stroke: '#E8E8ED' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 10, fill: '#86868B' }} 
                          tickLine={{ stroke: '#E8E8ED' }}
                          tickFormatter={(v) => `${Math.round(v / 1000)}K`}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FFFFFF',
                            border: '1px solid #E8E8ED',
                            borderRadius: '10px',
                            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)',
                            fontSize: '13px'
                          }}
                          formatter={(value) => [`${(value / 1000).toFixed(1)}K`, '互动']}
                        />
                        <Line 
                          type="natural" 
                          dataKey="value" 
                          stroke="#007AFF" 
                          strokeWidth={2.5} 
                          dot={false} 
                          activeDot={{ r: 4.5, fill: '#007AFF', stroke: '#fff', strokeWidth: 2 }} 
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Quick Insights */}
              <div className="apple-card p-8">
                <div className="flex items-center gap-3 mb-6">
                  <Lightbulb className="w-5 h-5 text-[#FF9500]" />
                  <h3 className="apple-h3">智能洞察（AI 建议）</h3>
                </div>
                <div className="grid gap-4">
                  {insights.slice(0, 3).map((insight, i) => (
                    <div key={i} className="insight-card p-5 rounded-2xl text-[15px] leading-relaxed border-l-4 border-[#007AFF]">
                      {insight}
                    </div>
                  ))}
                </div>
                <button onClick={() => setActiveTab('insights')} className="mt-6 text-sm text-[#007AFF] hover:underline flex items-center gap-1">
                  查看全部洞察与行动建议 <TrendingUp className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* PLATFORMS TAB */}
          {activeTab === 'platforms' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="apple-h2">平台详情</h2>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {mockPlatformData.map((data, index) => (
                  <div key={index} className="apple-card p-7">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <div className="font-semibold text-2xl">{data.platform}</div>
                        <div className="text-[#86868B] text-sm">@{accounts.find(a => a.platform === data.platform)?.username}</div>
                      </div>
                      <div className={`text-sm px-3 py-1 rounded-full ${data.growth > 10 ? 'bg-[#34C759]/10 text-[#34C759]' : 'bg-[#FF9500]/10 text-[#FF9500]'}`}>
                        +{data.growth}% 本月
                      </div>
                    </div>

                    <div className="space-y-4 text-sm">
                      <div className="flex justify-between"><span className="text-[#86868B]">播放量</span><span className="font-medium">{(data.views / 1000).toFixed(0)}K</span></div>
                      <div className="flex justify-between"><span className="text-[#86868B]">点赞</span><span className="font-medium">{(data.likes / 1000).toFixed(1)}K</span></div>
                      <div className="flex justify-between"><span className="text-[#86868B]">评论</span><span className="font-medium">{data.comments}</span></div>
                      <div className="flex justify-between"><span className="text-[#86868B]">互动率</span><span className="font-medium">{data.engagement}%</span></div>
                      <div className="flex justify-between"><span className="text-[#86868B]">粉丝</span><span className="font-medium">{(data.followers / 1000).toFixed(1)}K</span></div>
                    </div>

                    <div className="mt-6 pt-6 border-t text-sm">
                      <div className="text-[#86868B] mb-1">本月爆款</div>
                      <div className="font-medium leading-tight">“{data.topContent}”</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recent Content Table */}
              <div className="apple-card p-7 mt-6">
                <h3 className="apple-h3 mb-4">近期内容表现</h3>
                <table className="apple-table">
                  <thead>
                    <tr>
                      <th>平台</th>
                      <th>标题</th>
                      <th>播放</th>
                      <th>点赞</th>
                      <th>日期</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockContent.map(item => (
                      <tr key={item.id}>
                        <td><span className="font-medium">{item.platform}</span></td>
                        <td className="max-w-xs truncate">{item.title}</td>
                        <td>{(item.views / 1000).toFixed(0)}K</td>
                        <td>{(item.likes / 1000).toFixed(1)}K</td>
                        <td className="text-[#86868B]">{item.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* INSIGHTS TAB - AI powered */}
          {activeTab === 'insights' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl">
              <h2 className="apple-h2 mb-2">AI 增长洞察</h2>
              <p className="apple-body mb-8">基于你的跨平台数据，Overlook 给出 actionable 建议（未来可直接接入 Claude 获得更智能分析）。</p>

              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className="apple-card p-7 insight-card">
                    <div className="flex gap-4">
                      <div className="mt-1 text-[#007AFF]">
                        <Lightbulb className="w-5 h-5" />
                      </div>
                      <div className="flex-1 text-[15px] leading-relaxed">{insight}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 text-xs text-[#86868B] border-t pt-4">
                提示：连接真实账号后，这里会显示基于 Claude 等模型的个性化建议。目前为演示数据。
              </div>
            </motion.div>
          )}

          {/* ACCOUNTS TAB */}
          {activeTab === 'accounts' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="apple-h2">已连接账号</h2>
                <button 
                  onClick={() => setShowAddAccount(true)} 
                  className="apple-btn apple-btn-primary text-sm"
                >
                  <Plus className="w-4 h-4" /> 添加平台账号
                </button>
              </div>

              <div className="apple-card divide-y">
                {accounts.map((acc, i) => (
                  <div key={i} className="px-7 py-5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 bg-[#007AFF] rounded-2xl flex items-center justify-center text-white text-xs font-medium">
                        {acc.platform.slice(0,2)}
                      </div>
                      <div>
                        <div className="font-medium">{acc.platform}</div>
                        <div className="text-sm text-[#86868B]">{acc.username}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="px-3 py-1 bg-[#34C759] text-white rounded-full text-xs">已连接</span>
                      <button className="apple-btn apple-btn-ghost text-sm px-3 py-1">管理</button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-xs text-[#86868B] mt-4">MVP 阶段数据为模拟。真实版本可一键导入各平台 CSV 导出文件。</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Account Modal - Apple clean */}
      <AnimatePresence>
        {showAddAccount && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowAddAccount(false)}>
            <motion.div 
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="apple-card w-full max-w-sm p-7 mx-4"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="apple-h3 mb-6">添加平台账号</h3>
              <div className="space-y-3">
                {PLATFORMS.filter(p => !accounts.find(a => a.platform === p)).map(platform => (
                  <button 
                    key={platform}
                    onClick={() => addMockAccount(platform)}
                    className="w-full apple-btn apple-btn-secondary justify-start px-5 py-3 text-left"
                  >
                    {platform}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowAddAccount(false)} className="mt-6 w-full apple-btn apple-btn-secondary">取消</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <footer className="text-center text-xs text-[#86868B] py-8 border-t mt-12">
        Overlook • 为个人创作者而生 • 数据本地存储 • 准备好推送到 GitHub Pages 了吗？
      </footer>
    </div>
  )
}

export default OverlookApp
