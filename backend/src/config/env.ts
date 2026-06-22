import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
if (process.env.ENV_FILE) {
  const localAppEnv = process.env.APP_ENV;
  const localSkipAuth = process.env.SKIP_AUTH;
  const localEnvFile = process.env.ENV_FILE;
  dotenv.config({ path: process.env.ENV_FILE, override: true });
  if (localAppEnv !== undefined) process.env.APP_ENV = localAppEnv;
  if (localSkipAuth !== undefined) process.env.SKIP_AUTH = localSkipAuth;
  if (localEnvFile !== undefined) process.env.ENV_FILE = localEnvFile;
}
const requestedEnv = process.env.APP_ENV?.toLowerCase() || 'local';
if (!process.env.ENV_FILE && requestedEnv !== 'local') {
  dotenv.config({ path: `.env.${requestedEnv}` });
}
dotenv.config();

export type AppEnv = 'LOCAL' | 'DEV' | 'STAGING' | 'PROD';
export type DeleteMode = 'hard' | 'soft';

const appEnv = (process.env.APP_ENV || 'LOCAL').toUpperCase() as AppEnv;
const skipAuth = process.env.SKIP_AUTH === 'true';

if (skipAuth && appEnv !== 'LOCAL') {
  throw new Error('SKIP_AUTH can only be enabled when APP_ENV=LOCAL');
}

export const env = {
  appEnv,
  isLocal: appEnv === 'LOCAL',
  skipAuth,
  port: Number(process.env.PORT || 3000),
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  dynamoDbEndpoint: process.env.DYNAMODB_ENDPOINT,
  cognitoUserPoolId: process.env.COGNITO_USER_POOL_ID || '',
  cognitoClientId: process.env.COGNITO_CLIENT_ID || '',
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  defaultPageSize: Number(process.env.DEFAULT_PAGE_SIZE || 25),
  maxPageSize: Number(process.env.MAX_PAGE_SIZE || 100),
  deleteMode: (process.env.DELETE_MODE || 'hard') as DeleteMode,
  tables: {
    accounts: process.env.ACCOUNTS_TABLE || 'Accounts',
    contacts: process.env.CONTACTS_TABLE || 'Contacts',
    subscriptions: process.env.SUBSCRIPTIONS_TABLE || 'Subscriptions',
    cloudFiles: process.env.CLOUD_FILES_TABLE || 'CloudFiles'
  }
};
