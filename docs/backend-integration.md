# MemoGuard ��˼��������뼼������

## 1. ������Ŀ��
- ǰ�ˣ�Vue 3 + Pinia + Vite���Ѿ߱����俨Ƭ���ջ�����Ӫ����������Ѷ�Լ��ջ��ߵ�����ģ�飬��ǰ������ԴΪ `app/services/mockApi` �µı��ؼ����ݡ�
- Ŀ�����ڱ�������ǰ�˽�����ǰ���£��ṩһ�׻��� **Next.js (App Router)** + **shadcn/ui** + **Drizzle ORM** �ĺ��ʵ�ֹ淶�����ں�������ǰ�˶Խӡ�
- ���ĵ�ͬ�������� Mock API ����Լ��ǰ���Ѱ�����Լ�����˸��죬���ֻ����ѭ�����޷�Խӡ�

## 2. ҵ�������������ģ��
| ģ�� | ��Ҫʵ�� | �ؼ��ֶ� | ˵�� |
| --- | --- | --- | --- |
| �����ػ� (`/memories`) | `Memory`��`MemoryMedia`��`MemoryAnnotation`��`MemoryInsight` | ���⡢���ı����ݡ�ý����Դ����ǩ������������ժҪ���ؼ��� | ֧��ʱ�������ǩ��ͼ�������Ҫ�ṩ��ɾ�Ĳ�ӿڼ�ý��Ԫ���ݴ��� |
| �ջ����� (`/tasks`) | `CareTask`��`TaskHistory`/`ReminderLog` | ����Ƶ�Ρ����ȼ���������ʷ��״̬��ת | ��Ҫ֧������� CRUD �Լ�������ʷ����ɾ�� |
| Ӫ�� / ���� (`/nutrition`) | `PatientProfile`��`PatientAssessment`��`AssessmentTemplate` | ��Ա������Ϣ������ģ�塢������¼����ֵ��λ | ������¼Ҫ����������֧�ִ������༭��ɾ�� |
| ��Ѷ���� (`/insights`) | `InsightArticle` | ���⡢��Դ��ժҪ����ǩ���ղ�״̬ | ֻ���б�֧���ղ�״̬�л� |
| �ջ��ߵ��� (`/profile`) | `CareProfile`��`ProfilePreferences` | ͷ�� streak����ע���⡢֪ͨƫ�� | ��ȡ + ����ƫ�� |

> ����ģ��(`assessmentTemplates`) ��ǰ��Ϊ��������˿��ṩ���û��ӿڣ���ѡ���Ա���Ӫ����

## 3. REST API ���
���½ӿڽ���ʹ�� `/api` ǰ׺�������� `application/json`������ 200/201/204 ���廯״̬�룬����ͳһ���� `{ error: { code, message } }`��

### 3.1 �����ػ�
- `GET /api/memories`
  - ��ѯ������`tag?`, `from?`, `to?`
  - ��Ӧ��`Memory[]`
- `POST /api/memories`
  - �����壺`{ title, content, richText?, eventDate, mood?, tags[], media[], location?, people[] }`
  - ��Ӧ��`Memory`
- `PATCH /api/memories/:id`
  - ���ָ��£����⡢���ݡ���ǩ��ý�塢ժҪ�ȣ�
- `DELETE /api/memories/:id`
- ý���ϴ����� `POST /api/uploads`������ `{ url, thumbnail? }` ���� `media`

### 3.2 �ջ�����
- `GET /api/tasks`
  - ��Ӧ��`CareTask[]`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/tasks/:id/reminders`
  - �����壺`{ status, timestamp }`
  - ��Ӧ�����º�� `CareTask`
- `PATCH /api/tasks/:id/reminders/:timestamp`
- `DELETE /api/tasks/:id/reminders/:timestamp`

### 3.3 �������� / Ӫ��
- `GET /api/patient/profile`
- `PATCH /api/patient/profile`
- `GET /api/patient/assessments`
- `POST /api/patient/assessments`
  - ��������Լ����ǰ�� Mock ����һ�£���
    ```json
    {
      "date": "2024-08-30",
      "templateId": "pet-tau",
      "label": "PET Tau",
      "metric": "tau",
      "value": 1.28,
      "unit": "SUVR",
      "status": "������ tau �ۼ�����",
      "notes": "��ຣ��ǿ�����ԡ�"
    }
    ```
- `PATCH /api/patient/assessments/:id`
- `DELETE /api/patient/assessments/:id`

### 3.4 ��Ѷ���ղ�
- `GET /api/news`
  - ֧�� `topic?`��`bookmark?` ����
- `POST /api/news/:id/bookmark`
  - �����壺`{ isBookmarked: boolean }`

### 3.5 �ջ��ߵ���
- `GET /api/caregiver`
- `PATCH /api/caregiver`
  - �����壺֧�ָ��� `preferences.notification`��`language`��`theme`��`followedTopics`

## 4. Drizzle ���ݿ⽨ģ
�Ƽ�ʹ�� PostgreSQL������Ϊ���ı�ṹ��ʡ��ͨ���ֶ� `created_at`, `updated_at`����

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

> Drizzle ���飺
> - ���� `drizzle.config.ts`��ʹ�� `@vercel/postgres`/`neon` ���ӡ�
> - �����ַ��� ID ʹ�� cuid/uuid����֤�ֲ�ʽΨһ�ԡ�
> - �Գ��ò�ѯ�ֶΣ�`event_date`, `start_at`, `published_at`����������

## 5. Next.js + shadcn/ui ʵ�ֽ���
- **Ŀ¼�ṹ**
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
    repositories/ // ���ݷ��ʷ�װ
  components/ui/  // shadcn ���
  app/(dashboard)/...
  ```
- **����У��**��ʹ�� `zod` ���� DTO����ǰ�����Ͷ��룻·�ɲ������� + ������
- **��Ȩ**��Ԥ�� middleware���� `middleware.ts`�����������֤���������������¼���ɷ��ع̶��û� `patient-001`��
- **shadcn/ui**�����ں����Ӫ���棨��������ˡ�����ģ������������� `app/(dashboard)` �¹�����Ӧҳ�档
- **�������**��
  - �б�ӿ�֧�� `GET` ������ `revalidate`��
  - д������ɺ��ͨ�� `revalidatePath('/api/...')` ���¼�����ˢ�¡�

## 6. ǰ�˼�����״����Լ
- `app/services/mockApi/patient.ts` ��ʵ�� `getPatientProfile / updatePatientProfile / listPatientAssessments / createPatientAssessment / updatePatientAssessment / deletePatientAssessment`������ `app/stores/patient.ts` �б����ѡ�
- ��������/�������ڻ�ͨ�� Mock API ������ʵ ID��ǰ���� `NutritionPage` ��ʹ�� `await` ��֤˳�򣬲���ʧ��ʱ������ʾ��
- ���䡢������Ѷ���ջ�������ģ����ͨ����Ӧ�� `mockApi` ִ�� `list` ���������ʵ��ʱ�豣���ֶ�һ�¡�
- �ӿ���Ӧ����������ͨ��Լ����
  - ʱ��ͳһʹ�� `ISO 8601`����ʱ����������ʹ�� `YYYY-MM-DD`��
  - �б������飬����ض���
  - ɾ���ɹ����� 204���� body�������󲻴��ڷ��� 404 ������������Ϣ��

### ǰ���ֶ�ӳ��һ��
| ǰ�� store | Mock ���� | Ԥ�ں�˽ӿ� |
| --- | --- | --- |
| `useMemoriesStore.fetchMemories` | `listMemories()` | `GET /api/memories`
| `useMemoriesStore.addMemory` | ����������չ�� | `POST /api/memories`
| `useTasksStore.fetchTasks` | `listTasks()` | `GET /api/tasks`
| `useTasksStore.addTask` | ������չ�� | `POST /api/tasks`
| `useNewsStore.fetchNews` | `listNews()` | `GET /api/news`
| `useProfileStore.fetchProfile` | `getProfile()` | `GET /api/caregiver`
| `usePatientStore.fetchProfile` | `getPatientProfile()` | `GET /api/patient/profile`
| `usePatientStore.fetchAssessments` | `listPatientAssessments()` | `GET /api/patient/assessments`
| `usePatientStore.addAssessment` | `createPatientAssessment()` | `POST /api/patient/assessments`

## 7. �ƽ��ƻ�����֤
1. **��˿���**
   - ���ڱ��ĵ�����ʵ�� API������·��ͨ�� `zod` У�顣
   - Ϊ�ؼ��ӿڱ�д��Ԫ���ԣ����� Vitest / Jest���� Postman Collection��
2. **����ǰ��**
   - �� Next.js ��Ŀ���ṩ `.env` ʾ������¶���ݿ����ӡ�JWT ��Կ�ȡ�
   - ���� Swagger / OpenAPI �ĵ�����ѡ��ʹ�� `next-swagger-doc`����
3. **��������**
   - ǰ�˽� `mockApi` �滻Ϊ��ʵ `fetch`/`axios` ���ã�ֻ��� `app/services` ������װ�滻��
   - ͨ��ʵ�ʳ�����������������������ɾ�����䣩���лع顣
4. **��ά����**
   - ʹ�� Vercel / Docker ���𣬽�� `drizzle-kit` �����ݿ�Ǩ�ơ�
   - ��д�ӿ�������־����ƣ�����ҽ�ƺϹ�׷�ݡ�

---
������չ����ģ�飨����ʳ�Ƽ���AI ժҪ��ѵ���������ڱ�����������׷�� API �����ݱ��塣
