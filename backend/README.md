# Business Data Portal Backend

Local-first CRUD API for Accounts, Contacts, Subscriptions, and Cloud Files.

## Local development

```bash
cd backend
npm install
docker compose up -d
npm run dev
```

The API runs on `http://localhost:3000` with `DEV_AUTH_BYPASS=true` from `.env.local`.

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

`DEV_AUTH_BYPASS=true` is only accepted in `LOCAL` or `DEV`; the process fails fast if enabled in `PROD`.

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

List endpoints support `pageSize`, `nextToken`, `searchField`, `search`, `sortField`, `sortDirection`, generic filters like `status`, `type`, `active`, and date ranges like `createdAtFrom` and `createdAtTo`.

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
GET /accounts?searchField=name&search=Acme
GET /contacts?searchField=email&search=john@example.com
GET /subscriptions?searchField=plan&search=Enterprise
GET /cloud-files?searchField=uploadedBy&search=aashi@example.com
```

Valid `searchField` values:

| Entity | Valid searchField values |
|---|---|
| Accounts | `name`, `industry` |
| Contacts | `email`, `accountId` |
| Subscriptions | `accountId`, `plan` |
| Cloud Files | `fileName`, `uploadedBy` |

Unsupported `searchField` values return `400 Bad Request`.

## Sorting

Sorting only allows fields backed by configured DynamoDB sort indexes. Unsupported `sortField` values return `400 Bad Request`.

Examples:

```http
GET /accounts?sortField=createdAt&sortDirection=DESC
GET /contacts?sortField=createdAt&sortDirection=DESC
GET /subscriptions?sortField=renewalDate&sortDirection=ASC
GET /cloud-files?sortField=uploadDate&sortDirection=DESC
```

Valid `sortField` values:

| Entity | Valid sortField values | Default sortField |
|---|---|---|
| Accounts | `createdAt` | `createdAt` |
| Contacts | `createdAt` | `createdAt` |
| Subscriptions | `renewalDate` | `renewalDate` |
| Cloud Files | `uploadDate` | `uploadDate` |

## DynamoDB access pattern

The repository uses `QueryCommand`, not `ScanCommand`. Scans are intentionally prohibited due to DynamoDB cost considerations.

Required table keys and indexes:

| Entity | Table | Primary key | Required search GSIs | Required sort GSIs |
|---|---|---|---|---|
| Accounts | `Accounts` | `id` | `name-index` on `name`; `industry-index` on `industry` | `entity-createdAt-index` on `entityType`, `createdAt` |
| Contacts | `Contacts` | `id` | `email-index` on `email`; `accountId-index` on `accountId` | `entity-createdAt-index` on `entityType`, `createdAt` |
| Subscriptions | `Subscriptions` | `id` | `accountId-index` on `accountId`; `plan-index` on `plan` | `entity-renewalDate-index` on `entityType`, `renewalDate` |
| Cloud Files | `CloudFiles` | `id` | `fileName-index` on `fileName`; `uploadedBy-index` on `uploadedBy` | `entity-uploadDate-index` on `entityType`, `uploadDate` |

The `entityType` partition values used by sort indexes are `ACCOUNT`, `CONTACT`, `SUBSCRIPTION`, and `CLOUD_FILE`.

## Production deployment

```bash
cd backend
npm run build
sam build
sam deploy --guided
```

The SAM template deploys a single `crud-api` Lambda behind API Gateway HTTP API with Cognito JWT authorization and least-privilege DynamoDB permissions for the existing tables and their indexes.
