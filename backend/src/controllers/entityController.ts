import type { Response } from 'express';
import { entityConfigs, type EntityConfig } from '../config/entities.js';
import { dynamoDb } from '../config/dynamoDb.js';
import { DynamoEntityRepository } from '../repositories/dynamoEntityRepository.js';
import { EntityService } from '../services/entityService.js';
import type { ApiRequest, EntityName } from '../types/api.js';
import { listSuccess, success } from '../utils/response.js';
import { validateCreateBody, validateId, validateListQuery, validateSortKey, validateUpdateBody } from '../validators/entityValidator.js';

const services = new Map<EntityName, EntityService>();

const getService = (config: EntityConfig) => {
  const existing = services.get(config.name);
  if (existing) return existing;
  const service = new EntityService(new DynamoEntityRepository(dynamoDb, config), config);
  services.set(config.name, service);
  return service;
};

export const createEntityController = (entityName: EntityName) => {
  const config = entityConfigs[entityName];
  const service = getService(config);

  return {
    list: async (req: ApiRequest, res: Response) => {
      const query = validateListQuery(req.query as Record<string, unknown>, config);
      const result = await service.list(query);
      listSuccess(res, result.items, query.pageSize, result.nextToken);
    },
    get: async (req: ApiRequest, res: Response) => {
      const id = validateId(req.params.id);
      const sortKey = validateSortKey(req.query.sortKey, config);
      success(res, await service.get(id, sortKey));
    },
    create: async (req: ApiRequest, res: Response) => {
      const body = validateCreateBody(req.body, config);
      success(res, await service.create(body, req.context.user), 201);
    },
    update: async (req: ApiRequest, res: Response) => {
      const id = validateId(req.params.id);
      const sortKey = validateSortKey(req.query.sortKey, config);
      const body = validateUpdateBody(req.body, config);
      success(res, await service.update(id, body, req.context.user, sortKey));
    },
    delete: async (req: ApiRequest, res: Response) => {
      const id = validateId(req.params.id);
      const sortKey = validateSortKey(req.query.sortKey, config);
      success(res, await service.delete(id, req.context.user, sortKey));
    }
  };
};
