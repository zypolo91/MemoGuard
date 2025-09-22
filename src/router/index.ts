import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "memories",
      component: () => import("@/modules/memories/MemoriesPage.vue"),
      meta: {
        icon: "Memory",
        label: "记忆守护"
      }
    },
    {
      path: "/tasks",
      name: "tasks",
      component: () => import("@/modules/tasks/TasksPage.vue"),
      meta: {
        icon: "Calendar",
        label: "关怀任务"
      }
    },
    {
      path: "/nutrition",
      name: "nutrition",
      component: () => import("@/modules/diet/NutritionPage.vue"),
      meta: {
        icon: "Leaf",
        label: "正念饮食"
      }
    },
    {
      path: "/insights",
      name: "insights",
      component: () => import("@/modules/insights/InsightsPage.vue"),
      meta: {
        icon: "Sparkle",
        label: "资讯洞察"
      }
    },
    {
      path: "/profile",
      name: "profile",
      component: () => import("@/modules/profile/ProfilePage.vue"),
      meta: {
        icon: "User",
        label: "我的"
      }
    }
  ]
});

export default router;
