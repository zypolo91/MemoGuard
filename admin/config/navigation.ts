import type { AdminModule } from "@/lib/security/permissions";

export interface NavItem {
  key: AdminModule;
  label: string;
  href: string;
  description?: string;
  group: "运营数据" | "健康资料" | "账户管理" | "工具";
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "概览",
    href: "/dashboard",
    description: "整体运行情况",
    group: "运营数据"
  },
  {
    key: "memories",
    label: "记忆管理",
    href: "/memories",
    description: "管理记忆内容与媒体",
    group: "运营数据"
  },
  {
    key: "tasks",
    label: "任务管理",
    href: "/tasks",
    description: "护理任务与提醒",
    group: "运营数据"
  },
  {
    key: "insights",
    label: "资讯中心",
    href: "/insights",
    description: "行业资讯与收藏",
    group: "运营数据"
  },
  {
    key: "patient",
    label: "患者资料",
    href: "/patient",
    description: "档案与评估记录",
    group: "健康资料"
  },
  {
    key: "caregiver",
    label: "照护者设置",
    href: "/caregiver",
    description: "照护者档案与偏好",
    group: "健康资料"
  },
  {
    key: "users",
    label: "用户管理",
    href: "/users",
    description: "平台用户账号",
    group: "账户管理"
  },
  {
    key: "admins",
    label: "管理员",
    href: "/admins",
    description: "后台管理员账号",
    group: "账户管理"
  },
  {
    key: "uploads",
    label: "上传工具",
    href: "/uploads",
    description: "API 上传调试",
    group: "工具"
  }
];
