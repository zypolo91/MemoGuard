# MemoGuard 技术设计文档

## 1. 架构概览
- 使用 Vue 3 + TypeScript 构建单页应用，借助 Vite 完成快速开发与优化后的生产构建。
- 采用组件驱动与原子化设计原则：原子（按钮、输入框）、分子（媒体卡片、时间轴项）、有机体（模块面板）及页面模板。
- 使用 Pinia 管理全局状态，各功能模块独立 Store；Vue Router 负责五大模块的导航。
- 构建模拟服务层抽象数据访问，后续可轻松替换为真实 API；模拟持久化依赖浏览器 LocalStorage，并在异常时优雅降级。
- 样式层使用 Tailwind CSS 搭配自定义设计令牌，实现现代且易于迭代的无障碍界面。

## 2. 技术栈
- 语言：TypeScript 5.x，提供静态类型与 IDE 支持。
- 框架：Vue 3 Composition API，可选集成 VueUse 工具库。
- 构建工具：Vite + esbuild，用于快速热更新与生产打包。
- 状态管理：Pinia 搭配 LocalStorage 持久化插件。
- 路由：Vue Router 4，支持基于路由的代码分片。
- UI 工具：Tailwind CSS、Headless UI、Heroicons，提供可访问的基础组件。
- 测试：Vitest + Vue Test Utils 做单元和组件测试，Playwright 覆盖端到端冒烟场景。
- 工具链：ESLint（Vue + TypeScript 规则）、Prettier 自动格式化，可选 Stylelint 约束 Tailwind 用法。

## 3. 应用结构
```
app/
  main.ts             // 应用启动，注入路由、Pinia、全局样式
  App.vue             // 全局布局外壳（页头、侧栏、通知）
  router/
    index.ts          // 路由定义与懒加载视图
  stores/
    memories.ts       // 按模块划分的 Pinia Store
    tasks.ts
    recipes.ts
    news.ts
    profile.ts
  modules/
    memories/         // 功能模块组件与组合式函数
    tasks/
    diet/
    insights/
    profile/
  components/
    atoms/
    molecules/
    organisms/
  services/
    mockApi/
      memories.ts
      tasks.ts
      recipes.ts
      news.ts
      profile.ts
    scheduler.ts      // 提醒定时任务与通知钩子
  assets/
    styles/
      tailwind.css
      tokens.css
mock/
  seed.json           // 可选静态初始数据
```

## 4. 模块设计
### 4.1 记忆模块
- 核心组件：`MemoryTimeline.vue`、`MemoryCard.vue`、`MemoryComposer.vue`、`MemoryDetailDrawer.vue`、`AnnotationPanel.vue`。
- 数据结构：`id`、`title`、`content`、`media[] { id, type, url, thumbnail, transcript }`、`createdAt`、`eventDate`、`people[]`、`tags[]`、`mood`、`location`、`annotations[] { id, type, targetId, timestamp, body, createdBy }`。
- 主要流程：时间轴无限滚动；使用富文本编辑器（如 TipTap）进行创建与编辑；批注模式提供上下文评论；删除操作需确认。
- 缓存策略：在 Pinia 中保存上次查看的记忆，并将快照写入 LocalStorage 以提升离线体验。

### 4.2 事务模块
- 组件：`TaskDashboard.vue`、`TaskFormDrawer.vue`、`TaskList.vue`、`TaskCalendarStrip.vue`、`ReminderLog.vue`。
- 数据结构：`id`、`title`、`category`、`frequency`（枚举加自定义规则）、`startAt`、`endAt`、`priority`、`reminderLead`、`reminderChannel[]`、`notes`、`statusHistory[] { status, timestamp }`。
- 调度服务利用类 Cron 辅助函数计算下次触发时间，结合 `setTimeout` 与 `setInterval`；队列信息持久化于 LocalStorage，刷新后恢复。
- 通知界面：全局 Toast 管理器配合渠道图标，可选模态提醒到期事务。

### 4.3 饮食模块
- 组件：`RecipeGrid.vue`、`RecipeCard.vue`、`RecipeDetail.vue`、`RecipeEditor.vue`、`NutritionFacts.vue`、`RecommendationCarousel.vue`。
- 数据结构：`id`、`title`、`description`、`tags[]`、`prepTime`、`cookTime`、`difficulty`、`heroImage`、`ingredients[] { name, quantity, unit }`、`steps[]`、`nutrition { calories, protein, fat, carbs, vitamins: { b12, e, omega3, antioxidants } }`、`pairings[]`、`isBookmarked`。
- 推荐引擎：组合式函数 `useRecipeRecommendations` 根据收藏、浏览标签与时间段打分，生成轮播内容。

### 4.4 资讯模块
- 组件：`InsightsFeed.vue`、`ArticleCard.vue`、`ArticleDetailDrawer.vue`、`HighlightPanel.vue`、`FollowChips.vue`。
- 数据结构：`id`、`title`、`summary`、`content`、`source`、`category`、`publishedAt`、`url`、`highlights[]`、`isFavorite`、`isFollowed`。
- 使用 `useNewsFilters` 组合式函数管理搜索词、类别与日期，每个列表支持虚拟滚动（如 Vue Virtual Scroll List）。

### 4.5 我的模块
- 组件：`ProfileOverview.vue`、`ActivityTimeline.vue`、`CollectionsTabs.vue`、`SettingsPanel.vue`、`AnalyticsWidget.vue`。
- 数据结构：`id`、`name`、`avatar`、`role`、`stats { memoriesCreated, tasksCompleted, recipesSaved, articlesHighlighted }`、`preferences { theme, reminderChannels, digestFrequency }`、`activity[] { id, type, refId, description, timestamp }`。
- 通过计算属性聚合其他 Store 数据，并缓存派生统计以保持仪表盘性能。

## 5. 数据模型与校验
- 在 `app/types/` 中定义 TypeScript 接口；通过 Zod 对模拟请求响应与表单提交做运行时校验。
- 枚举常量放入 `app/constants/`（类别、优先级、频率模式），以驱动下拉选项并避免拼写错误。
- 使用 `crypto.randomUUID()` 生成 ID，若环境不支持则回退到自增计数以兼容 SSR。

## 6. 模拟服务层
- 每个模块的服务文件导出 CRUD 方法，返回带有 100 至 400 毫秒人工延迟的 `Promise<T>` 以模拟网络。
- `mockApi/index.ts` 暴露类型化的端点；未来替换真实 API 时仅需调整实现。
- 持久化流程：
  1. 首先从 LocalStorage 命名空间（例如 `memoGuard.memories`）读取。
  2. 若不存在，则使用 `mock/seed.json` 作为初始数据。
  3. 数据修改后写回 LocalStorage，并同步 Pinia Store 状态。
- 提供 `resetMockData()` 工具，方便调试与测试。

## 7. 状态管理与缓存
- Store 共享 `BaseEntityStore` 组合式函数，提供加载态、错误处理与乐观更新能力。
- 借助 `pinia-plugin-persistedstate` 或自研方案将选定状态切片同步到 LocalStorage。
- 使用组合式 API 构建派生选择器（如 `useTimelineGroups`、`useDueTasks`），保持组件轻量。

## 8. 路由与导航
- 路由映射：`/memories`（默认时间轴）、`/memories/:id`、`/tasks`、`/diet`、`/insights`、`/profile`。
- 通过动态导入实现视图懒加载，并使用 Vite Chunk 提示（例如 `/* webpackChunkName: "memories" */`）。
- 导航守卫确保进入路由前已完成模拟数据注入。

## 9. UI 样式与主题
- Tailwind 配置定义色板（平静的蓝紫与暖色点缀）、字体（如 Inter 及系统备选）。
- 使用 CSS 变量管理间距、圆角、阴影，支持主题切换。
- 针对 `prefers-reduced-motion` 媒体查询减少动画，以照顾敏感用户。
- 借助 `@tailwindcss/typography` 渲染记忆与资讯中的富文本内容。

## 10. 通知与调度
- 提醒调度器在 Pinia 中维护队列，任务创建或更新时注册下一次触发。
- 首选 Web Notifications API，若用户未授权则回退到应用内 Toast 与高亮事务卡片。
- 全局组合式函数 `useNotificationCenter` 统一权限申请与通知调用。
- MVP 阶段限制并发定时器数量，并在组件卸载或页面隐藏时清理定时器。

## 11. 可访问性与国际化
- 使用语义化 HTML 与 ARIA 角色，覆盖时间轴、轮播、选项卡等交互。
- 全部交互元素支持键盘导航（模态框内焦点锁定、跳转链接）。
- 引入 Vue I18n 管理文案，即便仅有单一语言也为后续翻译做准备。
- 为媒体附件提供替代文本，为音视频添加字幕，并支持动态字体缩放。

## 12. 测试策略
- 单元测试：数据模型校验、Store 行为（动作与变更）、工具函数。
- 组件测试：时间轴渲染、事务表单校验、通知触发、菜谱推荐逻辑。
- 端到端冒烟：创建、编辑、删除记忆；安排事务并观察提醒；收藏菜谱；高亮资讯。
- 测试期间使用 Mock Service Worker（MSW）拦截请求，确保数据一致。
- 可选 GitHub Actions 流水线执行 `pnpm lint`、`pnpm test`、`pnpm build`。

## 13. 构建、部署与工具
- 包管理器推荐使用 pnpm，保证工作区管理与锁定一致性。
- 通过 `.env` 管理环境变量（如 `VITE_APP_NAME`），并提供 `env.d.ts` 类型声明。
- Vite 构建输出静态资源到 `dist/`，可部署于 Netlify、Vercel 或任意静态托管服务。
- 配置 ESLint 与 Prettier 的预提交钩子（Husky 加 lint-staged）以保持格式一致。

## 14. 可观测性与分析（模拟）
- 实现轻量级分析服务，将事件写入内存队列并镜像至 LocalStorage，供“我的”模块仪表盘读取。
- 提供开发者开关以查看分析载荷，便于演示。

## 15. 后续增强
- 将模拟服务替换为真实后端（如 NestJS 或 Express 搭配 PostgreSQL），并接入用户身份认证。
- 引入协作空间与基于角色的权限控制。
- 整合可穿戴设备或日历数据，提供更智能的提醒。
- 升级调度器为 Service Worker 加 IndexedDB，以提升后台提醒可靠性。
- 引入人工智能辅助的资讯摘要与饮食个性化推荐。
