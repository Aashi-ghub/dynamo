import type { RequestHandler } from 'express';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { env } from '../config/env.js';
import type { ApiRequest, AuthUser } from '../types/api.js';
import { unauthorized } from '../utils/errors.js';

const verifier =
  env.cognitoUserPoolId && env.cognitoClientId
    ? CognitoJwtVerifier.create({
        userPoolId: env.cognitoUserPoolId,
        tokenUse: 'access',
        clientId: env.cognitoClientId
      })
    : undefined;

export const authenticate: RequestHandler = async (req, _res, next) => {
  const apiReq = req as ApiRequest;
  try {
    if (env.skipAuth) {
      apiReq.context.user = {
        sub: 'local-dynamo-test',
        email: 'local-dynamo-test@example.local',
        username: 'local-dynamo-test',
        groups: []
      };
      return next();
    }

    if (!verifier) {
      throw unauthorized('Cognito verifier is not configured');
    }

    const authHeader = req.header('authorization') || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (!token) {
      throw unauthorized();
    }

    const payload = await verifier.verify(token);
    const groups = Array.isArray(payload['cognito:groups']) ? payload['cognito:groups'] : [];
    apiReq.context.user = {
      sub: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      username: typeof payload.username === 'string' ? payload.username : undefined,
      groups: groups.filter((group): group is string => typeof group === 'string')
    } satisfies AuthUser;
    next();
  } catch (error) {
    next(error instanceof Error && 'statusCode' in error ? error : unauthorized());
  }
};
