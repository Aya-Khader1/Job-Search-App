export const API_URL = ((import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000").replace(/\/$/, "");

const STORAGE_KEY = "shortlist.tokens";

export interface Tokens {
  accessToken: string;
  refreshToken?: string;
}

/**
 * Tokens live in sessionStorage, which is private to each browser tab. That lets
 * you stay signed in as a different user in every tab (localStorage would share
 * one session across all tabs). Closing a tab signs that tab out.
 */
export const tokenStore = {
  get(): Tokens | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Tokens) : null;
    } catch {
      return null;
    }
  },
  set(t: Tokens) {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch { /* storage unavailable */ }
  },
  clear() {
    try { sessionStorage.removeItem(STORAGE_KEY); } catch { /* storage unavailable */ }
  },
};

export class ApiError extends Error {
  status: number;
  details: string[];
  constructor(message: string, status: number, details: string[] = []) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/** The backend returns validation failures as { message, cause: [{ key, issues: [{ message, path }] }] }. */
function readDetails(cause: unknown): string[] {
  if (!Array.isArray(cause)) return [];
  const out: string[] = [];
  for (const group of cause) {
    for (const issue of group?.issues ?? []) {
      const field = Array.isArray(issue.path) && issue.path.length ? `${issue.path.join(".")}: ` : "";
      out.push(`${field}${issue.message}`);
    }
  }
  return out;
}

export function errorText(err: unknown): string {
  if (err instanceof ApiError) {
    return err.details.length ? `${err.message}. ${err.details.join(" · ")}` : err.message;
  }
  return err instanceof Error ? err.message : "Something went wrong";
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  json?: unknown;
  form?: FormData;
  query?: Record<string, string | number | undefined | null>;
  auth?: boolean;
  /** Use the refresh token instead of the access token */
  useRefresh?: boolean;
  blob?: boolean;
}

let refreshing: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const tokens = tokenStore.get();
  if (!tokens?.refreshToken) return false;
  refreshing ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/auth/refresh-token`, {
        method: "POST",
        headers: { Authorization: `Bearer ${tokens.refreshToken}` },
      });
      if (!res.ok) return false;
      const body = await res.json();
      const accessToken: string | undefined = body?.data?.accessToken;
      if (!accessToken) return false;
      tokenStore.set({ ...tokens, accessToken });
      window.dispatchEvent(new Event("auth:refreshed"));
      return true;
    } catch {
      return false;
    } finally {
      setTimeout(() => { refreshing = null; }, 0);
    }
  })();
  return refreshing;
}

export async function request<T = unknown>(path: string, opts: RequestOptions = {}, retried = false): Promise<T> {
  const { method = "GET", json, form, query, auth = true, useRefresh, blob } = opts;
  const url = new URL(`${API_URL}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    }
  }

  const headers: Record<string, string> = {};
  if (auth) {
    const tokens = tokenStore.get();
    const token = useRefresh ? tokens?.refreshToken : tokens?.accessToken;
    if (token) headers.Authorization = `Bearer ${token}`;
  }
  let body: BodyInit | undefined;
  if (form) body = form;
  else if (json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(json);
  }

  let res: Response;
  try {
    res = await fetch(url, { method, headers, body });
  } catch {
    throw new ApiError(`Can't reach the server at ${API_URL}. Check that the backend is running.`, 0);
  }

  if (res.status === 401 && auth && !retried && !useRefresh && (await refreshAccessToken())) {
    return request<T>(path, opts, true);
  }

  if (!res.ok) {
    let payload: { message?: string; cause?: unknown } = {};
    try { payload = await res.json(); } catch { /* non-JSON error */ }
    if (res.status === 401 && auth) {
      tokenStore.clear();
      window.dispatchEvent(new Event("auth:expired"));
    }
    const message =
      res.status === 429
        ? "Too many requests. Wait a minute, then try again."
        : payload.message || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, readDetails(payload.cause));
  }

  if (blob) return (await res.blob()) as T;
  return (await res.json()) as T;
}
