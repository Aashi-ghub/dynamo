import { UserManager, WebStorageStateStore, type UserManagerSettings } from 'oidc-client-ts';

const skipAuth = import.meta.env.VITE_SKIP_AUTH === 'true';

function appOrigin(): string {
  return window.location.origin;
}

function cognitoAuthority(): string {
  if (import.meta.env.VITE_COGNITO_AUTHORITY) {
    return import.meta.env.VITE_COGNITO_AUTHORITY;
  }

  const poolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const region = import.meta.env.VITE_COGNITO_REGION || 'us-east-1';
  if (poolId) {
    return `https://cognito-idp.${region}.amazonaws.com/${poolId}`;
  }

  return '';
}

export const cognitoAuthConfig: UserManagerSettings = {
  authority: cognitoAuthority(),
  client_id: import.meta.env.VITE_COGNITO_CLIENT_ID,
  redirect_uri: appOrigin(),
  response_type: 'code',
  scope: import.meta.env.VITE_COGNITO_SCOPE || 'phone openid email',
  userStore: new WebStorageStateStore({ store: window.localStorage }),
};

export const userManager = skipAuth ? null : new UserManager(cognitoAuthConfig);

export function getCognitoLogoutUrl(): string | null {
  const domain = import.meta.env.VITE_COGNITO_DOMAIN;
  const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;

  if (!domain || !clientId) return null;

  return `${domain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(appOrigin())}`;
}
