import { env } from './env.js';
import type { EntityName } from '../types/api.js';

export interface EntityConfig {
  name: EntityName;
  route: string;
  tableName: string;
  idField: string;
  searchableFields: Record<string, string>;
  filterableFields: string[];
  sortableFields: Record<string, string>;
  defaultSortField: string;
  listAttributes: string[];
  searchIndexes: Record<string, { indexName: string; partitionKey: string }>;
  sortIndexes: Record<string, { indexName: string; partitionKey: string; sortKey: string; partitionValue: string }>;
  softDeleteStatus?: string;
}

export const entityConfigs: Record<EntityName, EntityConfig> = {
  accounts: {
    name: 'accounts',
    route: '/accounts',
    tableName: env.tables.accounts,
    idField: 'id',
    searchableFields: {
      name: 'name-index',
      industry: 'industry-index'
    },
    filterableFields: ['status', 'type', 'active', 'createdAt'],
    sortableFields: {
      createdAt: 'entity-createdAt-index'
    },
    defaultSortField: 'createdAt',
    listAttributes: ['id', 'name', 'industry', 'status', 'type', 'active', 'createdAt', 'updatedAt'],
    searchIndexes: {
      name: { indexName: 'name-index', partitionKey: 'name' },
      industry: { indexName: 'industry-index', partitionKey: 'industry' }
    },
    sortIndexes: {
      createdAt: { indexName: 'entity-createdAt-index', partitionKey: 'entityType', sortKey: 'createdAt', partitionValue: 'ACCOUNT' }
    },
    softDeleteStatus: 'Inactive'
  },
  contacts: {
    name: 'contacts',
    route: '/contacts',
    tableName: env.tables.contacts,
    idField: 'id',
    searchableFields: {
      email: 'email-index',
      accountId: 'accountId-index'
    },
    filterableFields: ['status', 'type', 'active', 'createdAt', 'accountId'],
    sortableFields: {
      createdAt: 'entity-createdAt-index'
    },
    defaultSortField: 'createdAt',
    listAttributes: ['id', 'firstName', 'lastName', 'email', 'accountId', 'status', 'active', 'createdAt', 'updatedAt'],
    searchIndexes: {
      email: { indexName: 'email-index', partitionKey: 'email' },
      accountId: { indexName: 'accountId-index', partitionKey: 'accountId' }
    },
    sortIndexes: {
      createdAt: { indexName: 'entity-createdAt-index', partitionKey: 'entityType', sortKey: 'createdAt', partitionValue: 'CONTACT' }
    }
  },
  subscriptions: {
    name: 'subscriptions',
    route: '/subscriptions',
    tableName: env.tables.subscriptions,
    idField: 'id',
    searchableFields: {
      accountId: 'accountId-index',
      plan: 'plan-index'
    },
    filterableFields: ['status', 'type', 'active', 'createdAt', 'accountId'],
    sortableFields: {
      renewalDate: 'entity-renewalDate-index'
    },
    defaultSortField: 'renewalDate',
    listAttributes: ['id', 'accountId', 'plan', 'status', 'active', 'renewalDate', 'createdAt', 'updatedAt'],
    searchIndexes: {
      accountId: { indexName: 'accountId-index', partitionKey: 'accountId' },
      plan: { indexName: 'plan-index', partitionKey: 'plan' }
    },
    sortIndexes: {
      renewalDate: { indexName: 'entity-renewalDate-index', partitionKey: 'entityType', sortKey: 'renewalDate', partitionValue: 'SUBSCRIPTION' }
    },
    softDeleteStatus: 'Canceled'
  },
  cloudFiles: {
    name: 'cloudFiles',
    route: '/cloud-files',
    tableName: env.tables.cloudFiles,
    idField: 'id',
    searchableFields: {
      fileName: 'fileName-index',
      uploadedBy: 'uploadedBy-index'
    },
    filterableFields: ['status', 'type', 'active', 'createdAt', 'uploadedBy'],
    sortableFields: {
      uploadDate: 'entity-uploadDate-index'
    },
    defaultSortField: 'uploadDate',
    listAttributes: ['id', 'fileName', 'fileSize', 'uploadedBy', 'uploadDate', 'status', 'active', 'createdAt', 'updatedAt'],
    searchIndexes: {
      fileName: { indexName: 'fileName-index', partitionKey: 'fileName' },
      uploadedBy: { indexName: 'uploadedBy-index', partitionKey: 'uploadedBy' }
    },
    sortIndexes: {
      uploadDate: { indexName: 'entity-uploadDate-index', partitionKey: 'entityType', sortKey: 'uploadDate', partitionValue: 'CLOUD_FILE' }
    }
  }
};
