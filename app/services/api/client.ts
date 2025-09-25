const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:3000/api";

type RequestOptions = Omit<RequestInit, "body"> & {
  json?: unknown;
};

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return (await response.json()) as T;
  }
  const text = await response.text();
  return text as unknown as T;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
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

  const response = await fetch(url, init);
  if (!response.ok) {
    const errorBody = await parseResponse<{ error?: { message?: string } }>(response).catch(() => undefined);
    const message = errorBody?.error?.message ?? `请求失败 (${response.status})`;
    throw new Error(message);
  }

  return parseResponse<T>(response);
}
