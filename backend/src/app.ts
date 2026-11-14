import express from 'express';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import type { JsonStore } from './repositories/store';
import { budgetsRouter } from './routes/budgets';
import { categoriesRouter } from './routes/categories';
import { transactionsRouter } from './routes/transactions';

export function createApp(store: JsonStore, options: { logRequests?: boolean } = {}) {
  const app = express();
  if (options.logRequests) app.use(requestLogger);
  app.use(express.json({ limit: '100kb' }));

  app.get('/health', (_req, res) => {
    res.json({ data: { status: 'ok' } });
  });
  app.use('/categories', categoriesRouter(store));
  app.use('/transactions', transactionsRouter(store));
  app.use('/budgets', budgetsRouter(store));

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
