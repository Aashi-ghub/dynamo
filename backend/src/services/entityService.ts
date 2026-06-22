import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { dynamoToFrontend, type EntityConfig } from '../config/entities.js';
import type { BusinessRecord } from '../models/businessRecord.js';
import type { DynamoEntityRepository } from '../repositories/dynamoEntityRepository.js';
import type { AuthUser, ListQuery } from '../types/api.js';
import { notFound } from '../utils/errors.js';

export class EntityService {
  constructor(
    private readonly repository: DynamoEntityRepository,
    private readonly config: EntityConfig
  ) {}

  list(query: ListQuery) {
    return this.repository.list(query).then((result) => ({
      ...result,
      items: result.items.map((item) => this.toFrontend(item))
    }));
  }

  async get(id: string, sortKey?: string | boolean | number) {
    const record = await this.repository.getById(id, sortKey);
    if (!record) throw notFound();
    return this.toFrontend(record);
  }

  async create(input: Record<string, unknown>, user?: AuthUser) {
    const now = Date.now();
    const rawInput = this.toDynamo(input);
    const id = typeof rawInput[this.config.idField] === 'string' && String(rawInput[this.config.idField]).trim()
      ? rawInput[this.config.idField]
      : randomUUID();
    const record: BusinessRecord = {
      [this.config.idField]: id,
      ...rawInput
    };
    if (this.config.fieldMap.createdDate) record[this.config.fieldMap.createdDate] = now;
    if (this.config.fieldMap.dateCreated) record[this.config.fieldMap.dateCreated] = new Date(now).toISOString().slice(0, 16).replace('T', ' ');
    if (this.config.fieldMap.lastModifiedDate) record[this.config.fieldMap.lastModifiedDate] = now;
    if (this.config.fieldMap.createdById && user?.sub) record[this.config.fieldMap.createdById] = user.sub;
    if (this.config.fieldMap.lastModifiedById && user?.sub) record[this.config.fieldMap.lastModifiedById] = user.sub;
    return this.toFrontend(await this.repository.create(record));
  }

  async update(id: string, patch: Record<string, unknown>, user?: AuthUser, sortKey?: string | boolean | number) {
    const rawPatch = this.toDynamo(patch);
    if (this.config.fieldMap.lastModifiedDate) rawPatch[this.config.fieldMap.lastModifiedDate] = Date.now();
    if (this.config.fieldMap.lastModifiedById && user?.sub) rawPatch[this.config.fieldMap.lastModifiedById] = user.sub;
    const updated = await this.repository.update(id, rawPatch, sortKey);
    if (!updated) throw notFound();
    return this.toFrontend(updated);
  }

  async delete(id: string, user?: AuthUser, sortKey?: string | boolean | number) {
    if (env.deleteMode === 'soft' && this.config.softDeleteField) {
      const rawField = this.config.fieldMap[this.config.softDeleteField] || this.config.softDeleteField;
      const updated = await this.repository.update(id, {
        [rawField]: this.config.softDeleteValue,
        ...(this.config.fieldMap.lastModifiedDate ? { [this.config.fieldMap.lastModifiedDate]: Date.now() } : {}),
        ...(this.config.fieldMap.lastModifiedById && user?.sub ? { [this.config.fieldMap.lastModifiedById]: user.sub } : {})
      }, sortKey);
      if (!updated) throw notFound();
      return this.toFrontend(updated);
    }

    const existing = await this.repository.getById(id, sortKey);
    if (!existing) throw notFound();
    await this.repository.hardDelete(id, sortKey);
    return { id, deleted: true };
  }

  private toDynamo(input: Record<string, unknown>) {
    const raw: Record<string, unknown> = {};
    for (const [field, value] of Object.entries(input)) {
      const rawField = this.config.fieldMap[field];
      if (rawField) raw[rawField] = value;
    }
    return raw;
  }

  private toFrontend(record: BusinessRecord) {
    const rawToFrontend = dynamoToFrontend(this.config);
    const transformed: Record<string, unknown> = {};
    for (const [rawField, value] of Object.entries(record)) {
      const frontendField = rawToFrontend[rawField];
      if (frontendField) transformed[frontendField] = value;
    }
    return transformed as BusinessRecord;
  }
}
