import { Router } from 'express';

import { categoriesController } from '../controllers/categories';
import type { JsonStore } from '../repositories/store';

export function categoriesRouter(store: JsonStore): Router {
  const controller = categoriesController(store);
  const router = Router();
  router.get('/', controller.list);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  return router;
}
