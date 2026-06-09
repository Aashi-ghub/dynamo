export interface ValidationIssue {
  field: string;
  message: string;
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly errors: ValidationIssue[] = []
  ) {
    super(message);
  }
}

export const badRequest = (message: string, errors: ValidationIssue[] = []) => new AppError(400, message, errors);
export const unauthorized = (message = 'Unauthorized') => new AppError(401, message);
export const forbidden = (message = 'Forbidden') => new AppError(403, message);
export const notFound = (message = 'Record not found') => new AppError(404, message);
export const conflict = (message = 'Record conflict') => new AppError(409, message);
