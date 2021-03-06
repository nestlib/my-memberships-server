import { Expose } from 'class-transformer';
import { IsDate } from 'class-validator';
import moment from 'moment';
import { BaseEntity, getEndTime, IsBetween } from 'nestjs-extra';
import { BeforeUpdate, Column, Entity, Index, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Arrival } from '../arrivals/arrival.entity';
import { Company } from '../companies/company.entity';
import { User } from '../users/user.entity';

@Entity('subscriptions')
export class Subscription extends BaseEntity {
  /* Company where subscription is valid */
  @ManyToOne(
    type => Company,
    company => company.subscriptions,
    { onDelete: 'CASCADE' },
  )
  company: Company;

  /** Company id  */
  @Column()
  companyId: string;

  /** Subscription owner */
  @ManyToOne(
    type => User,
    user => user.subscriptions,
    { onDelete: 'SET NULL' },
  )
  owner: User;

  /** Subscription owner id  */
  @Column({ nullable: true })
  ownerId: string;

  /* Date from which subscription is valid */
  @Column({ precision: 3, default: new Date() })
  @IsDate()
  startsAt: Date;

  /* Date to which subscription is valid. Has index because it's often sorted */
  @Column({ precision: 3, nullable: true })
  @Index()
  @IsDate()
  expiresAt?: Date;

  /* How much did this subscription cost */
  @Column()
  @Index()
  @IsBetween(0, 10000000)
  price: number;

  /** This entity serves as a subscription and as voucher */
  @Column({ default: 'membership' })
  type: string;

  @OneToMany(
    type => Arrival,
    arrival => arrival.subscription,
  )
  arrivals: Arrival[];

  /**
   * How much time can user use this subscription
   * (enter an gym, attend pilates...).
   * If null it's unlimided.
   */
  @Column({ nullable: true })
  allowedUses?: number;

  /** Is this subscription active. */
  @Column({ default: true })
  active: boolean;

  @Column({ default: 0 })
  usedAmount: number;

  /** Disables this subscription. It contains reason, who and when. */
  // @Column(type => DeleteColumns)
  // deleted: DeleteColumns;

  /** Check if subscription is still valid */
  @BeforeUpdate()
  isValid(): void {
    if (moment(this.expiresAt).isBefore(moment.now()) && this.active) {
      this.active = false;
    }

    if (this.allowedUses && this.allowedUses <= this.usedAmount) {
      this.active = false;
    }
  }

  /**
   * Set how long subscription is valid, and when it starts.
   * Default is one month, and starts now
   */
  setDuration(
    duration: moment.Duration = moment.duration(1, 'month'),
    timeFrom: moment.Moment = moment(),
  ): void {
    this.startsAt = timeFrom.toDate();
    this.expiresAt = getEndTime(duration, timeFrom);
  }
}
