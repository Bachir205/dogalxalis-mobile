import { DEFAULT_CATEGORIES } from '@/constants/defaultCategories';
import type { Category } from '@/types';
import { getCategoryName } from '@/utils/categories';
import { isValidDate, shiftDate } from '@/utils/date';
import { translate } from '@/i18n';
import { createCategorySchema } from '@/validation/categorySchema';
import {
  buildTransactionInput,
  createTransactionSchema,
  type TransactionFormValues,
} from '@/validation/transactionSchema';

const categories: Category[] = DEFAULT_CATEGORIES.map((c) => ({
  id: c.id,
  name: c.name,
  type: c.type,
  icon: c.icon,
  color: c.color,
  createdAt: 'n',
  updatedAt: 'n',
  syncStatus: 'synced',
}));

const valid: TransactionFormValues = {
  type: 'expense',
  title: 'Lunch',
  amount: '2500',
  categoryId: 'cat_food',
  date: '2026-11-10',
  description: '',
};

const messagesFor = (schema: ReturnType<typeof createTransactionSchema>, values: TransactionFormValues) => {
  const result = schema.safeParse(values);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
};

describe('dates', () => {
  it('validates real calendar dates only', () => {
    expect(isValidDate('2026-11-10')).toBe(true);
    expect(isValidDate('2024-02-29')).toBe(true);
    expect(isValidDate('2026-02-29')).toBe(false);
    expect(isValidDate('2026-02-30')).toBe(false);
    expect(isValidDate('2026-13-01')).toBe(false);
    expect(isValidDate('2026-00-10')).toBe(false);
    expect(isValidDate('2026-1-5')).toBe(false);
    expect(isValidDate('10/11/2026')).toBe(false);
    expect(isValidDate('')).toBe(false);
  });

  it('shifts dates across month and year boundaries', () => {
    expect(shiftDate('2026-11-10', -1)).toBe('2026-11-09');
    expect(shiftDate('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDate('2026-01-01', -1)).toBe('2025-12-31');
    expect(shiftDate('2026-12-31', 1)).toBe('2027-01-01');
  });
});

describe('transaction schema', () => {
  const schema = createTransactionSchema('XOF', categories);

  it('accepts a valid transaction', () => {
    expect(schema.safeParse(valid).success).toBe(true);
  });

  it('requires a title (and trims it) and limits its length', () => {
    expect(messagesFor(schema, { ...valid, title: '   ' })).toEqual(['validation.titleRequired']);
    expect(messagesFor(schema, { ...valid, title: 'x'.repeat(61) })).toEqual(['validation.titleTooLong']);
    expect(schema.safeParse({ ...valid, title: 'x'.repeat(60) }).success).toBe(true);
  });

  it('validates the amount for the active currency', () => {
    expect(messagesFor(schema, { ...valid, amount: '' })).toEqual(['validation.amountRequired']);
    expect(messagesFor(schema, { ...valid, amount: 'abc' })).toEqual(['validation.amountInvalid']);
    expect(messagesFor(schema, { ...valid, amount: '0' })).toEqual(['validation.amountNotPositive']);
    expect(messagesFor(schema, { ...valid, amount: '10.5' })).toEqual(['validation.amountTooManyDecimals']);
    expect(messagesFor(schema, { ...valid, amount: '-5' })).toEqual(['validation.amountInvalid']);
    expect(createTransactionSchema('EUR', categories).safeParse({ ...valid, amount: '10.5' }).success).toBe(true);
  });

  it('requires an existing category of the same type as the transaction', () => {
    expect(messagesFor(schema, { ...valid, categoryId: '' })).toEqual(['validation.categoryRequired']);
    expect(messagesFor(schema, { ...valid, categoryId: 'nope' })).toEqual(['validation.categoryNotFound']);
    expect(messagesFor(schema, { ...valid, categoryId: 'cat_salary' })).toEqual([
      'validation.categoryTypeMismatch',
    ]);
    expect(
      schema.safeParse({ ...valid, type: 'income', categoryId: 'cat_salary' }).success,
    ).toBe(true);
    expect(messagesFor(schema, { ...valid, type: 'income' })).toEqual(['validation.categoryTypeMismatch']);
  });

  it('requires a real date and limits the description', () => {
    expect(messagesFor(schema, { ...valid, date: '2026-02-30' })).toEqual(['validation.dateInvalid']);
    expect(messagesFor(schema, { ...valid, description: 'x'.repeat(201) })).toEqual([
      'validation.descriptionTooLong',
    ]);
  });

  it('reports several problems at once', () => {
    expect(messagesFor(schema, { ...valid, title: '', amount: '' }).sort()).toEqual([
      'validation.amountRequired',
      'validation.titleRequired',
    ]);
  });

  it('every error message is a translation key that exists in both languages', () => {
    const bad = schema.safeParse({ type: 'expense', title: '', amount: 'x', categoryId: '', date: 'x', description: 'x'.repeat(300) });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      for (const issue of bad.error.issues) {
        expect(translate('en', issue.message as never)).not.toBe(issue.message);
        expect(translate('fr', issue.message as never)).not.toBe(issue.message);
      }
    }
  });
});

describe('buildTransactionInput', () => {
  it('converts validated values into record fields', () => {
    expect(
      buildTransactionInput({ ...valid, title: '  Lunch  ', amount: '2 500', description: '  with Awa ' }, 'XOF'),
    ).toEqual({
      title: 'Lunch',
      amountMinor: 2500,
      currency: 'XOF',
      type: 'expense',
      categoryId: 'cat_food',
      description: 'with Awa',
      date: '2026-11-10',
    });
  });

  it('stores an empty description as null and converts decimals to cents', () => {
    const input = buildTransactionInput({ ...valid, amount: '12,5', description: '   ' }, 'EUR');
    expect(input.description).toBeNull();
    expect(input.amountMinor).toBe(1250);
  });

  it('refuses an invalid amount', () => {
    expect(() => buildTransactionInput({ ...valid, amount: 'x' }, 'XOF')).toThrow();
  });
});

describe('category schema', () => {
  const base = { name: 'Gifts', type: 'expense' as const, icon: 'gift', color: '#E67E22' };

  it('accepts a valid category', () => {
    expect(createCategorySchema(categories).safeParse(base).success).toBe(true);
  });

  it('checks name, icon and color', () => {
    const schema = createCategorySchema(categories);
    const messages = (values: object) => {
      const r = schema.safeParse(values);
      return r.success ? [] : r.error.issues.map((i) => i.message);
    };
    expect(messages({ ...base, name: '  ' })).toEqual(['validation.nameRequired']);
    expect(messages({ ...base, name: 'x'.repeat(31) })).toEqual(['validation.nameTooLong']);
    expect(messages({ ...base, icon: 'rocket' })).toEqual(['validation.iconInvalid']);
    expect(messages({ ...base, color: '#123456' })).toEqual(['validation.colorInvalid']);
  });

  it('refuses a duplicate name for the same type, ignoring case, but allows it for the other type', () => {
    const schema = createCategorySchema(categories);
    const result = schema.safeParse({ ...base, name: ' food ' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues[0].message).toBe('validation.nameDuplicate');
    expect(schema.safeParse({ ...base, name: 'Salary', type: 'expense' }).success).toBe(true);
  });

  it('does not clash with the category being edited', () => {
    expect(createCategorySchema(categories, 'cat_food').safeParse({ ...base, name: 'food' }).success).toBe(true);
  });
});

describe('getCategoryName', () => {
  const t = (key: Parameters<typeof translate>[1]) => translate('fr', key);
  const food = categories.find((c) => c.id === 'cat_food');

  it('translates the seeded names', () => {
    expect(getCategoryName(food, t)).toBe('Alimentation');
  });

  it('shows a renamed or custom category as typed', () => {
    expect(getCategoryName({ ...(food as Category), name: 'Groceries' }, t)).toBe('Groceries');
    expect(getCategoryName({ ...(food as Category), id: 'custom-1', name: 'Gifts' }, t)).toBe('Gifts');
  });

  it('handles a missing category', () => {
    expect(getCategoryName(undefined, t)).toBe('—');
  });
});

describe('budget schema', () => {
  // imported lazily to keep the import list at the top of this file unchanged
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { createBudgetSchema, buildBudgetInput } = require('@/validation/budgetSchema');

  const existing = [
    {
      id: 'b1',
      categoryId: 'cat_food',
      amountMinor: 10000,
      currency: 'XOF',
      month: '2026-11',
      createdAt: 'n',
      updatedAt: 'n',
      syncStatus: 'synced',
    },
  ];
  const valid = { categoryId: 'cat_transport', amount: '5000', month: '2026-11' };
  const schema = createBudgetSchema({ currency: 'XOF', categories, budgets: existing });
  const messages = (values: object, s = schema) => {
    const result = s.safeParse(values);
    return result.success ? [] : result.error.issues.map((issue: { message: string }) => issue.message);
  };

  it('accepts a valid budget', () => {
    expect(messages(valid)).toEqual([]);
  });

  it('requires a limit greater than zero, in the right format for the currency', () => {
    expect(messages({ ...valid, amount: '' })).toEqual(['validation.amountRequired']);
    expect(messages({ ...valid, amount: '0' })).toEqual(['validation.amountNotPositive']);
    expect(messages({ ...valid, amount: '-5' })).toEqual(['validation.amountInvalid']);
    expect(messages({ ...valid, amount: '10.5' })).toEqual(['validation.amountTooManyDecimals']);
  });

  it('requires an existing category, and it must be an expense category', () => {
    expect(messages({ ...valid, categoryId: '' })).toEqual(['validation.categoryRequired']);
    expect(messages({ ...valid, categoryId: 'nope' })).toEqual(['validation.categoryNotFound']);
    expect(messages({ ...valid, categoryId: 'cat_salary' })).toEqual(['validation.budgetCategoryNotExpense']);
  });

  it('requires a valid month', () => {
    expect(messages({ ...valid, month: '2026-13' })).toEqual(['validation.monthInvalid']);
    expect(messages({ ...valid, month: 'nov' })).toEqual(['validation.monthInvalid']);
  });

  it('refuses a second budget for the same category, month and currency', () => {
    expect(messages({ ...valid, categoryId: 'cat_food' })).toEqual(['validation.budgetDuplicate']);
    expect(messages({ ...valid, categoryId: 'cat_food', month: '2026-12' })).toEqual([]);
    const euro = createBudgetSchema({ currency: 'EUR', categories, budgets: existing });
    expect(messages({ ...valid, categoryId: 'cat_food', amount: '10.50' }, euro)).toEqual([]);
  });

  it('lets a budget keep its own category and month while being edited', () => {
    const editing = createBudgetSchema({ currency: 'XOF', categories, budgets: existing, editingId: 'b1' });
    expect(messages({ ...valid, categoryId: 'cat_food' }, editing)).toEqual([]);
  });

  it('converts validated values into record fields', () => {
    expect(buildBudgetInput({ categoryId: 'cat_food', amount: '10 000', month: '2026-11' }, 'XOF')).toEqual({
      categoryId: 'cat_food',
      amountMinor: 10000,
      currency: 'XOF',
      month: '2026-11',
    });
    expect(() => buildBudgetInput({ categoryId: 'cat_food', amount: 'x', month: '2026-11' }, 'XOF')).toThrow();
  });
});
