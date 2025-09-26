"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

import type { AdminRole } from "@/lib/security/permissions";

interface RoleContextValue {
  role: AdminRole;
  setRole: (role: AdminRole) => void;
}

const RoleContext = createContext<RoleContextValue | undefined>(undefined);

export function RoleProvider({
  children,
  defaultRole = "superadmin"
}: {
  children: ReactNode;
  defaultRole?: AdminRole;
}) {
  const [role, setRole] = useState<AdminRole>(defaultRole);
  const value = useMemo(() => ({ role, setRole }), [role]);

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useActiveRole() {
  const ctx = useContext(RoleContext);
  if (!ctx) {
    throw new Error("useActiveRole must be used within a RoleProvider");
  }
  return ctx;
}
