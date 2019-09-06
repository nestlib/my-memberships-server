import { Repository, FindManyOptions } from 'typeorm';
import { validate } from 'class-validator';
import { BadRequestException } from '@nestjs/common';
import { ParseCursor } from './_parse-cursor';
import { GenerateCursor } from './_generate-cursor';
import { WithId } from '../interfaces';
import { OrmWhere } from '../types';
import { PgResult, PaginatorResponse } from './pagination.types';
import { PaginationParams } from './pagination-options';

/**
 * Format is: uuid;columnName;columnValue;type
 * Part ";type" is optional.
 * So if we sort by createdAt, it will look like this
 * 8a4ba6e0-6dd9-4207-b179-6d922555d38e;createdAt;1567457902579
 * If column name ends with "At", value will be inferred to be date.
 * It will order and filter:
 * @example
 *  order: { createdAt: this.order },
 *  where: {
 *    ...additionalFilter,
 *    ...parsedQuery // Automatically added
 *  },
 *  take: this.limit
 */
export class Paginator<T extends WithId> {
  /** Repository that fetches entities */
  private repo: Repository<T>;

  /* How much entities to return */
  private limit: number = 24;

  private order: 'ASC' | 'DESC' = 'DESC';

  /** Column that should be orderd */
  private orderColumn: string = 'createdAt';

  /** Cursor provided from request. If null that means that it's first page */
  private cursor?: string;

  /** All relations that repo should fetch */
  private relations: string[] = [];

  /** Query from request. If filter is not provided, use this */
  private requestQuery: OrmWhere<T>;

  constructor(repo: Repository<T>) {
    this.repo = repo;
  }

  /** Validate and set order, limit and cursor */
  async setOptions(params: PaginationParams) {
    const errors = await validate(params);
    if (errors.length > 0) throw new BadRequestException(errors);

    this.limit = params.limit || this.limit;
    this.order = params.order || 'DESC';
    this.cursor = params.cursor;
    this.requestQuery = params.where;
    this.relations = params.relations;
  }

  /* Execute query */
  async execute(filter?: OrmWhere<T>, useQuery = true): PgResult<T> {
    let cursorQuery;
    if (this.cursor) {
      cursorQuery = new ParseCursor(this.cursor).query;
    } else {
      cursorQuery = {};
    }
    // If filter is not provided,
    // and user didn't forbid to use query, use query
    const whereQuery = filter && useQuery ? filter : this.requestQuery;
    if (typeof whereQuery === 'string') {
      throw new BadRequestException('Filter is string');
    }

    const result = await this.repo.find({
      where: { ...whereQuery, ...cursorQuery },
      order: { [this.orderColumn]: this.order },
      take: this.limit + 1,
      relations: this.relations,
    } as FindManyOptions<T>);

    return this.parseResponse(result);
  }

  /** Result will contain one item more to check if there's next page */
  private parseResponse(result: T[]) {
    const response = new PaginatorResponse<T>();
    const isLastPage = this.limit >= result.length;

    let next;
    let endsAt;
    /** If it is not last page generate cursor for next page */
    if (!isLastPage && result.length > 0) {
      const nextEntity = result.pop() as T;
      next = new GenerateCursor(nextEntity, this.orderColumn).cursor;
      /* Generate last cursor for this page */
      endsAt = new GenerateCursor(result[result.length - 1]).cursor;
    }
    /* retur response */
    response.pagination = {
      isLastPage,
      next,
      endsAt,
      amount: result.length,
      startsAt: this.cursor,
    };
    response.data = result;
    return response;
  }
}