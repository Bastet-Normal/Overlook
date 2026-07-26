# Overlook

Overlook 是一款面向 Bilibili、小红书和抖音创作者的本地优先经营看板。它将内容表现、发布计划、竞品对标、账号管理和合作报告集中在一个可离线使用的工作区中。

[在线体验](https://bastet-normal.github.io/Overlook/)

## 核心能力

- 决策总览：展示关键指标、趋势、平台表现和下一轮实验建议。
- 内容资产：支持录入、搜索、筛选、删除以及 CSV 导入导出。
- 发布计划：管理月度目标、推荐发布时间和每周内容排期。
- 竞品对标：记录对标账号、指标差距和历史快照。
- 本地工作区：数据默认保存在浏览器，可完整备份、恢复和撤销。
- 合作报告：导出 Creator Media Kit PDF，并可隐藏账号信息。
- PWA：生产环境支持离线缓存和安装。

## 项目结构

```text
.
├── .github/workflows/       # GitHub Pages 自动验证与发布
├── .openai/                 # Sites 项目标识
├── docs/                    # 产品研究和决策记录
├── public/                  # PWA 图标、清单、Service Worker 和托管入口
├── scripts/                 # 视觉与交互烟雾测试
└── src/
    ├── components/          # 页面视图和通用 UI 组件
    ├── domain/              # 工作区校验、迁移和数据约束
    ├── features/workspace/  # 导入、导出与恢复流程
    ├── hooks/               # 状态编排和派生业务数据
    ├── services/            # PDF 等基础设施服务
    ├── storage/             # 本地持久化与旧版本迁移
    ├── styles/              # 基础样式与视觉优化层
    ├── types/               # TypeScript 数据模型
    ├── utils/               # 纯计算、解析和排期算法
    ├── App.tsx              # 应用协调层
    └── main.tsx             # React 入口
```

### 文件职责

- `src/styles/base.css`：设计变量、基础组件和核心布局。
- `src/styles/refinement.css`：主题质感、决策型总览、抽屉和响应式优化。
- `src/domain/workspaceSchema.ts`：工作区 v4 校验、限制与旧数据迁移。
- `src/storage/workspaceStorage.ts`：统一的本地存储文档。
- `src/hooks/useWorkspaceState.ts`：工作区状态和原子更新。
- `src/hooks/useDashboardData.ts`：图表、指标、洞察和筛选结果。
- `src/features/workspace/useWorkspaceFiles.ts`：CSV、JSON 和 PDF 文件流程。

## 本地开发

要求 Node.js 24。

```bash
npm ci
npx playwright install chromium
npm run dev
```

开发服务器默认运行在 `http://localhost:5173`。

## 质量验证

```bash
npm run verify
```

验证流程包括：

1. ESLint 静态检查
2. TypeScript 类型检查
3. Vitest 数据层测试
4. Vite 生产构建
5. Playwright 桌面端、宽屏和移动端烟雾测试
6. CSV 导入、工作区恢复、内容抽屉和 PDF 导出检查

也可以单独运行：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run visual:smoke
```

## 数据与隐私

- 工作区数据默认只存储在当前浏览器的 `localStorage`。
- CSV 导入会先进行字段映射、重复检查和无效行预览。
- JSON 恢复会执行版本迁移和逐字段校验。
- 大规模变更前会记录一次可撤销快照。
- 不需要账号密码，也不会自动上传创作数据。

浏览器数据仍可能因清理站点数据或更换设备而丢失，请定期在“账号与数据”页面导出工作区备份。

## 发布

推送到 `main` 分支后，[GitHub Actions](.github/workflows/deploy.yml) 会运行完整验证，并将 `dist` 发布到 GitHub Pages。

项目同时保留 `.openai/hosting.json` 和 `public/server/index.js`，用于后续更新现有 Sites 生产环境。两种发布方式共用相同的 Vite 构建结果。

## License

MIT
