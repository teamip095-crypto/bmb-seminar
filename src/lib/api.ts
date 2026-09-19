/**
 * Utility for robust API requests with safe JSON parsing and content-type checking.
 * Prevents "Unexpected token '<', <!doctype ... is not valid JSON" errors
 * when endpoints are warming up or reverse proxies return HTML error/splash pages.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T | null;
  error: string | null;
}

export async function fetchJson<T = any>(
  url: string,
  options?: RequestInit
): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: "application/json",
        ...(options?.headers || {})
      }
    });

    const contentType = res.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (!isJson) {
      // Server returned HTML or text (e.g. cold start proxy splash or 502/503 HTML)
      return {
        ok: false,
        status: res.status,
        data: null,
        error: `Expected JSON but received ${contentType || "non-JSON"}`
      };
    }

    const data = (await res.json()) as T;
    return {
      ok: res.ok,
      status: res.status,
      data: res.ok ? data : null,
      error: res.ok ? null : (data as any)?.error || (data as any)?.message || `HTTP ${res.status}`
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: null,
      error: err?.message || "Network request failed"
    };
  }
}
