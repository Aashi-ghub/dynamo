import type { EntityConfig } from '../types';

export const ENTITIES: Record<string, EntityConfig> = {
  accounts: {
    id: 'accounts',
    name: 'Account',
    plural: 'Accounts',
    apiPath: '/accounts',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Company Name' },
      { key: 'industry', label: 'Industry' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'createdAt', label: 'Created At', type: 'date' },
    ],
    fields: [
      { key: 'name', label: 'Company Name', type: 'text', required: true },
      { key: 'industry', label: 'Industry', type: 'text' },
      { 
        key: 'status', 
        label: 'Status', 
        type: 'select', 
        required: true,
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Inactive', value: 'Inactive' },
        ]
      },
    ]
  },
  contacts: {
    id: 'contacts',
    name: 'Contact',
    plural: 'Contacts',
    apiPath: '/contacts',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'email', label: 'Email' },
      { key: 'accountId', label: 'Account ID' },
    ],
    fields: [
      { key: 'firstName', label: 'First Name', type: 'text', required: true },
      { key: 'lastName', label: 'Last Name', type: 'text', required: true },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'accountId', label: 'Account ID', type: 'text', required: true },
    ]
  },
  subscriptions: {
    id: 'subscriptions',
    name: 'Subscription',
    plural: 'Subscriptions',
    apiPath: '/subscriptions',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'accountId', label: 'Account ID' },
      { key: 'plan', label: 'Plan' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'renewalDate', label: 'Renewal Date', type: 'date' },
    ],
    fields: [
      { key: 'accountId', label: 'Account ID', type: 'text', required: true },
      { key: 'plan', label: 'Plan', type: 'text', required: true },
      { 
        key: 'status', 
        label: 'Status', 
        type: 'select', 
        required: true,
        options: [
          { label: 'Active', value: 'Active' },
          { label: 'Canceled', value: 'Canceled' },
          { label: 'Past Due', value: 'Past Due' },
        ]
      },
      { key: 'renewalDate', label: 'Renewal Date', type: 'date' },
    ]
  },
  cloudFiles: {
    id: 'cloudFiles',
    name: 'Cloud File',
    plural: 'Cloud Files',
    apiPath: '/cloud-files',
    columns: [
      { key: 'id', label: 'ID' },
      { key: 'fileName', label: 'File Name' },
      { key: 'fileSize', label: 'Size (KB)', type: 'number' },
      { key: 'uploadedBy', label: 'Uploaded By' },
      { key: 'uploadDate', label: 'Upload Date', type: 'date' },
    ],
    fields: [
      { key: 'fileName', label: 'File Name', type: 'text', required: true },
      { key: 'fileSize', label: 'Size (KB)', type: 'number', required: true },
      { key: 'uploadedBy', label: 'Uploaded By', type: 'text', required: true },
    ]
  }
};
