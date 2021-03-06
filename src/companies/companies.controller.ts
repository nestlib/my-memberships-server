import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  AuthGuard,
  GetPagination,
  GetUser,
  PaginationParams,
  PermissionsGuard,
  PgResult,
  RolesService,
  UUID,
  ValidUUID,
} from 'nestjs-extra';
import { User } from '../users/user.entity';
import { UpdateCompanyDto } from './company.dto';
import { Company } from './company.entity';
import { CompaniesService } from './companies.service';
import { CompanyConfigService } from '../company-config/company-config.service';

/**
 * Companies Controller
 * @method getUsersCompanies is not CRUD
 * It's used to get companies for currently logged user
 * All other methods are basic crud
 */
@Controller('companies')
export class CompaniesController {
  constructor(
    private readonly companiesService: CompaniesService,
    private readonly roleService: RolesService,
  ) {}

  /** Get companies, filtered and paginated */
  @Get()
  find(@GetPagination() params: PaginationParams): PgResult<Company> {
    return this.companiesService.paginate(params);
  }

  /** Get companies that logged user has roles in */
  @Get('user')
  @UseGuards(AuthGuard('jwt'))
  async getUsersCompanies(@GetUser() user: User): Promise<Company[]> {
    const roles = await this.roleService.find({ userId: user.id });
    const companyIds = roles.map(role => role.domain);
    return this.companiesService.findByIds(companyIds);
  }

  /** Get company by id */
  @Get(':id')
  findById(@Param('id', ValidUUID) id: UUID): Promise<Company> {
    return this.companiesService.findOne(id);
  }

  /** Create company */
  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Body() data: Partial<Company>, @GetUser() user: User): Promise<Company> {
    const amountOfCompanies = await this.companiesService.count({
      owner: user,
    });
    if (amountOfCompanies > 5) {
      throw new ForbiddenException('You can have 5 companies max.');
    }
    return this.companiesService.createCompany(data, user, {
      user,
      reason: 'Create company.',
    });
  }

  /** Remove company */
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Delete(':id')
  remove(@Param('id', ValidUUID) id: UUID, @GetUser() user: User): Promise<Company> {
    return this.companiesService.deleteCompany(id, { user, domain: id });
  }

  /** Update company */
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Put(':id')
  async update(
    @Param('id', ValidUUID) id: UUID,
    @Body() updateData: UpdateCompanyDto,
    @GetUser() user: User,
  ): Promise<Company> {
    return this.companiesService.update(id, updateData, { user, domain: id });
  }
}
