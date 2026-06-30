import { env } from './env.js';
import type { EntityName } from '../types/api.js';

export interface EntityConfig {
  name: EntityName;
  route: string;
  tableName: string;
  idField: string;
  sortKeyField?: string;
  sortKeyType?: 'string' | 'boolean' | 'number';
  fieldMap: Record<string, string>;
  requiredFields: string[];
  editableFields: string[];
  readonlyFields: string[];
  searchableFields: Record<string, string>;
  filterableFields: string[];
  sortableFields: Record<string, string>;
  defaultSortField?: string;
  listAttributes: string[];
  detailAttributes: string[];
  searchIndexes: Record<string, { indexName: string; partitionKey: string }>;
  softDeleteField?: string;
  softDeleteValue?: string | boolean | number;
}

const invert = (fieldMap: Record<string, string>) =>
  Object.fromEntries(Object.entries(fieldMap).map(([frontend, dynamo]) => [dynamo, frontend]));

const accountFieldMap = {
  id: 'id',
  createdById: 'createdbyid',
  accountNumber: 'accountnumber',
  active: 'active__c',
  billingCity: 'billingcity',
  billingState: 'billingstate',
  billingStreet: 'billingstreet',
  status: 'cleanstatus',
  createdBy: 'createdby.Name',
  createdDate: 'createddate',
  customerPriority: 'customerpriority__c',
  fax: 'fax',
  industry: 'industry',
  isDeleted: 'isdeleted',
  lastModifiedBy: 'lastmodifiedby.Name',
  lastModifiedById: 'lastmodifiedbyid',
  lastModifiedDate: 'lastmodifieddate',
  companyName: 'name',
  employees: 'numberofemployees',
  locations: 'numberoflocations__c',
  owner: 'owner.Name',
  ownerId: 'ownerid',
  ownership: 'ownership',
  phone: 'phone',
  photoUrl: 'photourl',
  shippingStreet: 'shippingstreet',
  sic: 'sic',
  slaExpirationDate: 'slaexpirationdate__c',
  slaSerialNumber: 'slaserialnumber__c',
  sla: 'sla__c',
  systemModstamp: 'systemmodstamp',
  tickerSymbol: 'tickersymbol',
  type: 'type',
  upsellOpportunity: 'upsellopportunity__c',
  userId: 'userid',
  website: 'website'
};

const contactFieldMap = {
  id: 'id',
  isDeleted: 'isdeleted',
  accountName: 'account.Name',
  accountId: 'accountid',
  birthdate: 'birthdate',
  status: 'cleanstatus',
  createdBy: 'createdby.Name',
  createdById: 'createdbyid',
  createdDate: 'createddate',
  department: 'department',
  doNotCall: 'donotcall',
  email: 'email',
  fax: 'fax',
  firstName: 'firstname',
  hasOptedOutOfEmail: 'hasoptedoutofemail',
  hasOptedOutOfFax: 'hasoptedoutoffax',
  isEmailBounced: 'isemailbounced',
  languages: 'languages__c',
  lastModifiedBy: 'lastmodifiedby.Name',
  lastModifiedById: 'lastmodifiedbyid',
  lastModifiedDate: 'lastmodifieddate',
  lastName: 'lastname',
  leadSource: 'leadsource',
  level: 'level__c',
  mailingStreet: 'mailingstreet',
  mobilePhone: 'mobilephone',
  name: 'name',
  owner: 'owner.Name',
  ownerId: 'ownerid',
  phone: 'phone',
  photoUrl: 'photourl',
  salutation: 'salutation',
  systemModstamp: 'systemmodstamp',
  title: 'title',
  userId: 'userid'
};

const subscriptionFieldMap = {
  clientNetSuiteAccountId: 'Client NetSuite Account ID',
  productCode: 'Product Code',
  billingFrequency: 'Billing Frequency',
  clientNotificationsSuiteletUrl: 'Client Notifications Suitelet URL',
  clientPointOfContact: 'Client Point of Contact',
  contractType: 'Contract Type',
  customer: 'Customer',
  dateCreated: 'Date Created',
  deactivateSubscription: 'Deactivate Subscription',
  endOfTrialPeriod: 'End of Trial Period',
  freeTrialSignupCompany: 'Free Trial sign-up company',
  freeTrialSignupEmailAddress: 'Free trial sign-up Email Address',
  freeTrialSignupName: 'Free trial sign-up name',
  freeTrialSignupPhone: 'Free trial sign-up Phone',
  inactive: 'Inactive',
  nextBillDate: 'Next Bill Date',
  numberOfUsers: 'Number of Users',
  price: 'Price',
  priceUsd: 'Price(USD)',
  product: 'Product',
  remarks: 'Remarks',
  status: 'Status',
  subscriptionEndDate: 'Subscription End Date',
  subscriptionInactive: 'Subscription Inactive',
  subscriptionStartDate: 'Subscription Start Date',
  subscriptionType: 'Subscription Type',
  transaction: 'Transaction',
  version: 'Version',
  subscriptionId: '\uFEFFSubscription ID'
};

const cloudFileFieldMap = {
  id: 'id',
  createdById: 'createdbyid',
  fileName: 'name',
  accountId: 'tva_cfb__account__c'
};

const accountEditable = [
  'companyName', 'accountNumber', 'active', 'status', 'type', 'industry', 'ownership', 'customerPriority',
  'phone', 'fax', 'website', 'billingStreet', 'billingCity', 'billingState', 'shippingStreet', 'employees',
  'locations', 'tickerSymbol', 'sic', 'sla', 'slaExpirationDate', 'slaSerialNumber', 'upsellOpportunity'
];

const contactEditable = [
  'salutation', 'firstName', 'lastName', 'title', 'department', 'birthdate', 'email', 'phone', 'mobilePhone',
  'fax', 'mailingStreet', 'doNotCall', 'hasOptedOutOfEmail', 'hasOptedOutOfFax', 'isEmailBounced',
  'leadSource', 'languages', 'level', 'status'
];

const subscriptionEditable = [
  'clientNetSuiteAccountId', 'productCode', 'billingFrequency', 'clientNotificationsSuiteletUrl',
  'clientPointOfContact', 'contractType', 'customer', 'deactivateSubscription', 'endOfTrialPeriod',
  'freeTrialSignupCompany', 'freeTrialSignupEmailAddress', 'freeTrialSignupName', 'freeTrialSignupPhone',
  'inactive', 'nextBillDate', 'numberOfUsers', 'price', 'priceUsd', 'product', 'remarks', 'status',
  'subscriptionEndDate', 'subscriptionInactive', 'subscriptionStartDate', 'subscriptionType', 'transaction', 'version'
];

export const entityConfigs: Record<EntityName, EntityConfig> = {
  accounts: {
    name: 'accounts',
    route: '/accounts',
    tableName: env.tables.accounts,
    idField: 'id',
    sortKeyField: 'createdById',
    fieldMap: accountFieldMap,
    requiredFields: ['companyName'],
    editableFields: accountEditable,
    readonlyFields: Object.keys(accountFieldMap).filter((field) => !accountEditable.includes(field)),
    searchableFields: { companyName: 'name-index', accountNumber: 'accountnumber-index', website: 'website-index' },
    filterableFields: ['status', 'companyName', 'createdDate'],
    sortableFields: { createdDate: 'createddate-index' },
    defaultSortField: 'createdDate',
    listAttributes: ['id', 'createdById', 'companyName', 'accountNumber', 'status', 'active', 'industry', 'type', 'owner', 'createdDate'],
    detailAttributes: Object.keys(accountFieldMap),
    searchIndexes: {
      companyName: { indexName: 'name-index', partitionKey: 'name' },
      accountNumber: { indexName: 'accountnumber-index', partitionKey: 'accountnumber' },
      website: { indexName: 'website-index', partitionKey: 'website' }
    },
    softDeleteField: 'active',
    softDeleteValue: 'No'
  },
  contacts: {
    name: 'contacts',
    route: '/contacts',
    tableName: env.tables.contacts,
    idField: 'id',
    sortKeyField: 'isDeleted',
    sortKeyType: 'number',
    fieldMap: contactFieldMap,
    requiredFields: ['lastName'],
    editableFields: contactEditable,
    readonlyFields: Object.keys(contactFieldMap).filter((field) => !contactEditable.includes(field)),
    searchableFields: { name: 'name-index', email: 'email-index', accountName: 'account-name-index' },
    filterableFields: ['status', 'accountName', 'createdDate'],
    sortableFields: { createdDate: 'createddate-index' },
    defaultSortField: 'createdDate',
    listAttributes: ['id', 'isDeleted', 'name', 'accountName', 'title', 'department', 'email', 'phone', 'status', 'createdDate'],
    detailAttributes: Object.keys(contactFieldMap),
    searchIndexes: {
      name: { indexName: 'name-index', partitionKey: 'name' },
      email: { indexName: 'email-index', partitionKey: 'email' },
      accountName: { indexName: 'account-name-index', partitionKey: 'account.Name' }
    }
  },
  subscriptions: {
    name: 'subscriptions',
    route: '/subscriptions',
    tableName: env.tables.subscriptions,
    idField: 'Client NetSuite Account ID',
    sortKeyField: 'productCode',
    fieldMap: subscriptionFieldMap,
    requiredFields: ['customer', 'product', 'status', 'productCode'],
    editableFields: subscriptionEditable,
    readonlyFields: ['subscriptionId', 'dateCreated'],
    searchableFields: { customer: 'customer-index', product: 'product-index', subscriptionId: 'subscription-id-index' },
    filterableFields: ['status', 'customer', 'dateCreated'],
    sortableFields: { dateCreated: 'date-created-index' },
    defaultSortField: 'dateCreated',
    listAttributes: ['subscriptionId', 'clientNetSuiteAccountId', 'productCode', 'customer', 'product', 'status', 'billingFrequency', 'price', 'nextBillDate', 'subscriptionEndDate'],
    detailAttributes: Object.keys(subscriptionFieldMap),
    searchIndexes: {
      customer: { indexName: 'customer-index', partitionKey: 'Customer' },
      product: { indexName: 'product-index', partitionKey: 'Product' },
      subscriptionId: { indexName: 'subscription-id-index', partitionKey: '\uFEFFSubscription ID' }
    },
    softDeleteField: 'appDeleted',
    softDeleteValue: true
  },
  cloudFiles: {
    name: 'cloudFiles',
    route: '/cloud-files',
    tableName: env.tables.cloudFiles,
    idField: 'id',
    sortKeyField: 'createdById',
    fieldMap: cloudFileFieldMap,
    requiredFields: ['fileName'],
    editableFields: ['fileName', 'accountId'],
    readonlyFields: ['id', 'createdById'],
    searchableFields: { fileName: 'name-index', accountId: 'account-index', id: 'id-index' },
    filterableFields: [],
    sortableFields: {},
    listAttributes: ['id', 'fileName', 'accountId', 'createdById'],
    detailAttributes: Object.keys(cloudFileFieldMap),
    searchIndexes: {
      fileName: { indexName: 'name-index', partitionKey: 'name' },
      accountId: { indexName: 'account-index', partitionKey: 'tva_cfb__account__c' },
      id: { indexName: 'id-index', partitionKey: 'id' }
    }
  }
};

export const dynamoToFrontend = (config: EntityConfig) => invert(config.fieldMap);
