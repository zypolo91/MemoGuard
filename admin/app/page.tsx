export default function DashboardLanding() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-semibold">MemoGuard Admin API</h1>
      <p className="max-w-xl text-sm text-muted-foreground">
        Backend service for MemoGuard is running. Refer to the README for API routes and integration details.
      </p>
    </main>
  );
}
