# MemoGuard 后端集成需求与技术方案

## 1. 背景与目标
- 前端（Vue 3 + Pinia + Vite）已具备记忆卡片、照护任务、营养评估、资讯以及照护者档案等模块，当前数据来源为 `src/services/mockApi` 下的本地假数据。
- 目标是在保持现有前端交互的前提下，提供一套基于 **Next.js (App Router)** + **shadcn/ui** + **Drizzle ORM** 的后端实现规范，便于后端落地与前端对接。
- 本文档同步给出了 Mock API 的契约，前端已按该契约进行了改造，后端只需遵循即可无缝对接。

## 2. 业务域与核心数据模型
| 模块 | 主要实体 | 关键字段 | 说明 |
| --- | --- | --- | --- |
| 记忆守护 (`/memories`) | `Memory`、`MemoryMedia`、`MemoryAnnotation`、`MemoryInsight` | 标题、富文本内容、媒体资源、标签、情绪、智能摘要、关键词 | 支持时间线与标签视图，后端需要提供增删改查接口及媒体元数据处理 |
| 照护任务 (`/tasks`) | `CareTask`、`TaskHistory`/`ReminderLog` | 任务频次、优先级、提醒历史、状态流转 | 需要支持任务的 CRUD 以及提醒历史的增删改 |
| 营养 / 评估 (`/nutrition`) | `PatientProfile`、`PatientAssessment`、`AssessmentTemplate` | 人员基础信息、评估模板、评估记录、数值单位 | 评估记录要按日期排序，支持创建、编辑、删除 |
| 资讯洞察 (`/insights`) | `InsightArticle` | 标题、来源、摘要、标签、收藏状态 | 只读列表，支持收藏状态切换 |
| 照护者档案 (`/profile`) | `CareProfile`、`ProfilePreferences` | 头像、 streak、关注主题、通知偏好 | 读取 + 更新偏好 |

> 评估模板(`assessmentTemplates`) 在前端为常量，后端可提供配置化接口（可选）以便运营管理。

## 3. REST API 设计
以下接口建议使用 `/api` 前缀，均返回 `application/json`，采用 200/201/204 语义化状态码，错误统一返回 `{ error: { code, message } }`。

### 3.1 记忆守护
- `GET /api/memories`
  - 查询参数：`tag?`, `from?`, `to?`
  - 响应：`Memory[]`
- `POST /api/memories`
  - 请求体：`{ title, content, richText?, eventDate, mood?, tags[], media[], location?, people[] }`
  - 响应：`Memory`
- `PATCH /api/memories/:id`
  - 部分更新（标题、内容、标签、媒体、摘要等）
- `DELETE /api/memories/:id`
- 媒体上传可走 `POST /api/uploads`，返回 `{ url, thumbnail? }` 后回填到 `media`

### 3.2 照护任务
- `GET /api/tasks`
  - 响应：`CareTask[]`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/tasks/:id/reminders`
  - 请求体：`{ status, timestamp }`
  - 响应：更新后的 `CareTask`
- `PATCH /api/tasks/:id/reminders/:timestamp`
- `DELETE /api/tasks/:id/reminders/:timestamp`

### 3.3 患者评估 / 营养
- `GET /api/patient/profile`
- `PATCH /api/patient/profile`
- `GET /api/patient/assessments`
- `POST /api/patient/assessments`
  - 请求体契约（与前端 Mock 保持一致）：
    ```json
    {
      "date": "2024-08-30",
      "templateId": "pet-tau",
      "label": "PET Tau",
      "metric": "tau",
      "value": 1.28,
      "unit": "SUVR",
      "status": "海马区 tau 聚集增加",
      "notes": "左侧海马强化明显。"
    }
    ```
- `PATCH /api/patient/assessments/:id`
- `DELETE /api/patient/assessments/:id`

### 3.4 资讯与收藏
- `GET /api/news`
  - 支持 `topic?`、`bookmark?` 过滤
- `POST /api/news/:id/bookmark`
  - 请求体：`{ isBookmarked: boolean }`

### 3.5 照护者档案
- `GET /api/caregiver`
- `PATCH /api/caregiver`
  - 请求体：支持更新 `preferences.notification`、`language`、`theme`、`followedTopics`

## 4. Drizzle 数据库建模
推荐使用 PostgreSQL，以下为核心表结构（省略通用字段 `created_at`, `updated_at`）：

```ts
// memories
memories (
  id            varchar primary key,
  title         varchar(120) not null,
  content       text not null,
  rich_text     text,
  cover_media_id varchar,
  event_date    date not null,
  mood          varchar(32),
  location      varchar(120)
)

memory_media (
  id         varchar primary key,
  memory_id  varchar references memories(id) on delete cascade,
  type       varchar(16) not null,
  url        text not null,
  thumbnail  text,
  name       varchar(120),
  transcript text
)

memory_annotations (
  id          varchar primary key,
  memory_id   varchar references memories(id) on delete cascade,
  target_id   varchar,
  type        varchar(16) not null,
  body        text not null,
  timestamp   integer,
  created_by  varchar(60)
)

memory_insights (
  memory_id varchar primary key references memories(id) on delete cascade,
  summary   text,
  tone      varchar(16),
  keywords  text[]
)

// tasks
care_tasks (
  id             varchar primary key,
  title          varchar(80) not null,
  category       varchar(40) not null,
  frequency      varchar(24) not null,
  start_at       timestamptz not null,
  end_at         timestamptz,
  priority       varchar(8) not null,
  reminder_lead  integer,
  reminder_channel text[] not null,
  notes          text
)

task_history (
  task_id   varchar references care_tasks(id) on delete cascade,
  timestamp timestamptz not null,
  status    varchar(16) not null,
  primary key (task_id, timestamp)
)

// patient
patient_profiles (
  id             varchar primary key,
  name           varchar(40) not null,
  gender         varchar(8) not null,
  age            integer,
  birth_date     date,
  diagnosis_date date,
  caregiver      varchar(60),
  contact_phone  varchar(20),
  address        varchar(120),
  medications    text[],
  notes          text
)

patient_assessments (
  id          varchar primary key,
  patient_id  varchar references patient_profiles(id) on delete cascade,
  template_id varchar(40) not null,
  label       varchar(60) not null,
  metric      varchar(16) not null,
  value       numeric,
  unit        varchar(16) not null,
  status      varchar(120) not null,
  notes       text,
  date        date not null
)

// news
news_articles (
  id            varchar primary key,
  title         varchar(160) not null,
  source        varchar(60) not null,
  summary       text not null,
  published_at  timestamptz not null,
  topics        text[] not null,
  url           text not null,
  highlight     text,
  is_bookmarked boolean default false
)

// caregiver profile
caregiver_profiles (
  id            varchar primary key,
  name          varchar(40) not null,
  role          varchar(40) not null,
  avatar        text,
  streak        integer default 0,
  care_focus    text[] not null,
  followed_topics text[] not null,
  notification_daily_digest boolean,
  notification_news boolean,
  notification_tasks boolean,
  language      varchar(16) default 'zh-CN',
  theme         varchar(16) default 'auto'
)
```

> Drizzle 建议：
> - 创建 `drizzle.config.ts`，使用 `@vercel/postgres`/`neon` 连接。
> - 所有字符串 ID 使用 cuid/uuid，保证分布式唯一性。
> - 对常用查询字段（`event_date`, `start_at`, `published_at`）建索引。

## 5. Next.js + shadcn/ui 实现建议
- **目录结构**
  ```
  app/
    api/
      memories/route.ts
      memories/[id]/route.ts
      tasks/route.ts
      tasks/[id]/route.ts
      tasks/[id]/reminders/route.ts
      patient/profile/route.ts
      patient/assessments/route.ts
      patient/assessments/[id]/route.ts
      news/route.ts
      news/[id]/bookmark/route.ts
      caregiver/route.ts
  lib/
    db.ts         // drizzle client
    dto/          // zod schemas
    repositories/ // 数据访问封装
  components/ui/  // shadcn 组件
  app/(dashboard)/...
  ```
- **请求校验**：使用 `zod` 定义 DTO，与前端类型对齐；路由层做解析 + 错误处理。
- **鉴权**：预留 middleware（如 `middleware.ts`）处理身份验证；若短期内无需登录，可返回固定用户 `patient-001`。
- **shadcn/ui**：用于后端运营界面（如内容审核、任务模板管理），建议在 `app/(dashboard)` 下构建相应页面。
- **缓存策略**：
  - 列表接口支持 `GET` 缓存与 `revalidate`。
  - 写操作完成后可通过 `revalidatePath('/api/...')` 或事件总线刷新。

## 6. 前端集成现状与契约
- `src/services/mockApi/patient.ts` 已实现 `getPatientProfile / updatePatientProfile / listPatientAssessments / createPatientAssessment / updatePatientAssessment / deletePatientAssessment`，并在 `src/stores/patient.ts` 中被消费。
- 评估新增/更新现在会通过 Mock API 返回真实 ID；前端在 `NutritionPage` 中使用 `await` 保证顺序，并在失败时给出提示。
- 记忆、任务、资讯、照护档案等模块仍通过对应的 `mockApi` 执行 `list` 操作，后端实现时需保持字段一致。
- 接口响应需满足以下通用约定：
  - 时间统一使用 `ISO 8601`（带时区），日期使用 `YYYY-MM-DD`。
  - 列表返回数组，单项返回对象。
  - 删除成功返回 204，无 body；若对象不存在返回 404 并附带错误信息。

### 前端字段映射一览
| 前端 store | Mock 方法 | 预期后端接口 |
| --- | --- | --- |
| `useMemoriesStore.fetchMemories` | `listMemories()` | `GET /api/memories`
| `useMemoriesStore.addMemory` | （待后续扩展） | `POST /api/memories`
| `useTasksStore.fetchTasks` | `listTasks()` | `GET /api/tasks`
| `useTasksStore.addTask` | （待扩展） | `POST /api/tasks`
| `useNewsStore.fetchNews` | `listNews()` | `GET /api/news`
| `useProfileStore.fetchProfile` | `getProfile()` | `GET /api/caregiver`
| `usePatientStore.fetchProfile` | `getPatientProfile()` | `GET /api/patient/profile`
| `usePatientStore.fetchAssessments` | `listPatientAssessments()` | `GET /api/patient/assessments`
| `usePatientStore.addAssessment` | `createPatientAssessment()` | `POST /api/patient/assessments`

## 7. 推进计划与验证
1. **后端开发**
   - 基于本文档建表并实现 API；所有路由通过 `zod` 校验。
   - 为关键接口编写单元测试（可用 Vitest / Jest）与 Postman Collection。
2. **联调前置**
   - 在 Next.js 项目中提供 `.env` 示例，暴露数据库连接、JWT 秘钥等。
   - 生成 Swagger / OpenAPI 文档（可选，使用 `next-swagger-doc`）。
3. **联调验收**
   - 前端将 `mockApi` 替换为真实 `fetch`/`axios` 调用，只需对 `src/services` 层做封装替换。
   - 通过实际场景（新增评估、更新任务、删除回忆）进行回归。
4. **运维与监控**
   - 使用 Vercel / Docker 部署，结合 `drizzle-kit` 做数据库迁移。
   - 对写接口增加日志与审计，方便医疗合规追溯。

---
如需扩展更多模块（如饮食推荐、AI 摘要再训练），可在本方案基础上追加 API 与数据表定义。
