import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import type { User } from '../types';

const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';

if (!skipAuth) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
        userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      }
    }
  });
}

const localSession = {
  token: 'local-skip-auth',
  user: { id: 'local-dynamo-test', name: 'Local Dynamo Test', email: 'local-dynamo-test@example.local' }
};

export const authService = {
  async login(email: string, password: string): Promise<{token: string; user: User}> {
    if (skipAuth) return localSession;
    await signIn({ username: email, password });
    const user = await getCurrentUser();
    const session = await fetchAuthSession();
    const token = session.tokens?.accessToken?.toString() || '';
    return {
      token,
      user: { id: user.userId, name: user.username, email: email }
    };
  },

  async logout(): Promise<void> {
    if (skipAuth) return;
    await signOut();
  },

  async getSession(): Promise<{token: string; user: User} | null> {
    if (skipAuth) return localSession;
    try {
      const user = await getCurrentUser();
      const session = await fetchAuthSession();
      const token = session.tokens?.accessToken?.toString() || '';
      return {
        token,
        user: { id: user.userId, name: user.username, email: user.username }
      };
    } catch {
      return null;
    }
  }
};
