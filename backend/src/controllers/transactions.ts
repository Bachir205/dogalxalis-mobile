import type { RequestHandler } from 'express';

import type { JsonStore } from '../repositories/store';
import { transactionBody } from '../schemas';
import {
  createTransaction,
  deleteTransaction,
  getTransaction,
  listTransactions,
  updateTransaction,
} from '../services/transactions';

import { parseBody } from './parseBody';

export function transactionsController(store: JsonStore) {
  const list: RequestHandler = (_req, res) => {
    res.json({ data: listTransactions(store) });
  };
  const get: RequestHandler = (req, res) => {
    res.json({ data: getTransaction(store, String(req.params.id)) });
  };
  const create: RequestHandler = async (req, res) => {
    const { item, created } = await createTransaction(store, parseBody(transactionBody, req.body));
    res.status(created ? 201 : 200).json({ data: item });
  };
  const update: RequestHandler = async (req, res) => {
    const item = await updateTransaction(store, String(req.params.id), parseBody(transactionBody, req.body));
    res.json({ data: item });
  };
  const remove: RequestHandler = async (req, res) => {
    await deleteTransaction(store, String(req.params.id));
    res.status(204).end();
  };
  return { list, get, create, update, remove };
}
