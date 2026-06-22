# Handoff

Date: 2026-06-21
Workspace: `D:\GitHub\dynamoUI`

## Current Git State

- Repository initialized locally.
- Current branch: `main`
- Latest commit: `cf85796 Initial Business Data Portal app`
- No remote is configured yet.
- Push is blocked until a remote URL is added and GitHub/auth credentials are valid.

Suggested push flow after remote/auth is ready:

```bash
git remote add origin <repo-url>
git push -u origin main
```

## Important Uncommitted Changes

At handoff time, the working tree has uncommitted changes in these frontend/root files:

- `package-lock.json`
- `package.json`
- `src/components/EntityModal.vue`
- `src/pages/Dashboard.vue`
- `src/pages/Login.vue`
- `src/router/index.ts`
- `src/services/api.ts`
- `src/services/authService.ts`
- `src/services/entityService.ts`
- `src/stores/authStore.ts`
- `src/stores/entityStore.ts`
- `src/types/index.ts`
- `tailwind.config.js`
- untracked `.env`

Review `.env` before committing. It may contain local configuration or secrets.

## Backend Implemented

Backend lives in `backend/`.

Implemented:

- Express local API server
- Single Lambda adapter
- AWS SAM template
- Cognito JWT validation
- Local development auth bypass guarded from production
- DynamoDB repository pattern
- CRUD routes for Accounts, Contacts, Subscriptions, and Cloud Files
- Cursor pagination with `nextToken`
- Exact-match indexed search via `searchField` and `search`
- Indexed sorting only
- Generic filtering and date ranges
- Centralized validation and error handling
- Unit tests for validators, services, and repositories

## Key Backend Commands

```bash
cd backend
npm install
npm run dev
npm test
npm run build
```

Run DynamoDB Local:

```bash
cd backend
docker compose up -d
```

## Verification Completed

Last successful checks:

```bash
cd backend
npm exec tsc -- -p tsconfig.json --noEmit
npm test
npm run build
```

Test result: 3 test files, 11 tests passed.

Runtime scan check:

```bash
rg -n "ScanCommand" backend/src
```

Result: runtime matches are expected in `backend/src/repositories/dynamoEntityRepository.ts` for server-side list/filter views.

## Backend Notes

- List responses include `success`, `data`, `nextToken`, and `pageSize`.
- Search requires exact-match GSI access:
  - Accounts: `companyName`, `accountNumber`, `website`
  - Contacts: `name`, `email`, `accountName`
  - Subscriptions: `customer`, `product`, `subscriptionId`
  - Cloud Files: `fileName`, `accountId`, `id`
- Server-side filters use the real schema fields:
  - Accounts: `status`, `companyName`, `createdDate`
  - Contacts: `status`, `accountName`, `createdDate`
  - Subscriptions: `status`, `customer`, `dateCreated`
  - Cloud Files: no status/company/date filters are configured.
- The repository uses `QueryCommand` for indexed exact-match search and `ScanCommand` with projection/filter expressions for list and filter views.

## Remaining Work

1. Decide whether to commit the current uncommitted frontend/root changes.
2. Add a Git remote.
3. Fix or refresh GitHub authentication if using `gh`.
4. Push `main`.
