# MemoGuard ��������ĵ�

## 1. �ܹ�����
- ʹ�� Vue 3 + TypeScript ������ҳӦ�ã����� Vite ��ɿ��ٿ������Ż��������������
- �������������ԭ�ӻ����ԭ��ԭ�ӣ���ť������򣩡����ӣ�ý�忨Ƭ��ʱ��������л��壨ģ����壩��ҳ��ģ�塣
- ʹ�� Pinia ����ȫ��״̬��������ģ����� Store��Vue Router �������ģ��ĵ�����
- ����ģ������������ݷ��ʣ������������滻Ϊ��ʵ API��ģ��־û���������� LocalStorage�������쳣ʱ���Ž�����
- ��ʽ��ʹ�� Tailwind CSS �����Զ���������ƣ�ʵ���ִ������ڵ��������ϰ����档

## 2. ����ջ
- ���ԣ�TypeScript 5.x���ṩ��̬������ IDE ֧�֡�
- ��ܣ�Vue 3 Composition API����ѡ���� VueUse ���߿⡣
- �������ߣ�Vite + esbuild�����ڿ����ȸ��������������
- ״̬����Pinia ���� LocalStorage �־û������
- ·�ɣ�Vue Router 4��֧�ֻ���·�ɵĴ����Ƭ��
- UI ���ߣ�Tailwind CSS��Headless UI��Heroicons���ṩ�ɷ��ʵĻ��������
- ���ԣ�Vitest + Vue Test Utils ����Ԫ��������ԣ�Playwright ���Ƕ˵���ð�̳�����
- ��������ESLint��Vue + TypeScript ���򣩡�Prettier �Զ���ʽ������ѡ Stylelint Լ�� Tailwind �÷���

## 3. Ӧ�ýṹ
```
app/
  main.ts             // Ӧ��������ע��·�ɡ�Pinia��ȫ����ʽ
  App.vue             // ȫ�ֲ�����ǣ�ҳͷ��������֪ͨ��
  router/
    index.ts          // ·�ɶ�������������ͼ
  stores/
    memories.ts       // ��ģ�黮�ֵ� Pinia Store
    tasks.ts
    recipes.ts
    news.ts
    profile.ts
  modules/
    memories/         // ����ģ����������ʽ����
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
    scheduler.ts      // ���Ѷ�ʱ������֪ͨ����
  assets/
    styles/
      tailwind.css
      tokens.css
mock/
  seed.json           // ��ѡ��̬��ʼ����
```

## 4. ģ�����
### 4.1 ����ģ��
- ���������`MemoryTimeline.vue`��`MemoryCard.vue`��`MemoryComposer.vue`��`MemoryDetailDrawer.vue`��`AnnotationPanel.vue`��
- ���ݽṹ��`id`��`title`��`content`��`media[] { id, type, url, thumbnail, transcript }`��`createdAt`��`eventDate`��`people[]`��`tags[]`��`mood`��`location`��`annotations[] { id, type, targetId, timestamp, body, createdBy }`��
- ��Ҫ���̣�ʱ�������޹�����ʹ�ø��ı��༭������ TipTap�����д�����༭����עģʽ�ṩ���������ۣ�ɾ��������ȷ�ϡ�
- ������ԣ��� Pinia �б����ϴβ鿴�ļ��䣬��������д�� LocalStorage �������������顣

### 4.2 ����ģ��
- �����`TaskDashboard.vue`��`TaskFormDrawer.vue`��`TaskList.vue`��`TaskCalendarStrip.vue`��`ReminderLog.vue`��
- ���ݽṹ��`id`��`title`��`category`��`frequency`��ö�ټ��Զ�����򣩡�`startAt`��`endAt`��`priority`��`reminderLead`��`reminderChannel[]`��`notes`��`statusHistory[] { status, timestamp }`��
- ���ȷ��������� Cron �������������´δ���ʱ�䣬��� `setTimeout` �� `setInterval`��������Ϣ�־û��� LocalStorage��ˢ�º�ָ���
- ֪ͨ���棺ȫ�� Toast �������������ͼ�꣬��ѡģ̬���ѵ�������

### 4.3 ��ʳģ��
- �����`RecipeGrid.vue`��`RecipeCard.vue`��`RecipeDetail.vue`��`RecipeEditor.vue`��`NutritionFacts.vue`��`RecommendationCarousel.vue`��
- ���ݽṹ��`id`��`title`��`description`��`tags[]`��`prepTime`��`cookTime`��`difficulty`��`heroImage`��`ingredients[] { name, quantity, unit }`��`steps[]`��`nutrition { calories, protein, fat, carbs, vitamins: { b12, e, omega3, antioxidants } }`��`pairings[]`��`isBookmarked`��
- �Ƽ����棺���ʽ���� `useRecipeRecommendations` �����ղء������ǩ��ʱ��δ�֣������ֲ����ݡ�

### 4.4 ��Ѷģ��
- �����`InsightsFeed.vue`��`ArticleCard.vue`��`ArticleDetailDrawer.vue`��`HighlightPanel.vue`��`FollowChips.vue`��
- ���ݽṹ��`id`��`title`��`summary`��`content`��`source`��`category`��`publishedAt`��`url`��`highlights[]`��`isFavorite`��`isFollowed`��
- ʹ�� `useNewsFilters` ���ʽ�������������ʡ���������ڣ�ÿ���б�֧������������� Vue Virtual Scroll List����

### 4.5 �ҵ�ģ��
- �����`ProfileOverview.vue`��`ActivityTimeline.vue`��`CollectionsTabs.vue`��`SettingsPanel.vue`��`AnalyticsWidget.vue`��
- ���ݽṹ��`id`��`name`��`avatar`��`role`��`stats { memoriesCreated, tasksCompleted, recipesSaved, articlesHighlighted }`��`preferences { theme, reminderChannels, digestFrequency }`��`activity[] { id, type, refId, description, timestamp }`��
- ͨ���������Ծۺ����� Store ���ݣ�����������ͳ���Ա����Ǳ������ܡ�

## 5. ����ģ����У��
- �� `app/types/` �ж��� TypeScript �ӿڣ�ͨ�� Zod ��ģ��������Ӧ����ύ������ʱУ�顣
- ö�ٳ������� `app/constants/`��������ȼ���Ƶ��ģʽ��������������ѡ�����ƴд����
- ʹ�� `crypto.randomUUID()` ���� ID����������֧������˵����������Լ��� SSR��

## 6. ģ������
- ÿ��ģ��ķ����ļ����� CRUD ���������ش��� 100 �� 400 �����˹��ӳٵ� `Promise<T>` ��ģ�����硣
- `mockApi/index.ts` ��¶���ͻ��Ķ˵㣻δ���滻��ʵ API ʱ�������ʵ�֡�
- �־û����̣�
  1. ���ȴ� LocalStorage �����ռ䣨���� `memoGuard.memories`����ȡ��
  2. �������ڣ���ʹ�� `mock/seed.json` ��Ϊ��ʼ���ݡ�
  3. �����޸ĺ�д�� LocalStorage����ͬ�� Pinia Store ״̬��
- �ṩ `resetMockData()` ���ߣ������������ԡ�

## 7. ״̬�����뻺��
- Store ���� `BaseEntityStore` ���ʽ�������ṩ����̬�����������ֹ۸���������
- ���� `pinia-plugin-persistedstate` �����з�����ѡ��״̬��Ƭͬ���� LocalStorage��
- ʹ�����ʽ API ��������ѡ�������� `useTimelineGroups`��`useDueTasks`�����������������

## 8. ·���뵼��
- ·��ӳ�䣺`/memories`��Ĭ��ʱ���ᣩ��`/memories/:id`��`/tasks`��`/diet`��`/insights`��`/profile`��
- ͨ����̬����ʵ����ͼ�����أ���ʹ�� Vite Chunk ��ʾ������ `/* webpackChunkName: "memories" */`����
- ��������ȷ������·��ǰ�����ģ������ע�롣

## 9. UI ��ʽ������
- Tailwind ���ö���ɫ�壨ƽ����������ůɫ��׺�������壨�� Inter ��ϵͳ��ѡ����
- ʹ�� CSS ���������ࡢԲ�ǡ���Ӱ��֧�������л���
- ��� `prefers-reduced-motion` ý���ѯ���ٶ��������չ������û���
- ���� `@tailwindcss/typography` ��Ⱦ��������Ѷ�еĸ��ı����ݡ�

## 10. ֪ͨ�����
- ���ѵ������� Pinia ��ά�����У����񴴽������ʱע����һ�δ�����
- ��ѡ Web Notifications API�����û�δ��Ȩ����˵�Ӧ���� Toast ���������Ƭ��
- ȫ�����ʽ���� `useNotificationCenter` ͳһȨ��������֪ͨ���á�
- MVP �׶����Ʋ�����ʱ���������������ж�ػ�ҳ������ʱ����ʱ����

## 11. �ɷ���������ʻ�
- ʹ�����廯 HTML �� ARIA ��ɫ������ʱ���ᡢ�ֲ���ѡ��Ƚ�����
- ȫ������Ԫ��֧�ּ��̵�����ģ̬���ڽ�����������ת���ӣ���
- ���� Vue I18n �����İ���������е�һ����ҲΪ����������׼����
- Ϊý�帽���ṩ����ı���Ϊ����Ƶ�����Ļ����֧�ֶ�̬�������š�

## 12. ���Բ���
- ��Ԫ���ԣ�����ģ��У�顢Store ��Ϊ�����������������ߺ�����
- ������ԣ�ʱ������Ⱦ�������У�顢֪ͨ�����������Ƽ��߼���
- �˵���ð�̣��������༭��ɾ�����䣻�������񲢹۲����ѣ��ղز��ף�������Ѷ��
- �����ڼ�ʹ�� Mock Service Worker��MSW����������ȷ������һ�¡�
- ��ѡ GitHub Actions ��ˮ��ִ�� `pnpm lint`��`pnpm test`��`pnpm build`��

## 13. �����������빤��
- ���������Ƽ�ʹ�� pnpm����֤����������������һ���ԡ�
- ͨ�� `.env` �������������� `VITE_APP_NAME`�������ṩ `env.d.ts` ����������
- Vite ���������̬��Դ�� `dist/`���ɲ����� Netlify��Vercel �����⾲̬�йܷ���
- ���� ESLint �� Prettier ��Ԥ�ύ���ӣ�Husky �� lint-staged���Ա��ָ�ʽһ�¡�

## 14. �ɹ۲����������ģ�⣩
- ʵ���������������񣬽��¼�д���ڴ���в������� LocalStorage�������ҵġ�ģ���Ǳ��̶�ȡ��
- �ṩ�����߿����Բ鿴�����غɣ�������ʾ��

## 15. ������ǿ
- ��ģ������滻Ϊ��ʵ��ˣ��� NestJS �� Express ���� PostgreSQL�����������û������֤��
- ����Э���ռ�����ڽ�ɫ��Ȩ�޿��ơ�
- ���Ͽɴ����豸���������ݣ��ṩ�����ܵ����ѡ�
- ����������Ϊ Service Worker �� IndexedDB����������̨���ѿɿ��ԡ�
- �����˹����ܸ�������ѶժҪ����ʳ���Ի��Ƽ���
