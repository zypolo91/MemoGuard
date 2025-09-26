"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo } from "react";

import { NAV_ITEMS, type NavItem } from "@/config/navigation";
import { getRoleLabel, canViewModule, type AdminRole } from "@/lib/security/permissions";
import { QueryProvider } from "@/components/providers/query-provider";
import { RoleProvider, useActiveRole } from "@/components/providers/role-provider";

function Sidebar() {
  const pathname = usePathname();
  const { role } = useActiveRole();

  const groups = useMemo(() => {
    const map = new Map<string, NavItem[]>();
    for (const item of NAV_ITEMS) {
      if (!canViewModule(role, item.key)) continue;
      const existing = map.get(item.group) ?? [];
      map.set(item.group, [...existing, item]);
    }
    return Array.from(map.entries());
  }, [role]);

  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-border bg-card">
      <div className="px-6 py-5 text-lg font-semibold">MemoGuard 后台</div>
      <nav className="flex-1 overflow-y-auto px-2 pb-6">
        {groups.map(([group, items]) => (
          <div key={group} className="mb-6">
            <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">{group}</p>
            <div className="space-y-1">
              {items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.key}
                    href={item.href}
                    className={`flex flex-col rounded-md px-3 py-2 transition hover:bg-muted ${
                      isActive ? "bg-muted text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-muted-foreground/80">{item.description}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

function RoleBadge() {
  const { role, setRole } = useActiveRole();

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">当前角色：</span>
      <select
        className="rounded-md border border-border bg-background px-2 py-1 text-sm"
        value={role}
        onChange={(event) => setRole(event.target.value as AdminRole)}
      >
        <option value="superadmin">超级管理员</option>
        <option value="manager">运营管理员</option>
        <option value="editor">内容编辑</option>
        <option value="viewer">只读访客</option>
      </select>
    </div>
  );
}

function Header() {
  const pathname = usePathname();
  const { role } = useActiveRole();

  const activeItem = useMemo(() => {
    if (!pathname) return undefined;
    return NAV_ITEMS.find((item) => pathname === item.href || pathname.startsWith(`${item.href}/`));
  }, [pathname]);

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
      <div>
        <h1 className="text-xl font-semibold">{activeItem ? activeItem.label : "控制台"}</h1>
        {activeItem?.description && (
          <p className="text-sm text-muted-foreground">{activeItem.description}</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <span className="hidden text-sm text-muted-foreground sm:inline">已连接 Supabase</span>
        <span className="hidden text-sm text-muted-foreground sm:inline">{getRoleLabel(role)}</span>
        <RoleBadge />
      </div>
    </header>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <RoleProvider>
      <QueryProvider>
        <div className="flex min-h-screen bg-background text-foreground">
          <Sidebar />
          <div className="flex flex-1 flex-col">
            <Header />
            <main className="flex-1 overflow-y-auto bg-muted/40 px-6 py-6">{children}</main>
          </div>
        </div>
      </QueryProvider>
    </RoleProvider>
  );
}
