export type DataErrorCode =
  | 'NOT_FOUND'
  | 'CATEGORY_NOT_FOUND'
  | 'CATEGORY_TYPE_MISMATCH'
  | 'DUPLICATE'
  | 'INVALID_MONTH';

/** A business-rule violation detected by the data layer (not a crash). */
export class DataError extends Error {
  constructor(
    public readonly code: DataErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = 'DataError';
  }
}
