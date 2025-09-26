import type { AdminModule } from "@/lib/security/permissions";

export interface NavItem {
  key: AdminModule;
  label: string;
  href: string;
  description?: string;
  group: "运营模块" | "照护档案" | "账号管理" | "工具";
}

export const NAV_ITEMS: NavItem[] = [
  {
    key: "dashboard",
    label: "数据总览",
    href: "/dashboard",
    description: "掌握平台关键指标与趋势",
    group: "运营模块"
  },
  {
    key: "memories",
    label: "记忆库",
    href: "/memories",
    description: "管理记忆记录与多媒体素材",
    group: "运营模块"
  },
  {
    key: "tasks",
    label: "任务提醒",
    href: "/tasks",
    description: "安排任务并跟进执行情况",
    group: "运营模块"
  },
  {
    key: "insights",
    label: "资讯速递",
    href: "/insights",
    description: "汇总行业资讯与精选内容",
    group: "运营模块"
  },
  {
    key: "patient",
    label: "患者档案",
    href: "/patient",
    description: "维护患者资料与评估记录",
    group: "照护档案"
  },
  {
    key: "caregiver",
    label: "照护者信息",
    href: "/caregiver",
    description: "管理家属及照护者数据",
    group: "照护档案"
  },
  {
    key: "users",
    label: "用户管理",
    href: "/users",
    description: "查看与维护平台用户账户",
    group: "账号管理"
  },
  {
    key: "admins",
    label: "管理员",
    href: "/admins",
    description: "配置后台管理员账户与权限",
    group: "账号管理"
  },
  {
    key: "uploads",
    label: "上传记录",
    href: "/uploads",
    description: "追踪 API 上传与文件存储",
    group: "工具"
  }
];
