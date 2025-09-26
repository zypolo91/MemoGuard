import type { Metadata } from "next";
import { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "MemoGuard Admin",
  description: "Admin backend for MemoGuard platform"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">{children}</body>
    </html>
  );
}
