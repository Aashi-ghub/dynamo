import dotenv from 'dotenv';

const requestedEnv = process.env.APP_ENV?.toLowerCase() || 'local';
dotenv.config({ path: `.env.${requestedEnv}` });
dotenv.config();

export type AppEnv = 'LOCAL' | 'DEV' | 'STAGING' | 'PROD';
export type DeleteMode = 'hard' | 'soft';

const appEnv = (process.env.APP_ENV || 'LOCAL').toUpperCase() as AppEnv;
const devAuthBypass = process.env.DEV_AUTH_BYPASS === 'true';

if (appEnv === 'PROD' && devAuthBypass) {
  throw new Error('DEV_AUTH_BYPASS cannot be enabled in PROD');
}

export const env = {
  appEnv,
  isLocal: appEnv === 'LOCAL',
  port: Number(process.env.PORT || 3000),
  awsRegion: process.env.AWS_REGION || 'us-east-1',
  dynamoDbEndpoint: process.env.DYNAMODB_ENDPOINT,
  devAuthBypass,
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
