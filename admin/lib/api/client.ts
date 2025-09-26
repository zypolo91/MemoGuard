export type RequestOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
};

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const init: RequestInit = {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers ?? {})
    }
  };

  if (options.json !== undefined) {
    init.body = JSON.stringify(options.json);
  }

  const response = await fetch(path, init);
  let data: unknown = null;

  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "error" in data
        ? (data as { error?: { message?: string } }).error?.message ?? "请求失败"
        : `请求失败 (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}
