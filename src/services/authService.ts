import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession } from 'aws-amplify/auth';
import type { User } from '../types';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'us-east-1_dummy',
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID || 'dummy',
    }
  }
});

export const authService = {
  async login(email: string, password: string): Promise<{token: string; user: User}> {
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
    await signOut();
  },

  async getSession(): Promise<{token: string; user: User} | null> {
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
