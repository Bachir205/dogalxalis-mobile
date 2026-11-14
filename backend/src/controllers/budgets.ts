import type { RequestHandler } from 'express';

import type { JsonStore } from '../repositories/store';
import { budgetBody } from '../schemas';
import { createBudget, deleteBudget, getBudget, listBudgets, updateBudget } from '../services/budgets';

import { parseBody } from './parseBody';

export function budgetsController(store: JsonStore) {
  const list: RequestHandler = (_req, res) => {
    res.json({ data: listBudgets(store) });
  };
  const get: RequestHandler = (req, res) => {
    res.json({ data: getBudget(store, String(req.params.id)) });
  };
  const create: RequestHandler = async (req, res) => {
    const { item, created } = await createBudget(store, parseBody(budgetBody, req.body));
    res.status(created ? 201 : 200).json({ data: item });
  };
  const update: RequestHandler = async (req, res) => {
    const item = await updateBudget(store, String(req.params.id), parseBody(budgetBody, req.body));
    res.json({ data: item });
  };
  const remove: RequestHandler = async (req, res) => {
    await deleteBudget(store, String(req.params.id));
    res.status(204).end();
  };
  return { list, get, create, update, remove };
}
