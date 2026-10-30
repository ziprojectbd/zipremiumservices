import type { Model, Document, QueryOptions, UpdateQuery } from 'mongoose';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterQuery<T> = Record<string, any>;
import logger from '@config/logger';

export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: Record<string, 1 | -1>;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async findById(id: string, options?: QueryOptions): Promise<T | null> {
    try {
      return await this.model.findById(id, null, options).lean();
    } catch (error) {
      logger.error(`BaseRepository.findById error for ${this.model.modelName}`, { id, error });
      throw error;
    }
  }

  async findOne(filter: FilterQuery<T>, options?: QueryOptions): Promise<T | null> {
    try {
      return await this.model.findOne(filter, null, options).lean();
    } catch (error) {
      logger.error(`BaseRepository.findOne error for ${this.model.modelName}`, { filter, error });
      throw error;
    }
  }

  async find(filter: FilterQuery<T>, options?: QueryOptions): Promise<T[]> {
    try {
      return await this.model.find(filter, null, options).lean();
    } catch (error) {
      logger.error(`BaseRepository.find error for ${this.model.modelName}`, { filter, error });
      throw error;
    }
  }

  async findAll(options?: QueryOptions): Promise<T[]> {
    try {
      return await this.model.find({}, null, options).lean();
    } catch (error) {
      logger.error(`BaseRepository.findAll error for ${this.model.modelName}`, { error });
      throw error;
    }
  }

  async create(data: Partial<T>): Promise<T> {
    try {
      return await this.model.create(data);
    } catch (error) {
      logger.error(`BaseRepository.create error for ${this.model.modelName}`, { error });
      throw error;
    }
  }

  async updateById(id: string, update: UpdateQuery<T>, options?: QueryOptions): Promise<T | null> {
    try {
      return await this.model.findByIdAndUpdate(id, update, { new: true, ...options }).lean();
    } catch (error) {
      logger.error(`BaseRepository.updateById error for ${this.model.modelName}`, { id, error });
      throw error;
    }
  }

  async deleteById(id: string): Promise<T | null> {
    try {
      return await this.model.findByIdAndDelete(id).lean();
    } catch (error) {
      logger.error(`BaseRepository.deleteById error for ${this.model.modelName}`, { id, error });
      throw error;
    }
  }

  async paginate(
    filter: FilterQuery<T> = {},
    options: PaginationOptions,
  ): Promise<PaginatedResult<T>> {
    const { page, limit, sort = { createdAt: -1 as 1 | -1 } } = options;
    const skip = (page - 1) * limit;

    try {
      const [data, total] = await Promise.all([
        this.model.find(filter).sort(sort).skip(skip).limit(limit).lean(),
        this.model.countDocuments(filter),
      ]);

      const pages = Math.ceil(total / limit);
      return {
        data: data as unknown as T[],
        pagination: {
          page,
          limit,
          total,
          pages,
          hasNextPage: page < pages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      logger.error(`BaseRepository.paginate error for ${this.model.modelName}`, { filter, page, limit, error });
      throw error;
    }
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    try {
      return await this.model.countDocuments(filter);
    } catch (error) {
      logger.error(`BaseRepository.count error for ${this.model.modelName}`, { filter, error });
      throw error;
    }
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    try {
      const doc = await this.model.findOne(filter).select('_id').lean();
      return !!doc;
    } catch (error) {
      logger.error(`BaseRepository.exists error for ${this.model.modelName}`, { filter, error });
      throw error;
    }
  }

  async aggregate(pipeline: import('mongoose').PipelineStage[]): Promise<unknown[]> {
    try {
      return await this.model.aggregate(pipeline);
    } catch (error) {
      logger.error(`BaseRepository.aggregate error for ${this.model.modelName}`, { error });
      throw error;
    }
  }
}
