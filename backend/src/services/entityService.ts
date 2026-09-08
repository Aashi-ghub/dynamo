import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import { dynamoToFrontend, type EntityConfig } from '../config/entities.js';
import type { BusinessRecord } from '../models/businessRecord.js';
import type { DynamoEntityRepository } from '../repositories/dynamoEntityRepository.js';
import type { AuthUser, ListQuery } from '../types/api.js';
import { stripBom } from '../utils/bom.js';
import { notFound, badRequest } from '../utils/errors.js';

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
    if (this.config.fieldMap.subscriptionId && !record[this.config.fieldMap.subscriptionId]) {
      record[this.config.fieldMap.subscriptionId] = Date.now().toString();
    }
    return this.toFrontend(await this.repository.create(record));
  }

  async update(id: string, patch: Record<string, unknown>, user?: AuthUser, sortKey?: string | boolean | number) {
    const rawInput = this.toDynamo(patch);
    const existing = await this.repository.getById(id, sortKey);
    if (!existing) throw notFound();

    const mergedInput = { ...rawInput, ...this.buildHistoryPatch(existing, rawInput) };
    const newId = mergedInput[this.config.idField];
    if (typeof newId === 'string' && newId.trim() && newId !== id) {
      return this.moveKey(id, newId, existing, mergedInput, user, sortKey);
    }

    const rawPatch = this.stripKeyFields(mergedInput);
    if (Object.keys(rawPatch).length === 0) {
      throw badRequest('Validation failed', [{ field: 'body', message: 'No updatable fields were provided' }]);
    }
    if (this.config.fieldMap.lastModifiedDate) rawPatch[this.config.fieldMap.lastModifiedDate] = Date.now();
    if (this.config.fieldMap.lastModifiedById && user?.sub) rawPatch[this.config.fieldMap.lastModifiedById] = user.sub;
    const updated = await this.repository.update(id, rawPatch, sortKey);
    if (!updated) throw notFound();
    return this.toFrontend(updated);
  }

  private async moveKey(
    oldId: string,
    newId: string,
    existing: BusinessRecord,
    rawInput: Record<string, unknown>,
    user?: AuthUser,
    sortKey?: string | boolean | number
  ) {
    const record: BusinessRecord = {
      ...existing,
      ...this.stripKeyFields(rawInput),
      [this.config.idField]: newId
    };
    if (this.config.fieldMap.lastModifiedDate) record[this.config.fieldMap.lastModifiedDate] = Date.now();
    if (this.config.fieldMap.lastModifiedById && user?.sub) record[this.config.fieldMap.lastModifiedById] = user.sub;

    const moved = await this.repository.moveItem(oldId, record, sortKey);
    return this.toFrontend(moved);
  }

  /**
   * Snapshots `snapshotFields` from the pre-update record into `historyField` when the incoming
   * `triggerField` value both (a) actually differs from its current stored value, and (b) is
   * strictly after the existing `compareField` value — i.e. this save is itself the renewal, not
   * an unrelated later edit (e.g. filling in the end date) that happens to still satisfy the
   * after-old-end-date check left over from a prior save.
   */
  private buildHistoryPatch(existing: BusinessRecord, rawInput: Record<string, unknown>) {
    const tracking = this.config.historyTracking;
    if (!tracking) return {};
    const triggerRaw = this.config.fieldMap[tracking.triggerField];
    const compareRaw = this.config.fieldMap[tracking.compareField];
    const historyRaw = this.config.fieldMap[tracking.historyField];
    if (!triggerRaw || !compareRaw || !historyRaw) return {};

    const newValue = rawInput[triggerRaw];
    const oldValue = existing[triggerRaw];
    const oldCompareValue = existing[compareRaw];
    if (typeof newValue !== 'string' || !newValue) return {};
    if (typeof oldCompareValue !== 'string' || !oldCompareValue) return {};
    if (newValue === oldValue) return {};
    if (!(newValue > oldCompareValue)) return {};

    const entry: Record<string, unknown> = {};
    for (const field of tracking.snapshotFields) {
      const raw = this.config.fieldMap[field];
      if (raw) entry[field] = existing[raw];
    }

    const existingHistory = Array.isArray(existing[historyRaw]) ? (existing[historyRaw] as unknown[]) : [];
    return { [historyRaw]: [...existingHistory, entry] };
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

  private stripKeyFields(raw: Record<string, unknown>) {
    const next = { ...raw };
    delete next[this.config.idField];
    if (this.config.sortKeyField) {
      const rawSortKey = this.config.fieldMap[this.config.sortKeyField];
      if (rawSortKey) delete next[rawSortKey];
    }
    return next;
  }

  private toFrontend(record: BusinessRecord) {
    const rawToFrontend = dynamoToFrontend(this.config);
    // Some legacy/externally-written records store attribute names without the leading
    // byte-order-mark this app's fieldMap expects (e.g. plain "Subscription ID" instead of
    // "﻿Subscription ID"), which would otherwise silently drop that field on read.
    const rawToFrontendByStrippedKey: Record<string, string> = {};
    for (const [rawField, frontendField] of Object.entries(rawToFrontend)) {
      rawToFrontendByStrippedKey[stripBom(rawField)] = frontendField;
    }

    const transformed: Record<string, unknown> = {};
    for (const [rawField, value] of Object.entries(record)) {
      const frontendField = rawToFrontend[rawField] ?? rawToFrontendByStrippedKey[stripBom(rawField)];
      if (frontendField) transformed[frontendField] = value;
    }
    return transformed as BusinessRecord;
  }
}
