import { randomUUID } from 'node:crypto';
import { env } from '../config/env.js';
import type { EntityConfig } from '../config/entities.js';
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
    return this.repository.list(query);
  }

  async get(id: string) {
    const record = await this.repository.getById(id);
    if (!record) throw notFound();
    return record;
  }

  create(input: Record<string, unknown>, user?: AuthUser) {
    const now = new Date().toISOString();
    const record: BusinessRecord = {
      id: typeof input.id === 'string' && input.id.trim() ? input.id : randomUUID(),
      ...input,
      createdAt: now,
      updatedAt: now,
      createdBy: user?.sub
    };
    return this.repository.create(record);
  }

  async update(id: string, patch: Record<string, unknown>, user?: AuthUser) {
    const updated = await this.repository.update(id, { ...patch, updatedBy: user?.sub });
    if (!updated) throw notFound();
    return updated;
  }

  async delete(id: string, user?: AuthUser) {
    if (env.deleteMode === 'soft' && this.config.softDeleteStatus) {
      const updated = await this.repository.update(id, {
        status: this.config.softDeleteStatus,
        deletedAt: new Date().toISOString(),
        deletedBy: user?.sub
      });
      if (!updated) throw notFound();
      return updated;
    }

    const existing = await this.repository.getById(id);
    if (!existing) throw notFound();
    await this.repository.hardDelete(id);
    return { id, deleted: true };
  }
}
