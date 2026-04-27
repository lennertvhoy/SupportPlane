import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller.js';
import { StoreModule } from '../store/store.module.js';

@Module({
  imports: [StoreModule],
  controllers: [CustomersController],
})
export class CustomersModule {}
