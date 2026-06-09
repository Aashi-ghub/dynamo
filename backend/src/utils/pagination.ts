import { badRequest } from './errors.js';

export const encodeNextToken = (key?: Record<string, unknown>) => {
  if (!key || Object.keys(key).length === 0) return undefined;
  return Buffer.from(JSON.stringify(key), 'utf8').toString('base64url');
};

export const decodeNextToken = (token?: string) => {
  if (!token) return undefined;
  try {
    return JSON.parse(Buffer.from(token, 'base64url').toString('utf8')) as Record<string, unknown>;
  } catch {
    throw badRequest('Invalid nextToken', [{ field: 'nextToken', message: 'Token is malformed' }]);
  }
};
