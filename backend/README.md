# Business Data Portal Backend

Local-first CRUD API for Accounts, Contacts, Subscriptions, and Cloud Files.

## Local development

```bash
cd backend
npm install
docker compose up -d
npm run dev
```

The API runs on `http://localhost:3000` and requires a valid Cognito access token by default.

Use `VITE_API_URL=http://localhost:3000` in the Vue app.

## Environment strategy

Set `APP_ENV` to one of:

- `LOCAL`
- `DEV`
- `STAGING`
- `PROD`

Environment files are included as templates:

- `.env.local`
- `.env.dev`
- `.env.staging`
- `.env.prod`

For a local DynamoDB smoke test only, set `APP_ENV=LOCAL` and `SKIP_AUTH=true`. To reuse a specific env file without copying secrets, also set `ENV_FILE=.env.prod`. The backend refuses `SKIP_AUTH=true` outside `LOCAL`. The unauthenticated `/health` endpoint remains available for health checks.

## API routes

- `GET /accounts`
- `GET /accounts/:id`
- `POST /accounts`
- `PUT /accounts/:id`
- `DELETE /accounts/:id`
- `GET /contacts`
- `GET /contacts/:id`
- `POST /contacts`
- `PUT /contacts/:id`
- `DELETE /contacts/:id`
- `GET /subscriptions`
- `GET /subscriptions/:id`
- `POST /subscriptions`
- `PUT /subscriptions/:id`
- `DELETE /subscriptions/:id`
- `GET /cloud-files`
- `GET /cloud-files/:id`
- `POST /cloud-files`
- `PUT /cloud-files/:id`
- `DELETE /cloud-files/:id`

List endpoints support `pageSize`, `nextToken`, `searchField`, `search`, `sortField`, `sortDirection`, configured filters, and configured date ranges. Field names in API requests and responses are frontend-friendly names such as `companyName`, `createdDate`, `accountName`, `customer`, and `fileName`.

List responses include pagination metadata:

```json
{
  "success": true,
  "data": [],
  "nextToken": "",
  "pageSize": 25
}
```

No total record count is calculated, and no count query is performed.

## Search

Search uses exact-match DynamoDB GSI queries. It does not perform contains search, fuzzy search, or full-text search.

Examples:

```http
GET /accounts?searchField=companyName&search=Acme
GET /contacts?searchField=email&search=john@example.com
GET /subscriptions?searchField=product&search=Inventory%20Count
GET /cloud-files?searchField=accountId&search=0010I00001ecf4L
```

Valid `searchField` values:

| Entity | Valid searchField values |
|---|---|
| Accounts | `companyName`, `accountNumber`, `website` |
| Contacts | `name`, `email`, `accountName` |
| Subscriptions | `customer`, `product`, `subscriptionId` |
| Cloud Files | `fileName`, `accountId`, `id` |

Unsupported `searchField` values return `400 Bad Request`.

## Sorting

Sorting only allows fields backed by configured DynamoDB sort indexes. Unsupported `sortField` values return `400 Bad Request`.

Examples:

```http
GET /accounts?sortField=createdDate&sortDirection=DESC
GET /contacts?sortField=createdDate&sortDirection=DESC
GET /subscriptions?sortField=dateCreated&sortDirection=DESC
```

Valid `sortField` values:

| Entity | Valid sortField values | Default sortField |
|---|---|---|
| Accounts | `createdDate` | `createdDate` |
| Contacts | `createdDate` | `createdDate` |
| Subscriptions | `dateCreated` | `dateCreated` |
| Cloud Files | none | none |

## DynamoDB access pattern

The repository uses `QueryCommand` for indexed exact-match searches. List and filter views use server-side DynamoDB `ScanCommand` with projection and filter expressions because the provided real records do not include a shared synthetic partition key such as `entityType`.

Required table keys and indexes:

| Entity | Table | Primary key | Required search GSIs |
|---|---|---|---|
| Accounts | `Accounts` | `id` | `name-index` on `name`; `accountnumber-index` on `accountnumber`; `website-index` on `website` |
| Contacts | `Contacts` | `id` | `name-index` on `name`; `email-index` on `email`; `account-name-index` on `account.Name` |
| Subscriptions | `Subscriptions` | `﻿Subscription ID` | `customer-index` on `Customer`; `product-index` on `Product`; `subscription-id-index` on `﻿Subscription ID` |
| Cloud Files | `CloudFiles` | `id` | `name-index` on `name`; `account-index` on `tva_cfb__account__c`; `id-index` on `id` |

## Production deployment

```bash
cd backend
npm run build
sam build
sam deploy --guided
```

The SAM template deploys a single `crud-api` Lambda behind API Gateway HTTP API with Cognito JWT authorization and least-privilege DynamoDB permissions for the existing tables and their indexes.
