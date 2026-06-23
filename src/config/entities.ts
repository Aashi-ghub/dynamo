import type { EntityConfig } from '../types';

export const ENTITIES: Record<string, EntityConfig> = {
  accounts: {
    id: 'accounts',
    name: 'Account',
    plural: 'Accounts',
    apiPath: '/accounts',
    titleField: 'companyName',
    partitionKeyField: 'id',
    sortKeyField: 'createdById',
    columns: [
      { key: 'companyName', label: 'Company Name' },
      { key: 'accountNumber', label: 'Account Number' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'active', label: 'Active' },
      { key: 'industry', label: 'Industry' },
      { key: 'type', label: 'Type' },
      { key: 'owner', label: 'Owner' },
      { key: 'createdDate', label: 'Created Date', type: 'date' }
    ],
    fields: [
      { key: 'companyName', label: 'Company Name', type: 'text', required: true },
      { key: 'accountNumber', label: 'Account Number', type: 'text' },
      { key: 'active', label: 'Active', type: 'select', options: [{ label: 'Yes', value: 'Yes' }, { label: 'No', value: 'No' }] },
      { key: 'status', label: 'Status', type: 'select', options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Canceled', value: 'Canceled' }
      ] },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'industry', label: 'Industry', type: 'text' },
      { key: 'ownership', label: 'Ownership', type: 'text' },
      { key: 'customerPriority', label: 'Customer Priority', type: 'text' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'fax', label: 'Fax', type: 'text' },
      { key: 'website', label: 'Website', type: 'text' },
      { key: 'billingStreet', label: 'Billing Street', type: 'textarea' },
      { key: 'billingCity', label: 'Billing City', type: 'text' },
      { key: 'billingState', label: 'Billing State', type: 'text' },
      { key: 'shippingStreet', label: 'Shipping Street', type: 'textarea' },
      { key: 'employees', label: 'Employees', type: 'number' },
      { key: 'locations', label: 'Locations', type: 'number' },
      { key: 'tickerSymbol', label: 'Ticker Symbol', type: 'text' },
      { key: 'sic', label: 'SIC', type: 'text' },
      { key: 'sla', label: 'SLA', type: 'text' },
      { key: 'slaExpirationDate', label: 'SLA Expiration Date', type: 'date' },
      { key: 'slaSerialNumber', label: 'SLA Serial Number', type: 'text' },
      { key: 'upsellOpportunity', label: 'Upsell Opportunity', type: 'text' }
    ],
    detailGroups: [
      { label: 'General Information', fields: ['companyName', 'accountNumber', 'active', 'status', 'type', 'industry', 'ownership', 'customerPriority'] },
      { label: 'Contact Information', fields: ['phone', 'fax', 'website'] },
      { label: 'Address Information', fields: ['billingStreet', 'billingCity', 'billingState', 'shippingStreet'] },
      { label: 'Business Information', fields: ['employees', 'locations', 'tickerSymbol', 'sic', 'sla', 'slaExpirationDate', 'slaSerialNumber', 'upsellOpportunity'] },
      { label: 'Ownership / Audit Information', fields: ['owner', 'createdBy', 'createdDate', 'lastModifiedBy', 'lastModifiedDate'] },
      { label: 'System Information', fields: ['id', 'createdById', 'lastModifiedById', 'ownerId', 'userId', 'isDeleted', 'photoUrl', 'systemModstamp'] }
    ],
    readonlyFields: ['id', 'createdById', 'createdBy', 'createdDate', 'lastModifiedById', 'lastModifiedBy', 'lastModifiedDate', 'ownerId', 'owner', 'userId', 'isDeleted', 'photoUrl', 'systemModstamp'],
    searchableFields: [
      { key: 'companyName', label: 'Company Name' },
      { key: 'accountNumber', label: 'Account Number' },
      { key: 'website', label: 'Website' }
    ],
    filters: { status: 'status', company: 'companyName', date: 'createdDate' },
    sortableFields: ['createdDate']
  },
  contacts: {
    id: 'contacts',
    name: 'Contact',
    plural: 'Contacts',
    apiPath: '/contacts',
    titleField: 'name',
    partitionKeyField: 'id',
    sortKeyField: 'isDeleted',
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'accountName', label: 'Account' },
      { key: 'title', label: 'Title' },
      { key: 'department', label: 'Department' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'createdDate', label: 'Created Date', type: 'date' }
    ],
    fields: [
      { key: 'salutation', label: 'Salutation', type: 'text' },
      { key: 'firstName', label: 'First Name', type: 'text' },
      { key: 'lastName', label: 'Last Name', type: 'text', required: true },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'department', label: 'Department', type: 'text' },
      { key: 'birthdate', label: 'Birthdate', type: 'date' },
      { key: 'email', label: 'Email', type: 'email' },
      { key: 'phone', label: 'Phone', type: 'text' },
      { key: 'mobilePhone', label: 'Mobile Phone', type: 'text' },
      { key: 'fax', label: 'Fax', type: 'text' },
      { key: 'mailingStreet', label: 'Mailing Street', type: 'textarea' },
      { key: 'doNotCall', label: 'Do Not Call', type: 'boolean' },
      { key: 'hasOptedOutOfEmail', label: 'Opted Out Of Email', type: 'boolean' },
      { key: 'hasOptedOutOfFax', label: 'Opted Out Of Fax', type: 'boolean' },
      { key: 'isEmailBounced', label: 'Email Bounced', type: 'boolean' },
      { key: 'leadSource', label: 'Lead Source', type: 'text' },
      { key: 'languages', label: 'Languages', type: 'text' },
      { key: 'level', label: 'Level', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: [
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
        { label: 'Pending', value: 'Pending' },
        { label: 'Canceled', value: 'Canceled' }
      ] }
    ],
    detailGroups: [
      { label: 'General Information', fields: ['salutation', 'firstName', 'lastName', 'name', 'title', 'department', 'birthdate'] },
      { label: 'Account Information', fields: ['accountName'] },
      { label: 'Contact Information', fields: ['email', 'phone', 'mobilePhone', 'fax', 'mailingStreet'] },
      { label: 'Preferences', fields: ['doNotCall', 'hasOptedOutOfEmail', 'hasOptedOutOfFax', 'isEmailBounced'] },
      { label: 'Business Information', fields: ['leadSource', 'languages', 'level', 'status'] },
      { label: 'Ownership / Audit Information', fields: ['owner', 'createdBy', 'createdDate', 'lastModifiedBy', 'lastModifiedDate'] },
      { label: 'System Information', fields: ['id', 'accountId', 'createdById', 'lastModifiedById', 'ownerId', 'userId', 'isDeleted', 'photoUrl', 'systemModstamp'] }
    ],
    readonlyFields: ['id', 'name', 'accountId', 'accountName', 'createdById', 'createdBy', 'createdDate', 'lastModifiedById', 'lastModifiedBy', 'lastModifiedDate', 'ownerId', 'owner', 'userId', 'isDeleted', 'photoUrl', 'systemModstamp'],
    searchableFields: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'accountName', label: 'Account' }
    ],
    filters: { status: 'status', company: 'accountName', date: 'createdDate' },
    sortableFields: ['createdDate']
  },
  subscriptions: {
    id: 'subscriptions',
    name: 'Subscription',
    plural: 'Subscriptions',
    apiPath: '/subscriptions',
    titleField: 'subscriptionId',
    partitionKeyField: 'clientNetSuiteAccountId',
    sortKeyField: 'productCode',
    columns: [
      { key: 'subscriptionId', label: 'Subscription ID' },
      { key: 'customer', label: 'Customer' },
      { key: 'product', label: 'Product' },
      { key: 'status', label: 'Status', type: 'status' },
      { key: 'billingFrequency', label: 'Billing Frequency' },
      { key: 'price', label: 'Price', type: 'number' },
      { key: 'nextBillDate', label: 'Next Bill Date', type: 'date' },
      { key: 'subscriptionEndDate', label: 'Subscription End Date', type: 'date' }
    ],
    fields: [
      { key: 'customer', label: 'Customer', type: 'text', required: true },
      { key: 'product', label: 'Product', type: 'text', required: true },
      { key: 'status', label: 'Status', type: 'select', required: true, options: [
        { label: 'Billing', value: 'Billing' },
        { label: 'Active', value: 'Active' },
        { label: 'Inactive', value: 'Inactive' },
        { label: 'Canceled', value: 'Canceled' },
        { label: 'Pending', value: 'Pending' }
      ] },
      { key: 'clientNetSuiteAccountId', label: 'Client NetSuite Account ID', type: 'text' },
      { key: 'productCode', label: 'Product Code', type: 'text' },
      { key: 'billingFrequency', label: 'Billing Frequency', type: 'text' },
      { key: 'clientNotificationsSuiteletUrl', label: 'Client Notifications Suitelet URL', type: 'text' },
      { key: 'clientPointOfContact', label: 'Client Point Of Contact', type: 'text' },
      { key: 'contractType', label: 'Contract Type', type: 'text' },
      { key: 'deactivateSubscription', label: 'Deactivate subscription', type: 'boolean' },
      { key: 'endOfTrialPeriod', label: 'End Of Trial Period', type: 'date' },
      { key: 'freeTrialSignupCompany', label: 'Free Trial Signup Company', type: 'text' },
      { key: 'freeTrialSignupEmailAddress', label: 'Free Trial Signup Email Address', type: 'email' },
      { key: 'freeTrialSignupName', label: 'Free Trial Signup Name', type: 'text' },
      { key: 'freeTrialSignupPhone', label: 'Free Trial Signup Phone', type: 'text' },
      { key: 'inactive', label: 'Inactive', type: 'boolean' },
      { key: 'nextBillDate', label: 'Next Bill Date', type: 'date' },
      { key: 'numberOfUsers', label: 'Number Of Users', type: 'number' },
      { key: 'price', label: 'Price', type: 'number' },
      { key: 'priceUsd', label: 'Price USD', type: 'number' },
      { key: 'remarks', label: 'Remarks', type: 'textarea' },
      { key: 'subscriptionEndDate', label: 'Subscription End Date', type: 'date' },
      { key: 'subscriptionInactive', label: 'Subscription Inactive', type: 'boolean' },
      { key: 'subscriptionStartDate', label: 'Subscription Start Date', type: 'date' },
      { key: 'subscriptionType', label: 'Subscription Type', type: 'text' },
      { key: 'transaction', label: 'Transaction', type: 'text' },
      { key: 'version', label: 'Version', type: 'text' }
    ],
    detailGroups: [
      { label: 'General Information', fields: ['subscriptionId', 'customer', 'clientNetSuiteAccountId', 'status', 'deactivateSubscription', 'subscriptionType', 'contractType'] },
      { label: 'Product Information', fields: ['product', 'productCode', 'version', 'numberOfUsers'] },
      { label: 'Billing Information', fields: ['billingFrequency', 'price', 'priceUsd', 'nextBillDate', 'transaction'] },
      { label: 'Subscription Dates', fields: ['dateCreated', 'subscriptionStartDate', 'subscriptionEndDate', 'endOfTrialPeriod'] },
      { label: 'Trial Signup Information', fields: ['freeTrialSignupCompany', 'freeTrialSignupEmailAddress', 'freeTrialSignupName', 'freeTrialSignupPhone'] },
      { label: 'Contact / Notification Information', fields: ['clientPointOfContact', 'clientNotificationsSuiteletUrl'] },
      { label: 'Notes', fields: ['remarks'] }
    ],
    readonlyFields: ['subscriptionId', 'dateCreated'],
    searchableFields: [
      { key: 'customer', label: 'Customer' },
      { key: 'product', label: 'Product' },
      { key: 'subscriptionId', label: 'Subscription ID' }
    ],
    filters: { status: 'status', company: 'customer', date: 'dateCreated' },
    sortableFields: ['dateCreated']
  },
  cloudFiles: {
    id: 'cloudFiles',
    name: 'Cloud File',
    plural: 'Cloud Files',
    apiPath: '/cloud-files',
    titleField: 'fileName',
    partitionKeyField: 'id',
    sortKeyField: 'createdById',
    columns: [
      { key: 'fileName', label: 'File Name' },
      { key: 'accountId', label: 'Account ID' },
      { key: 'createdById', label: 'Created By ID' },
      { key: 'id', label: 'File ID' }
    ],
    fields: [
      { key: 'fileName', label: 'File Name', type: 'text', required: true },
      { key: 'accountId', label: 'Account ID', type: 'text' }
    ],
    detailGroups: [
      { label: 'File Information', fields: ['fileName'] },
      { label: 'Related Account Information', fields: ['accountId'] },
      { label: 'Audit / System Information', fields: ['id', 'createdById'] }
    ],
    readonlyFields: ['id', 'createdById'],
    searchableFields: [
      { key: 'fileName', label: 'File Name' },
      { key: 'accountId', label: 'Account ID' },
      { key: 'id', label: 'File ID' }
    ],
    filters: {},
    sortableFields: []
  }
};
