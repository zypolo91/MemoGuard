﻿import { ReactNode } from "react";

import { AdminShell } from "@/components/layout/admin-shell";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
