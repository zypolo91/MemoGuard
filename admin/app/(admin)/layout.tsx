import { ReactNode } from "react";
import { requireAdminOrRedirect } from "@/lib/auth/session";
import { AdminShell } from "@/components/layout/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdminOrRedirect();
  return <AdminShell initialRole={me.role}>{children}</AdminShell>;
}