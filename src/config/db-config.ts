import { Arrival } from '../arrivals/arrivals.entity';
import { Company } from '../company/company.entity';
import { Location } from '../locations/location.entity';
import { PaymentRecord } from '../payment/payment-record.entity';
import { PricingPlan } from '../pricing-plan/pricing-plan.entity';
import { Subscription } from '../subscription/subscription.entity';
import { User } from '../user/user.entity';

export const appEntities = [
  User,
  Arrival,
  Company,
  Location,
  PaymentRecord,
  PricingPlan,
  Subscription,
];