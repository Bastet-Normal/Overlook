# 🎨 Overlook

<p align="center">
  <img src="https://img.shields.io/badge/Local--First-Yes-8da89e?style=flat-square" alt="Local First" />
  <img src="https://img.shields.io/badge/Aesthetic-Morandi%20Fresh-8a9aae?style=flat-square" alt="Morandi Fresh" />
  <img src="https://img.shields.io/badge/Platform-Bilibili%20%7C%20小红书%20%7C%20抖音-b8a27d?style=flat-square" alt="Platforms" />
  <img src="https://img.shields.io/badge/PWA-Supported-a697bb?style=flat-square" alt="PWA" />
</p>

Overlook 是一款**本地优先、设计精美**的自媒体创作者一站式经营看板，专为同时运营 **Bilibili、小红书和抖音** 的个人创作者或小团队打造。

它将复杂的业务分析、选题规划、对标扫描和数据安全，凝练在一个安静、优雅的 **“莫兰迪清新 (Morandi Fresh)”** 视效工作台内。所有数据默认以离线形式存储在浏览器本地，无需复杂的后端部署，保障绝对隐私与高响应度，并可直接作为静态站点一键部署。

✨ **在线体验：** [https://bastet-normal.github.io/Overlook/](https://bastet-normal.github.io/Overlook/)

---

## 📸 莫兰迪视觉美学 (Morandi Fresh)

不同于常规高饱和度、刺眼的后台界面，Overlook 采用了经过精心设计的低饱和度莫兰迪色系（ desaturated pastel tones ），辅以高档的 `Plus Jakarta Sans` 无衬线字体：

*   **视觉底色**：温润的米灰底色 `rgba(251, 250, 247, 0.92)` 配合细致毛玻璃效果 `backdrop-filter: blur(18px)`。
*   **平台点缀色**：轻盈的莫兰迪灰蓝（Bilibili）、干枯玫瑰粉（小红书）与柔和莫兰迪绿（抖音），使多平台业务标识井然有序却又不显杂乱。
*   **无级自适应**：全站严格限制在视口高度（`100dvh`），配合卡片级智能垂直滚动弹性布局，完美适配从 `1280x760` 到宽屏及移动视口的各种终端。

---

## 🌟 核心功能模块

### 📊 1. 业务总览 (Overview)
- **多维 KPI 报表**：整合总播放、平均互动率、粉丝新增与商务线索转化度。
- **动态表现趋势**：采用轻量定制 Recharts 折线图，平滑追踪过去 30 天的播放与互动涨跌。
- **内容类型占比**：精细环形图（Donut Chart）直观反映不同内容的流量占比。
- **下一轮实验建议**：基于平台规则与数据洞察，自动提供下一阶段可落地的选题改进方向。

### 📚 2. 内容库管理 (Content Library)
- **智能导入预览**：强大的 CSV 智能解析引擎，支持中英文表头自动模糊映射、重复记录拦截与无效行提示。
- **内容检索器**：秒级的标题、系列、受众、标签全文检索，配合便捷的多平台下拉过滤。
- **一键导出**：一键将本地修改后的数据重新打包为标准的 CSV 数据包。

### 📅 3. 智能发布计划 (Publisher Planner)
- **目标进度追踪**：月度播放、涨粉及合作线索进度条，实时显示流量缺口。
- **黄金发布窗口**：分析各平台历史最佳发布时间段。
- **本周排期生成**：一键生成本周发布计划表，支持完成状态标记与排期计划一键复制。
- **跨平台重塑**：自动将优质内容重塑为适配其他平台特性的差异化选题方案。

### ⚔️ 4. 竞品对标分析 (Competitor Benchmarks)
- **自动化漏洞扫描**：输入对标账号句柄即可调用扫描机制（支持外接合规 API 校验，并内建本地多因子置信度估算回退逻辑）。
- **指标差距扫描**：全方位比对竞品均播差、互动率差与内容角度。
- **历史快照记录**：捕获竞品快照，并保留相对于上一次记录的粉丝、互动变动趋势。

### 🔒 5. 账号状态与数据安全 (Accounts & Security)
- **PWA 离线支持**：Service Worker 缓存检测、本地数据完整性校验。
- **多维安全导出**：支持完整工作区 JSON 备份导出。
- **恢复校验与撤销**：恢复工作区前提供结构差异比对预览，并支持最近一次导入/重置的**一键撤销（Undo）**。
- **隐私模式**：面向品牌方展示或导出 Media Kit PDF 报告时，可一键隐藏敏感 handle 账号信息。

---

## 📂 优雅的模块化架构

经过彻底的重构，Overlook 的代码由原本的单文件精细拆分为职责单一的现代前端架构，完全遵循 TypeScript 严格 `verbatimModuleSyntax` 规范：

```text
src/
  ├── components/                 # 核心功能视图组件
  │   ├── Navbar.tsx             # 顶部轻质导航栏
  │   ├── OverviewView.tsx       # 总览分析视图（折线图、环形图）
  │   ├── ContentView.tsx        # 内容库视图（表单、数据表格）
  │   ├── PlannerView.tsx        # 计划视图（目标、最佳时间、周历）
  │   ├── BenchmarksView.tsx     # 对标视图（对标扫描、差距比对）
  │   ├── AccountsView.tsx       # 账号管理与系统安全配置视图
  │   ├── ImportPreviewModal.tsx # CSV 导入校验差异对比 Modal
  │   ├── RestorePreviewModal.tsx# 工作区数据备份恢复预览 Modal
  │   └── ReportSheet.tsx        # 导出 Media Kit PDF 专用样式页
  ├── hooks/                      # 自定义状态与持久化 hooks
  │   ├── useWorkspaceState.ts   # 集中管理本地工作区状态及撤销机制
  │   ├── useCompetitorScan.ts   # 封装账号扫描、外接 API 与本地估算逻辑
  │   └── useLocalStorage.ts     # 增强型本地存储 hook（内置配额异常拦截）
  ├── utils/                      # 纯算法与计算工具
  │   ├── calendarHelpers.ts     # 最佳排期推荐算法与周历生成逻辑
  │   ├── importHelpers.ts       # CSV 校验规则、字段对齐与解析器
  │   └── dashboardHelpers.ts    # 数值格式化、单位转换与置信度算法
  ├── types/                      # 数据模型定义
  ├── App.tsx                     # 顶层流程路由与状态分配调度控制器
  ├── main.tsx                    # React 19 挂载入口
  └── index.css                   # 面向 Morandi Fresh 主题的系统级 CSS 变量与弹性布局样式
```

---

## 🛠️ 本地开发指南

### 1. 运行开发服务器

运行以下命令安装依赖并启动 Vite：

```bash
# 安装项目依赖
npm install

# 启动本地开发服务
npm run dev
```

打开浏览器访问本地端口：`http://localhost:5173`。

### 2. 多重质量校验 (Verify)

项目配置了完整的自动化验证流程，运行以下命令：

```bash
npm run verify
```

该命令将严格依次执行：
1. **ESLint 静态扫描** (`npm run lint`)
2. **TypeScript 类型校验** (`npm run typecheck`)
3. **Vite 生产包编译** (`npm run build`)
4. **Playwright 视觉烟测** (`npm run visual:smoke`) - 会开启无头浏览器在 `1280x760` 和移动视口下测试所有模态框、页面防溢出与自适应边界。

---

## 📦 部署发布

项目已经配置了完备的 GitHub Actions 自动工作流 [deploy.yml](.github/workflows/deploy.yml)。

一旦代码被推送（Push）至 `main` 分支，GitHub Actions 将会自动执行 `npm run verify` 套件，在校验无误后自动将打包产物推送到 `gh-pages` 分支进行无缝部署。

> Vite 编译基础路径已设定为相对路径 `base: './'`，可完美适配任何子目录或 GitHub Pages 项目页地址。

---

## 📜 许可协议

本项目基于 **MIT License** 协议开源。
