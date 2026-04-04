import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './entities/business.entity';
import { BusinessMembership } from './entities/business-membership.entity';
import { BusinessSubscription } from './entities/business-subscription.entity';
import { BusinessTemplate } from './entities/business-template.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Machine } from '../machines/entities/machine.entity';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { BusinessTemplatesController } from './business-templates.controller';
import { BusinessStrategyProvider } from './strategies/business-strategy.provider';

import { Material } from '../materials/entities/material.entity';
import { Employee } from '../employees/entities/employee.entity';
import { PlanUsageService } from './plan-usage.service';

@Module({
    imports: [TypeOrmModule.forFeature([
        Business, 
        BusinessMembership, 
        BusinessSubscription,
        User, 
        BusinessTemplate, 
        Order, 
        Customer, 
        Machine, 
        Material,
        Employee
    ])],
    controllers: [BusinessesController, BusinessTemplatesController],
    providers: [BusinessesService, BusinessStrategyProvider, PlanUsageService],
    exports: [BusinessesService, BusinessStrategyProvider, PlanUsageService],
})
export class BusinessesModule { }
