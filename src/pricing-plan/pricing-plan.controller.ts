import { Controller, Delete, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionsGuard } from '../core/access-control/permissions.guard';
import { UUID } from '../core/types';
import { ValidUUID } from '../core/uuid.pipe';
import { GetUser } from '../user/get-user.decorator';
import { User } from '../user/user.entity';
import { ExtendPricingPlanDto, NewPricingPlanDto } from './pricing-plan.dto';
import { PricingPlan } from './pricing-plan.entity';
import { PricingPlanService } from './pricing-plan.service';

@UseGuards(AuthGuard('jwt'), PermissionsGuard)
@Controller('companies/:companyId/pricing-plan')
export class PricingPlanController {
  constructor(private readonly pricingPlanService: PricingPlanService) {}

  /** Start new plan, cancel old plans if exist */
  @Post('')
  async startNewPlan(
    @Param('companyId', ValidUUID) companyId: UUID,
    @GetUser() user: User,
    planData: NewPricingPlanDto,
  ): Promise<any> {
    return this.pricingPlanService.newPlan(companyId, planData, user);
  }

  /** Create new plan that start after currently active plan ends */
  @Post('extend')
  async extendCurrentPlan(
    @Param('companyId', ValidUUID) companyId: UUID,
    @GetUser() user: User,
    planData: ExtendPricingPlanDto,
  ): Promise<PricingPlan> {
    return this.pricingPlanService.extendPlan(companyId, planData, user);
  }

  /** Remove active plan. User can manually remove plan if he/she wants */
  @Delete()
  async cancelCurrentPlan(
    @Param('companyId', ValidUUID) companyId: UUID,
    @GetUser() user: User,
  ): Promise<PricingPlan> {
    return this.pricingPlanService.cancelActivePlan(companyId, user);
  }
}