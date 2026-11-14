import type { ZodType } from 'zod';

import { HttpError } from '../errors';

/** Validates a request body; on failure answers 400 with the list of problems. */
export function parseBody<T>(schema: ZodType<T>, body: unknown): T {
  const result = schema.safeParse(body);
  if (result.success) return result.data;
  throw new HttpError(
    400,
    'VALIDATION_ERROR',
    'The request body is not valid',
    result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
  );
}
