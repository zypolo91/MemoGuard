"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const loginMutation = useMutation({
    mutationFn: async (payload: { username: string; password: string }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error?.message || "登录失败");
      }
      return res.json();
    },
    onSuccess: () => router.push("/dashboard")
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-6">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const username = String(fd.get("username") || "").trim();
          const password = String(fd.get("password") || "").trim();
          if (!username || !password) {
            setError("请输入用户名和密码");
            return;
          }
          setError(null);
          loginMutation.mutate({ username, password });
        }}
        className="w-full max-w-sm space-y-4 rounded-lg border border-border bg-card p-6 shadow"
      >
        <h1 className="text-lg font-semibold">后台登录</h1>
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">用户名</label>
          <input name="username" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
        </div>
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">密码</label>
          <input name="password" type="password" className="w-full rounded-md border border-border px-3 py-2 text-sm" />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={loginMutation.isPending}
          className="w-full rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-70"
        >
          {loginMutation.isPending ? "登录中..." : "登录"}
        </button>
      </form>
    </div>
  );
}
