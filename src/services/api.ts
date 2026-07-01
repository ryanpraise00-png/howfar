import { secureStorage, SecureKeys } from './secureStorage';

// Set EXPO_PUBLIC_API_URL in your .env (e.g. http://192.168.x.x:4000 for local dev)
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface RequestOptions {
  body?: unknown;
  token?: string | null;
  /** Skip the auto-attach + 401-refresh logic (used internally by refreshTokens) */
  skipAuth?: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseError(res: Response): Promise<ApiError> {
  try {
    const json = await res.json() as { error?: { code?: string; message?: string } };
    return new ApiError(res.status, json.error?.code ?? 'API_ERROR', json.error?.message ?? res.statusText);
  } catch {
    return new ApiError(res.status, 'API_ERROR', res.statusText);
  }
}

async function rawRequest<T>(method: HttpMethod, path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts.token) headers['Authorization'] = `Bearer ${opts.token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) throw await parseError(res);
  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// ── auto-auth wrapper ─────────────────────────────────────────────────────────
// Reads the stored access token, attaches it, and on 401 tries one token refresh.

async function request<T>(method: HttpMethod, path: string, opts: RequestOptions = {}): Promise<T> {
  if (opts.skipAuth) return rawRequest<T>(method, path, opts);

  const token = opts.token ?? await secureStorage.get(SecureKeys.AUTH_TOKEN);

  try {
    return await rawRequest<T>(method, path, { ...opts, token });
  } catch (err) {
    if (!(err instanceof ApiError) || err.status !== 401) throw err;

    // Attempt a silent token refresh
    const refreshToken = await secureStorage.get(SecureKeys.REFRESH_TOKEN);
    if (!refreshToken) throw err;

    try {
      const { accessToken, refreshToken: newRefresh } = await rawRequest<{
        accessToken: string;
        refreshToken: string;
      }>('POST', '/api/auth/refresh', {
        body: { refreshToken },
        skipAuth: true,
      });

      await secureStorage.set(SecureKeys.AUTH_TOKEN, accessToken);
      await secureStorage.set(SecureKeys.REFRESH_TOKEN, newRefresh);

      // Retry original request with fresh token
      return rawRequest<T>(method, path, { ...opts, token: accessToken });
    } catch {
      // Refresh failed — caller must handle (e.g. redirect to login)
      throw err;
    }
  }
}

export const api = {
  get:    <T>(path: string, opts?: RequestOptions) => request<T>('GET',    path, opts),
  post:   <T>(path: string, body: unknown, opts?: RequestOptions) => request<T>('POST',   path, { ...opts, body }),
  patch:  <T>(path: string, body: unknown, opts?: RequestOptions) => request<T>('PATCH',  path, { ...opts, body }),
  put:    <T>(path: string, body: unknown, opts?: RequestOptions) => request<T>('PUT',    path, { ...opts, body }),
  delete: <T>(path: string, opts?: RequestOptions) => request<T>('DELETE', path, opts),
};
