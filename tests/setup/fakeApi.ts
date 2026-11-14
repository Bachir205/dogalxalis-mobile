import { DEFAULT_CATEGORIES } from '@/constants/defaultCategories';
import { ApiError, type ApiClient } from '@/services/api';
import type { ApiBudget, ApiCategory, ApiTransaction } from '@/validation/apiSchemas';

const notFound = () => new ApiError('http', 'Not found', 404, 'NOT_FOUND');
const refused = (status: number, code: string) => new ApiError('http', code, status, code);

/**
 * An in-memory server that follows the same contract as the real API (same status codes and
 * rules), with switches to simulate problems: offline, a server error, refused ids, an
 * unreadable answer, and a hook that runs in the middle of a request.
 */
export class FakeApi implements ApiClient {
  categories = new Map<string, ApiCategory>();
  transactions = new Map<string, ApiTransaction>();
  budgets = new Map<string, ApiBudget>();

  /** One entry per request, e.g. "PUT transactions/tx-1". */
  calls: string[] = [];
  offline = false;
  serverError = false;
  invalidAnswer = false;
  /** Requests about these ids are refused with 400. */
  rejectIds = new Set<string>();
  /** Every write (POST, PUT, DELETE) is refused with 400. */
  rejectAllWrites = false;
  /** Runs while a request is "in flight" (used to edit a record during a push). */
  duringRequest: ((call: string) => Promise<void>) | null = null;

  constructor() {
    const now = '2026-11-01T00:00:00.000Z';
    for (const c of DEFAULT_CATEGORIES) {
      this.categories.set(c.id, {
        id: c.id, name: c.name, type: c.type, icon: c.icon, color: c.color, createdAt: now, updatedAt: now,
      });
    }
  }

  private async enter(call: string, id?: string) {
    this.calls.push(call);
    if (this.offline) throw new ApiError('network', 'Network request failed');
    if (this.serverError) throw new ApiError('http', 'Server error', 500, 'INTERNAL');
    if (this.duringRequest) await this.duringRequest(call);
    if (id && this.rejectIds.has(id)) throw refused(400, 'VALIDATION_ERROR');
    if (this.rejectAllWrites && !call.startsWith('GET')) throw refused(400, 'VALIDATION_ERROR');
  }

  private answer<T>(value: T): T {
    if (this.invalidAnswer) throw new ApiError('invalid', 'The server sent an unexpected response', 200);
    return value;
  }

  async listCategories() { await this.enter('GET categories'); return this.answer([...this.categories.values()]); }

  async createCategory(body: ApiCategory) {
    await this.enter('POST categories', body.id);
    const existing = this.categories.get(body.id);
    if (existing) return existing;
    const nameTaken = [...this.categories.values()].some((c) => c.type === body.type && c.name.toLowerCase() === body.name.toLowerCase());
    if (nameTaken) throw refused(409, 'DUPLICATE');
    this.categories.set(body.id, body);
    return this.answer(body);
  }

  async updateCategory(id: string, body: ApiCategory) {
    await this.enter(`PUT categories/${id}`, id);
    if (!this.categories.has(id)) throw notFound();
    this.categories.set(id, body);
    return this.answer(body);
  }

  private checkCategory(categoryId: string, type: string) {
    const category = this.categories.get(categoryId);
    if (!category) throw refused(400, 'CATEGORY_NOT_FOUND');
    if (category.type !== type) throw refused(400, 'CATEGORY_TYPE_MISMATCH');
  }

  async listTransactions() { await this.enter('GET transactions'); return this.answer([...this.transactions.values()]); }

  async createTransaction(body: ApiTransaction) {
    await this.enter('POST transactions', body.id);
    const existing = this.transactions.get(body.id);
    if (existing) return existing;
    this.checkCategory(body.categoryId, body.type);
    this.transactions.set(body.id, body);
    return this.answer(body);
  }

  async updateTransaction(id: string, body: ApiTransaction) {
    await this.enter(`PUT transactions/${id}`, id);
    if (!this.transactions.has(id)) throw notFound();
    this.checkCategory(body.categoryId, body.type);
    this.transactions.set(id, body);
    return this.answer(body);
  }

  async deleteTransaction(id: string) {
    await this.enter(`DELETE transactions/${id}`, id);
    if (!this.transactions.delete(id)) throw notFound();
  }

  async listBudgets() { await this.enter('GET budgets'); return this.answer([...this.budgets.values()]); }

  async createBudget(body: ApiBudget) {
    await this.enter('POST budgets', body.id);
    const existing = this.budgets.get(body.id);
    if (existing) return existing;
    this.checkCategory(body.categoryId, 'expense');
    this.budgets.set(body.id, body);
    return this.answer(body);
  }

  async updateBudget(id: string, body: ApiBudget) {
    await this.enter(`PUT budgets/${id}`, id);
    if (!this.budgets.has(id)) throw notFound();
    this.budgets.set(id, body);
    return this.answer(body);
  }

  async deleteBudget(id: string) {
    await this.enter(`DELETE budgets/${id}`, id);
    if (!this.budgets.delete(id)) throw notFound();
  }
}
