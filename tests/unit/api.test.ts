import { ApiError, createApiClient, isHttpClientError, isNotFound } from '@/services/api';
import type { ApiTransaction } from '@/validation/apiSchemas';

const BASE = 'http://192.168.1.20:3000';

const transaction: ApiTransaction = {
  id: 'tx-1',
  title: 'Lunch',
  amountMinor: 2500,
  currency: 'XOF',
  type: 'expense',
  categoryId: 'cat_food',
  description: null,
  date: '2026-11-10',
  createdAt: '2026-11-10T08:00:00.000Z',
  updatedAt: '2026-11-10T08:00:00.000Z',
};

type Answer = { status?: number; body?: unknown; text?: string };
/** A fetch that answers with canned responses and remembers the requests it got. */
function fakeFetch(...answers: Answer[]) {
  const requests: { url: string; init: RequestInit }[] = [];
  let index = 0;
  const impl = jest.fn(async (url: string, init: RequestInit) => {
    requests.push({ url, init });
    const answer = answers[Math.min(index++, answers.length - 1)];
    const text = answer.text ?? (answer.body === undefined ? '' : JSON.stringify(answer.body));
    return { status: answer.status ?? 200, text: async () => text } as Response;
  });
  return { impl: impl as unknown as typeof fetch, requests };
}

const rejects = async (promise: Promise<unknown>) => {
  try {
    await promise;
  } catch (error) {
    return error as ApiError;
  }
  throw new Error('expected the call to fail');
};

describe('requests', () => {
  it('sends the right method, URL, headers and JSON body', async () => {
    const { impl, requests } = fakeFetch({ status: 201, body: { data: transaction } });
    const api = createApiClient(BASE, { fetchImpl: impl });
    expect(await api.createTransaction(transaction)).toEqual(transaction);

    expect(requests[0].url).toBe(`${BASE}/transactions`);
    expect(requests[0].init.method).toBe('POST');
    expect(requests[0].init.headers).toMatchObject({ 'Content-Type': 'application/json', Accept: 'application/json' });
    expect(JSON.parse(requests[0].init.body as string)).toEqual(transaction);
  });

  it('uses PUT with the id in the path, encoded, and DELETE without a body', async () => {
    const { impl, requests } = fakeFetch({ body: { data: transaction } }, { status: 204 });
    const api = createApiClient(BASE, { fetchImpl: impl });
    await api.updateTransaction('a b/1', transaction);
    await api.deleteTransaction('tx-1');

    expect(requests[0].url).toBe(`${BASE}/transactions/a%20b%2F1`);
    expect(requests[0].init.method).toBe('PUT');
    expect(requests[1].url).toBe(`${BASE}/transactions/tx-1`);
    expect(requests[1].init.method).toBe('DELETE');
    expect(requests[1].init.body).toBeUndefined();
    expect((requests[1].init.headers as Record<string, string>)['Content-Type']).toBeUndefined();
  });

  it('ignores trailing slashes and spaces in the base URL', async () => {
    const { impl, requests } = fakeFetch({ body: { data: [] } });
    await createApiClient(`  ${BASE}//  `, { fetchImpl: impl }).listBudgets();
    expect(requests[0].url).toBe(`${BASE}/budgets`);
  });

  it('returns nothing for a 204 (delete)', async () => {
    const { impl } = fakeFetch({ status: 204 });
    await expect(createApiClient(BASE, { fetchImpl: impl }).deleteBudget('b1')).resolves.toBeUndefined();
  });
});

describe('answers', () => {
  it('returns validated lists', async () => {
    const { impl } = fakeFetch({ body: { data: [transaction] } });
    expect(await createApiClient(BASE, { fetchImpl: impl }).listTransactions()).toEqual([transaction]);
  });

  it('turns an error answer into an ApiError with status and code', async () => {
    const { impl } = fakeFetch({ status: 409, body: { error: { code: 'DUPLICATE', message: 'A budget already exists' } } });
    const error = await rejects(createApiClient(BASE, { fetchImpl: impl }).createBudget({
      id: 'b1', categoryId: 'cat_food', amountMinor: 1, currency: 'XOF', month: '2026-11', createdAt: 'n', updatedAt: 'n',
    }));
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ kind: 'http', status: 409, code: 'DUPLICATE', message: 'A budget already exists' });
    expect(isHttpClientError(error)).toBe(true);
    expect(isNotFound(error)).toBe(false);
  });

  it('recognizes a 404, and a server error that is not a refusal', async () => {
    const { impl } = fakeFetch({ status: 404, body: { error: { code: 'NOT_FOUND' } } }, { status: 500, text: '<html>oops</html>' });
    const api = createApiClient(BASE, { fetchImpl: impl });
    const notFound = await rejects(api.updateTransaction('x', transaction));
    expect(isNotFound(notFound)).toBe(true);

    const serverError = await rejects(api.listCategories());
    expect(serverError).toMatchObject({ kind: 'http', status: 500, message: 'HTTP 500' }); // body was not JSON
    expect(isHttpClientError(serverError)).toBe(false);
  });

  it('rejects an answer that is not JSON, or has the wrong shape, as invalid', async () => {
    const api = (answer: Answer) => createApiClient(BASE, { fetchImpl: fakeFetch(answer).impl });
    expect((await rejects(api({ text: 'not json' }).listTransactions())).kind).toBe('invalid');
    expect((await rejects(api({ body: { data: { nope: 1 } } }).listTransactions())).kind).toBe('invalid');
    expect((await rejects(api({ body: { data: [{ ...transaction, amountMinor: -5 }] } }).listTransactions())).kind).toBe('invalid');
    expect((await rejects(api({ body: { data: [{ ...transaction, currency: 'GBP' }] } }).listTransactions())).kind).toBe('invalid');
    expect((await rejects(api({ body: [transaction] }).listTransactions())).kind).toBe('invalid'); // missing { data }
  });
});

describe('failures', () => {
  it('reports a network failure', async () => {
    const impl = jest.fn(async () => {
      throw new TypeError('Network request failed');
    }) as unknown as typeof fetch;
    const error = await rejects(createApiClient(BASE, { fetchImpl: impl }).listCategories());
    expect(error).toMatchObject({ kind: 'network', message: 'Network request failed' });
  });

  it('gives up when the server does not answer in time (timeout)', async () => {
    const impl = jest.fn((_url: string, init: RequestInit) =>
      new Promise((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(new Error('aborted')));
      }),
    ) as unknown as typeof fetch;
    const started = Date.now();
    const error = await rejects(createApiClient(BASE, { fetchImpl: impl, timeoutMs: 30 }).listCategories());
    expect(error.kind).toBe('timeout');
    expect(Date.now() - started).toBeLessThan(2000);
  });
});

describe('getApiClient', () => {
  const load = () => {
    let module!: typeof import('@/services/api');
    jest.isolateModules(() => {
      module = require('@/services/api');
    });
    return module;
  };
  const original = process.env.EXPO_PUBLIC_API_URL;
  afterEach(() => {
    if (original === undefined) delete process.env.EXPO_PUBLIC_API_URL;
    else process.env.EXPO_PUBLIC_API_URL = original;
  });

  it('is null when no server is configured (the app works offline)', () => {
    delete process.env.EXPO_PUBLIC_API_URL;
    expect(load().getApiClient()).toBeNull();
    process.env.EXPO_PUBLIC_API_URL = '   ';
    expect(load().getApiClient()).toBeNull();
  });

  it('builds a client from EXPO_PUBLIC_API_URL and reuses it', () => {
    process.env.EXPO_PUBLIC_API_URL = BASE;
    const module = load();
    const client = module.getApiClient();
    expect(client).not.toBeNull();
    expect(module.getApiClient()).toBe(client);
  });
});
