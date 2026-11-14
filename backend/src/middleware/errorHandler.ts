import type { ErrorRequestHandler, RequestHandler } from 'express';

import { HttpError } from '../errors';

export const notFoundHandler: RequestHandler = (req, res) => {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `No route for ${req.method} ${req.path}` },
  });
};

/** One place that turns every failure into the same JSON shape: { error: { code, message, details? } }. */
export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({
      error: { code: error.code, message: error.message, ...(error.details ? { details: error.details } : {}) },
    });
    return;
  }
  const type = (error as { type?: string }).type;
  if (type === 'entity.parse.failed') {
    res.status(400).json({ error: { code: 'INVALID_JSON', message: 'The request body is not valid JSON' } });
    return;
  }
  if (type === 'entity.too.large') {
    res.status(413).json({ error: { code: 'PAYLOAD_TOO_LARGE', message: 'The request body is too large' } });
    return;
  }
  console.error('Unexpected error', error);
  res.status(500).json({ error: { code: 'INTERNAL', message: 'Unexpected server error' } });
};
