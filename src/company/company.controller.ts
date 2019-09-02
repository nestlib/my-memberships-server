import {
  Controller,
  UseInterceptors,
  ClassSerializerInterceptor,
  Get,
  Query,
  Param,
  Post,
  UseGuards,
  Body,
  Delete,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  PgParams,
  PaginationResponse,
} from '../core/pagination/pagination.types';
import { Company } from './company.entity';
import { User } from '../user/user.entity';
import { CompanyService } from './company.service';
import { OrmQueryPipe, OrmQuery } from '../core/typeorm/orm-query.pipe';
import { GetPagination } from '../core/pagination/pagination.decorator';
import { GetUser } from '../user/get-user.decorator';
import { IfAllowed } from '../access-control/if-allowed.decorator';

@Controller('companies')
@UseInterceptors(ClassSerializerInterceptor)
export class CompaniesController {
  constructor(private readonly service: CompanyService) {}

  /* Get ads, filtered and paginated */
  @Get()
  get(
    @Query(OrmQueryPipe) query: OrmQuery,
    @GetPagination() pg: PgParams,
  ): PaginationResponse<Company> {
    return this.service.paginate(query, pg);
  }

  /* Get company by id */
  @Get(':id')
  findById(@Param('id') id: string): Promise<Company> {
    return this.service.findById(id);
  }

  /* Create new company */
  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(
    @Body() company: Partial<Company>,
    @GetUser() user: User,
  ): Promise<Company> {
    return this.service.create({ ...company, owner: user });
  }

  /* Remove company */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @IfAllowed()
  remove(@Param('id') id: string, @GetUser() user: User): Promise<Company> {
    return this.service.delete(id);
  }

  /**
   * Update company
   * @todo updateData should not be null
   */
  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  @IfAllowed()
  async update(
    @Param('id') id: string,
    @Body() updateData: any,
  ): Promise<Company> {
    return this.service.update(id, updateData);
  }
}
