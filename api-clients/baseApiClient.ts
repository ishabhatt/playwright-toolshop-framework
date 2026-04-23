import { APIRequestContext, APIResponse } from '@playwright/test';

export type QueryValue = string | number | boolean | undefined | null;

export type ApiResult<T> = {
  response: APIResponse;
  status: number;
  ok: boolean;
  body: T;
  contentType: string | null;
  hasBody: boolean;
  rawBody: string | null;
};

function cleanParams(
  params?: Record<string, QueryValue>,
): Record<string, string> | undefined {
  if (!params) return undefined;

  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([key, value]) => [key, String(value)]);

  return Object.fromEntries(entries) as Record<string, string>;
}

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function parseResponseBody<T>(response: APIResponse): Promise<{
  body: T;
  contentType: string | null;
  hasBody: boolean;
  rawBody: string | null;
}> {
  const contentType = response.headers()['content-type'] ?? null;
  const status = response.status();

  // 204/205/304 responses should be treated as bodyless even if parsing is attempted.
  if ([204, 205, 304].includes(status)) {
    return {
      body: null as unknown as T,
      contentType,
      hasBody: false,
      rawBody: null,
    };
  }

  const rawBody = await response.text();
  if (rawBody.length === 0) {
    return {
      body: null as unknown as T,
      contentType,
      hasBody: false,
      rawBody: null,
    };
  }

  if (contentType?.includes('application/json')) {
    return {
      body: JSON.parse(rawBody) as T,
      contentType,
      hasBody: true,
      rawBody,
    };
  }

  return {
    body: rawBody as unknown as T,
    contentType,
    hasBody: true,
    rawBody,
  };
}

export class BaseApiClient {
  constructor(private readonly request: APIRequestContext) {}

  async get<T>(
    path: string,
    params?: Record<string, QueryValue>,
    token?: string,
  ): Promise<ApiResult<T>> {
    const response = await this.request.get(path, {
      params: cleanParams(params),
      headers: buildHeaders(token),
      timeout: 45_000,
    });
    const parsed = await parseResponseBody<T>(response);

    return {
      response,
      status: response.status(),
      ok: response.ok(),
      body: parsed.body,
      contentType: parsed.contentType,
      hasBody: parsed.hasBody,
      rawBody: parsed.rawBody,
    };
  }

  async post<T>(
    path: string,
    body: unknown,
    token?: string,
  ): Promise<ApiResult<T>> {
    const response = await this.request.post(path, {
      data: body,
      headers: buildHeaders(token),
      timeout: 45_000,
    });
    const parsed = await parseResponseBody<T>(response);

    return {
      response,
      status: response.status(),
      ok: response.ok(),
      body: parsed.body,
      contentType: parsed.contentType,
      hasBody: parsed.hasBody,
      rawBody: parsed.rawBody,
    };
  }

  async put<T>(
    path: string,
    body: unknown,
    token?: string,
  ): Promise<ApiResult<T>> {
    const response = await this.request.put(path, {
      data: body,
      headers: buildHeaders(token),
      timeout: 45_000,
    });
    const parsed = await parseResponseBody<T>(response);

    return {
      response,
      status: response.status(),
      ok: response.ok(),
      body: parsed.body,
      contentType: parsed.contentType,
      hasBody: parsed.hasBody,
      rawBody: parsed.rawBody,
    };
  }

  async delete<T>(path: string, token?: string): Promise<ApiResult<T>> {
    const response = await this.request.delete(path, {
      headers: buildHeaders(token),
      timeout: 45_000,
    });
    const parsed = await parseResponseBody<T>(response);

    return {
      response,
      status: response.status(),
      ok: response.ok(),
      body: parsed.body,
      contentType: parsed.contentType,
      hasBody: parsed.hasBody,
      rawBody: parsed.rawBody,
    };
  }
}
