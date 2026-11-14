import { Router } from 'express';

import { budgetsController } from '../controllers/budgets';
import type { JsonStore } from '../repositories/store';

export function budgetsRouter(store: JsonStore): Router {
  const controller = budgetsController(store);
  const router = Router();
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}
