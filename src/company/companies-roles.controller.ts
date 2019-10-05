import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { IfAllowed } from '../core/access-control/if-allowed.decorator';
import { PermissionsGuard } from '../core/access-control/permissions.guard';
import { RoleService } from '../core/access-control/role.service';
import { CreateRoleDto, UpdateRoleDto } from '../core/access-control/roles.dto';
import { Role } from '../core/access-control/roles.entity';
import { RoleName } from '../core/access-control/roles.list';
import { ValidRole } from '../core/access-control/valid-role.pipe';
import { PaginationParams } from '../core/pagination/pagination-options';
import { GetPagination } from '../core/pagination/pagination.decorator';
import { PgResult } from '../core/pagination/pagination.types';
import { UUID } from '../core/types';
import { ValidUUID } from '../core/uuid.pipe';
import { ValidReason } from '../core/valid-reason.pipe';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/user.entity';
import { CompanyRolesService } from './company-roles.service';
import { CompanyService } from './company.service';

/**
 * Every method is check for proper permissions.
 * This controller should not be in ac module cause it's app specific.
 * AC module should be as modular as posible.
 * @method find Filter and paginate roles that belongs to given company.
 * @method findRoleById Find role by id.
 * @method findUsersRoles Finds all roles given user has in company.
 * That is usually one role.
 * @method findAllWhoHaveARoleInCompany Find users that have role in company.
 * @method addNewRole Create new role for this company.
 * @method changeRole Change role.
 * @method deleteRole Delete role.
 */
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('companies/:companyId/roles')
export class CompaniesRolesController {
  constructor(
    private readonly rolesService: RoleService,
    private readonly companyService: CompanyService,
    private readonly companyRolesService: CompanyRolesService,
  ) {}

  /** Get roles for this company */
  @IfAllowed('read')
  @Get('')
  find(
    @Param('companyId', ValidUUID) companyId: UUID,
    @GetPagination() pg: PaginationParams,
  ): PgResult<Role> {
    return this.rolesService.paginate(pg, { domain: companyId });
  }

  /** Get all roles this user have in company */
  @IfAllowed('read')
  @Get('users/:userId')
  findUsersRoles(
    @Param('companyId', ValidUUID) companyId: UUID,
    @Param('userId', ValidUUID) userId: UUID,
  ): Promise<Role[]> {
    return this.rolesService.find({ userId, domain: companyId });
  }

  /** Get all users that have given role in this company */
  @IfAllowed('read')
  @Get('name/:roleName')
  findAllWhoHaveARoleInCompany(
    @Param('roleName', ValidRole) roleName: RoleName,
    @Param('companyId', ValidUUID) companyId: UUID,
    @GetPagination() pg: PaginationParams,
  ): PgResult<Role> {
    return this.rolesService.paginate(pg, {
      domain: companyId,
      name: roleName,
    });
  }

  /** Get role by id */
  @IfAllowed('read')
  @Get(':roleId')
  findRoleById(
    @Param('companyId', ValidUUID) companyId: UUID,
    @Param('roleId', ValidUUID) roleId: UUID,
  ): Promise<Role> {
    return this.rolesService.findOne({ id: roleId, domain: companyId });
  }

  /** Create new role */
  @IfAllowed()
  @Post('')
  async addNewRole(
    @Param('companyId', ValidUUID) companyId: UUID,
    @Body() data: CreateRoleDto,
    @GetUser() user: User,
    @Body('reason', ValidReason) reason?: string,
  ): Promise<Role> {
    const company = await this.companyService.findOne(companyId, {
      relations: ['roles'],
    });
    if (!this.companyRolesService.canAddRole(company)) {
      throw new ForbiddenException('Quota reached');
    }

    return this.rolesService.create(
      { ...data, ...{ domain: company.id } },
      { user, reason, domain: company.id },
    );
  }

  /** Change role */
  @IfAllowed()
  @Put(':roleId')
  async changeRole(
    @Param('companyId', ValidUUID) companyId: UUID,
    @Param('roleId', ValidUUID) roleId: UUID,
    @Body() data: UpdateRoleDto,
    @GetUser() user: User,
    @Body('reason', ValidReason) reason?: string,
  ): Promise<Role> {
    return this.rolesService.updateWhere(
      { domain: companyId, id: roleId },
      data,
      { user, reason, domain: companyId },
    );
  }

  /** Delete role by Id that belongs to this company */
  @IfAllowed()
  @Delete(':roleId')
  async deleteRole(
    @Param('companyId', ValidUUID) companyId: UUID,
    @Param('roleId', ValidUUID) roleId: UUID,
    @GetUser() user: User,
    @Body('reason', ValidReason) reason?: string,
  ): Promise<Role> {
    return this.rolesService.deleteWhere(
      { id: roleId, domain: companyId },
      { user, reason },
    );
  }
}