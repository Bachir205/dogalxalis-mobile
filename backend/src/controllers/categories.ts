import type { RequestHandler } from 'express';

import type { JsonStore } from '../repositories/store';
import { categoryBody } from '../schemas';
import { createCategory, listCategories, updateCategory } from '../services/categories';

import { parseBody } from './parseBody';

export function categoriesController(store: JsonStore) {
  const list: RequestHandler = (_req, res) => {
    res.json({ data: listCategories(store) });
  };
  const create: RequestHandler = async (req, res) => {
    const { item, created } = await createCategory(store, parseBody(categoryBody, req.body));
    res.status(created ? 201 : 200).json({ data: item });
  };
  const update: RequestHandler = async (req, res) => {
    const item = await updateCategory(store, String(req.params.id), parseBody(categoryBody, req.body));
    res.json({ data: item });
  };
  return { list, create, update };
}
