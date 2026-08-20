/**
 * Safe API request helper that prevents response stream consumption bugs
 * and handles both valid JSON responses and fallback text/HTML errors gracefully.
 */

export interface ApiResponse<T = any> {
  ok: boolean;
  status: number;
  data: T;
  rawText?: string;
}

export async function safeFetchJson<T = any>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const res = await fetch(url, options);
    const text = await res.text();
    let parsed: any;
    
    try {
      parsed = text ? JSON.parse(text) : {};
    } catch {
      // If server returned HTML (e.g. Vite SPA index.html or 404/500 error page)
      parsed = {
        success: false,
        error: text.startsWith('<') 
          ? `Server returned unexpected format (HTTP ${res.status}). Please check API endpoint.` 
          : (text || `Server error (HTTP ${res.status})`)
      };
    }

    return {
      ok: res.ok,
      status: res.status,
      data: parsed,
      rawText: text
    };
  } catch (err: any) {
    return {
      ok: false,
      status: 0,
      data: {
        success: false,
        error: `Network error: ${err?.message || 'Failed to connect to server'}`
      } as any
    };
  }
}
