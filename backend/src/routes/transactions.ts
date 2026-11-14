import { Router } from 'express';

import { transactionsController } from '../controllers/transactions';
import type { JsonStore } from '../repositories/store';

export function transactionsRouter(store: JsonStore): Router {
  const controller = transactionsController(store);
  const router = Router();
  router.get('/', controller.list);
  router.get('/:id', controller.get);
  router.post('/', controller.create);
  router.put('/:id', controller.update);
  router.delete('/:id', controller.remove);
  return router;
}
