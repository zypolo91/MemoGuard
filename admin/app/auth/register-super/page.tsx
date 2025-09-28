"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export default function RegisterSuperPage() {
  const router = useRouter();

  const initQuery = useQuery({
    queryKey: ["auth-init"],
    queryFn: async () => {
      const res = await fetch("/api/auth/init");
      if (!res.ok) throw new Error("无法初始化");
      return (await res.json()) as { hasAdmin: boolean };
    }
  });

  const registerMutation = useMutation({
    mutationFn: async (payload: { username: string; password: string; displayName?: string; email?: string }) => {
      const res = await fetch("/api/auth/register-super", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || "创建失败");
      }
      return res.json();
    },
    onSuccess: () => router.push("/auth/login")
  });

  if (initQuery.isLoading) return <p className="p-6 text-sm text-muted-foreground">检查系统状态...</p>;
  if (initQuery.data?.hasAdmin) {
    router.replace("/auth/login");
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const payload = {
            username: String(fd.get("username") || "").trim(),
            password: String(fd.get("password") || "").trim(),
            displayName: String(fd.get("displayName") || "").trim(),
            email: String(fd.get("email") || "").trim()
          };
          if (!payload.username || !payload.password) return;
          registerMutation.mutate(payload);
        }}
        className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6 shadow"
      >
        <h1 className="text-lg font-semibold">初始化超级管理员</h1>
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">用户名</label>
          <input name="username" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">密码</label>
          <input name="password" type="password" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">显示名（可选）</label>
          <input name="displayName" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">邮箱（可选）</label>
          <input name="email" type="email" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
        </div>
        <button
          type="submit"
          disabled={registerMutation.isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
        >
          {registerMutation.isPending ? "保存中..." : "创建超级管理员"}
        </button>
      </form>
    </div>
  );
}
