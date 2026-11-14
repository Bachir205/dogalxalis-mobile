import type { Budget, Category, Transaction } from '@/types';
import type { ApiBudget, ApiCategory, ApiTransaction } from '@/validation/apiSchemas';

/** The body sent to the server: the record without the local-only syncStatus field. */
export function toApiCategory(category: Category): ApiCategory {
  return {
    id: category.id,
    name: category.name,
    type: category.type,
    icon: category.icon,
    color: category.color,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  };
}

export function toApiTransaction(transaction: Transaction): ApiTransaction {
  return {
    id: transaction.id,
    title: transaction.title,
    amountMinor: transaction.amountMinor,
    currency: transaction.currency,
    type: transaction.type,
    categoryId: transaction.categoryId,
    description: transaction.description,
    date: transaction.date,
    createdAt: transaction.createdAt,
    updatedAt: transaction.updatedAt,
  };
}

export function toApiBudget(budget: Budget): ApiBudget {
  return {
    id: budget.id,
    categoryId: budget.categoryId,
    amountMinor: budget.amountMinor,
    currency: budget.currency,
    month: budget.month,
    createdAt: budget.createdAt,
    updatedAt: budget.updatedAt,
  };
}
