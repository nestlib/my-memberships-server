import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PgResult } from '../core/pagination/pagination.types';
import { PaginationParams } from '../core/pagination/pagination-options';
import { GetPagination } from '../core/pagination/pagination.decorator';
import { SubscriptionService } from './subscription.service';
import { Subscription } from './subscription.entity';
import { ValidUUID } from '../core/uuid.pipe';
import { IfAllowed } from '../access-control/if-allowed.decorator';
import { PermissionsGuard } from '../access-control/permissions.guard';

/** Controller in charge for getting user subscriptions */
@Controller('users/:userId/subscriptions')
export class UserSubscriptionController {
  constructor(private readonly service: SubscriptionService) {}

  /* Get subscriptions, filtered and paginated */
  @IfAllowed('read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Get()
  get(
    @Param('userId', ValidUUID) ownerId: string,
    @GetPagination() pg: PaginationParams,
  ): PgResult<Subscription> {
    return this.service.paginate(pg, { ownerId });
  }

  /** Get subscription by id */
  @IfAllowed('read')
  @UseGuards(AuthGuard('jwt'), PermissionsGuard)
  @Get(':id')
  findById(
    @Param('userId') ownerId: string,
    @Param('id') id: string,
  ): Promise<Subscription> {
    return this.service.findOne({ id, ownerId });
  }
}