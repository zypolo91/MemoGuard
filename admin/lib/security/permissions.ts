export type AdminRole = "superadmin" | "manager" | "editor" | "viewer";

export const ADMIN_ROLES: AdminRole[] = ["superadmin", "manager", "editor", "viewer"];

export type AdminModule =
  | "dashboard"
  | "memories"
  | "tasks"
  | "patient"
  | "caregiver"
  | "insights"
  | "users"
  | "admins"
  | "uploads";

type PermissionMap = Record<AdminModule, { view: AdminRole[]; manage: AdminRole[] }>;

const createRoleSet = (roles: AdminRole[]): AdminRole[] => roles;

export const MODULE_PERMISSIONS: PermissionMap = {
  dashboard: { view: ADMIN_ROLES, manage: ADMIN_ROLES },
  memories: {
    view: createRoleSet(["superadmin", "manager", "editor", "viewer"]),
    manage: createRoleSet(["superadmin", "manager", "editor"])
  },
  tasks: {
    view: createRoleSet(["superadmin", "manager", "editor", "viewer"]),
    manage: createRoleSet(["superadmin", "manager", "editor"])
  },
  patient: {
    view: createRoleSet(["superadmin", "manager", "editor"]),
    manage: createRoleSet(["superadmin", "manager"])
  },
  caregiver: {
    view: createRoleSet(["superadmin", "manager", "editor"]),
    manage: createRoleSet(["superadmin", "manager"])
  },
  insights: {
    view: createRoleSet(["superadmin", "manager", "editor", "viewer"]),
    manage: createRoleSet(["superadmin", "manager", "editor"])
  },
  users: {
    view: createRoleSet(["superadmin", "manager"]),
    manage: createRoleSet(["superadmin", "manager"])
  },
  admins: {
    view: createRoleSet(["superadmin", "manager"]),
    manage: createRoleSet(["superadmin"])
  },
  uploads: {
    view: createRoleSet(["superadmin", "manager", "editor", "viewer"]),
    manage: createRoleSet(["superadmin", "manager", "editor"])
  }
};

export function canViewModule(role: AdminRole, module: AdminModule) {
  return MODULE_PERMISSIONS[module].view.includes(role);
}

export function canManageModule(role: AdminRole, module: AdminModule) {
  return MODULE_PERMISSIONS[module].manage.includes(role);
}

export function getRoleLabel(role: AdminRole) {
  switch (role) {
    case "superadmin":
      return "超级管理员";
    case "manager":
      return "运营管理员";
    case "editor":
      return "内容编辑";
    case "viewer":
      return "只读访客";
    default:
      return role;
  }
}
