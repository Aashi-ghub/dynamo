/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SKIP_AUTH: string;
  readonly VITE_API_URL: string;
  readonly VITE_COGNITO_AUTHORITY: string;
  readonly VITE_COGNITO_USER_POOL_ID: string;
  readonly VITE_COGNITO_REGION: string;
  readonly VITE_COGNITO_CLIENT_ID: string;
  readonly VITE_COGNITO_SCOPE: string;
  readonly VITE_COGNITO_DOMAIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
