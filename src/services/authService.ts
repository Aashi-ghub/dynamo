import type { User } from '../types';
import { getCognitoLogoutUrl, userManager } from '../config/cognitoAuth';

const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';

const localSession = {
  token: 'local-skip-auth',
  user: { id: 'local-dynamo-test', name: 'Local Dynamo Test', email: 'local-dynamo-test@example.local' }
};

function mapOidcUser(user: NonNullable<Awaited<ReturnType<NonNullable<typeof userManager>['getUser']>>>): { token: string; user: User } {
  return {
    token: user.access_token,
    user: {
      id: user.profile.sub || '',
      name: user.profile.name || user.profile.email || user.profile.preferred_username || '',
      email: user.profile.email || ''
    }
  };
}

export const authService = {
  async handleSignInCallback(): Promise<{ token: string; user: User } | null> {
    if (skipAuth || !userManager) return null;

    const params = new URLSearchParams(window.location.search);
    if (!params.has('code') || !params.has('state')) return null;

    const user = await userManager.signinRedirectCallback();
    window.history.replaceState({}, document.title, window.location.pathname);
    return mapOidcUser(user);
  },

  async signIn(): Promise<void> {
    if (skipAuth || !userManager) return;
    await userManager.signinRedirect();
  },

  async logout(): Promise<void> {
    if (skipAuth || !userManager) return;

    await userManager.removeUser();

    const logoutUrl = getCognitoLogoutUrl();
    if (logoutUrl) {
      window.location.href = logoutUrl;
    }
  },

  async getSession(): Promise<{ token: string; user: User } | null> {
    if (skipAuth) return localSession;
    if (!userManager) return null;

    try {
      const user = await userManager.getUser();
      if (!user || user.expired) return null;
      return mapOidcUser(user);
    } catch {
      return null;
    }
  }
};
