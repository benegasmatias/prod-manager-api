import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './entities/business.entity';
import { BusinessMembership } from './entities/business-membership.entity';
import { BusinessTemplate } from './entities/business-template.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Printer } from '../printers/entities/printer.entity';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { BusinessTemplatesController } from './business-templates.controller';

import { Material } from '../materials/entities/material.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Business, BusinessMembership, User, BusinessTemplate, Order, Customer, Printer, Material])],
    controllers: [BusinessesController, BusinessTemplatesController],
    providers: [BusinessesService],
    exports: [BusinessesService],
})
export class BusinessesModule { }
