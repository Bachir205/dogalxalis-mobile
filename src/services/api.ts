import { z, type ZodType } from 'zod';

import {
  apiBudgetSchema,
  apiCategorySchema,
  apiErrorSchema,
  apiTransactionSchema,
  type ApiBudget,
  type ApiCategory,
  type ApiTransaction,
} from '@/validation/apiSchemas';

/**
 * network = the server could not be reached; timeout = it did not answer in time;
 * http = it answered with an error status; invalid = it answered with something unreadable.
 */
export type ApiErrorKind = 'network' | 'timeout' | 'http' | 'invalid';

export class ApiError extends Error {
  constructor(
    public readonly kind: ApiErrorKind,
    message: string,
    public readonly status?: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** The server understood the request and refused it (400, 404, 409...): retrying is pointless. */
export function isHttpClientError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.kind === 'http' && (error.status ?? 0) >= 400 && (error.status ?? 0) < 500;
}

export function isNotFound(error: unknown): boolean {
  return error instanceof ApiError && error.kind === 'http' && error.status === 404;
}

/** Every call the app makes to the server. Screens never use fetch directly. */
export interface ApiClient {
  listCategories(): Promise<ApiCategory[]>;
  createCategory(body: ApiCategory): Promise<ApiCategory>;
  updateCategory(id: string, body: ApiCategory): Promise<ApiCategory>;

  listTransactions(): Promise<ApiTransaction[]>;
  createTransaction(body: ApiTransaction): Promise<ApiTransaction>;
  updateTransaction(id: string, body: ApiTransaction): Promise<ApiTransaction>;
  deleteTransaction(id: string): Promise<void>;

  listBudgets(): Promise<ApiBudget[]>;
  createBudget(body: ApiBudget): Promise<ApiBudget>;
  updateBudget(id: string, body: ApiBudget): Promise<ApiBudget>;
  deleteBudget(id: string): Promise<void>;
}

interface ClientOptions {
  timeoutMs?: number;
  /** Replaceable in tests. */
  fetchImpl?: typeof fetch;
}

const DEFAULT_TIMEOUT_MS = 8000;

export function createApiClient(baseUrl: string, options: ClientOptions = {}): ApiClient {
  const base = baseUrl.trim().replace(/\/+$/, '');
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const doFetch = options.fetchImpl ?? fetch;

  async function request<T>(
    method: string,
    path: string,
    spec: { body?: unknown; schema?: ZodType<T> } = {},
  ): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let status: number;
    let text: string;
    try {
      const response = await doFetch(`${base}${path}`, {
        method,
        headers: {
          Accept: 'application/json',
          ...(spec.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        },
        body: spec.body !== undefined ? JSON.stringify(spec.body) : undefined,
        signal: controller.signal,
      });
      status = response.status;
      text = await response.text();
    } catch (error) {
      if (controller.signal.aborted) {
        throw new ApiError('timeout', `The server did not answer within ${timeoutMs} ms`);
      }
      throw new ApiError('network', error instanceof Error ? error.message : 'Network request failed');
    } finally {
      clearTimeout(timer);
    }

    if (status < 200 || status >= 300) {
      let code: string | undefined;
      let message = `HTTP ${status}`;
      try {
        const parsed = apiErrorSchema.safeParse(JSON.parse(text));
        if (parsed.success) {
          code = parsed.data.error.code;
          message = parsed.data.error.message ?? message;
        }
      } catch {
        // The error body was not JSON: keep the generic message.
      }
      throw new ApiError('http', message, status, code);
    }

    if (!spec.schema) return undefined as T; // 204 No Content
    try {
      const envelope = z.object({ data: spec.schema }).parse(JSON.parse(text));
      return envelope.data;
    } catch {
      throw new ApiError('invalid', 'The server sent an unexpected response', status);
    }
  }

  const segment = (id: string) => encodeURIComponent(id);

  return {
    listCategories: () => request('GET', '/categories', { schema: z.array(apiCategorySchema) }),
    createCategory: (body) => request('POST', '/categories', { body, schema: apiCategorySchema }),
    updateCategory: (id, body) => request('PUT', `/categories/${segment(id)}`, { body, schema: apiCategorySchema }),

    listTransactions: () => request('GET', '/transactions', { schema: z.array(apiTransactionSchema) }),
    createTransaction: (body) => request('POST', '/transactions', { body, schema: apiTransactionSchema }),
    updateTransaction: (id, body) =>
      request('PUT', `/transactions/${segment(id)}`, { body, schema: apiTransactionSchema }),
    deleteTransaction: (id) => request<void>('DELETE', `/transactions/${segment(id)}`),

    listBudgets: () => request('GET', '/budgets', { schema: z.array(apiBudgetSchema) }),
    createBudget: (body) => request('POST', '/budgets', { body, schema: apiBudgetSchema }),
    updateBudget: (id, body) => request('PUT', `/budgets/${segment(id)}`, { body, schema: apiBudgetSchema }),
    deleteBudget: (id) => request<void>('DELETE', `/budgets/${segment(id)}`),
  };
}

let cached: ApiClient | null | undefined;

/**
 * The client for the server named in EXPO_PUBLIC_API_URL (see .env.example), or null when no
 * server is configured: the app then simply works offline with the data on the phone.
 * The URL is never written in the code. (Expo replaces process.env.EXPO_PUBLIC_* at build time.)
 */
export function getApiClient(): ApiClient | null {
  if (cached === undefined) {
    const url = process.env.EXPO_PUBLIC_API_URL?.trim();
    cached = url ? createApiClient(url) : null;
  }
  return cached;
}
