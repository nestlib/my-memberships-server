import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../core/base.service';
import { Arrival } from './arrivals.entity';

@Injectable()
export class ArrivalsService extends BaseService<Arrival> {
  constructor(@InjectRepository(Arrival) repository: Repository<Arrival>) {
    super(repository);
  }
}
