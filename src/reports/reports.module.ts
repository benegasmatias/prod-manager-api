import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { ProductionJob } from '../jobs/entities/production-job.entity';
import { Material } from '../materials/entities/material.entity';
import { Machine } from '../machines/entities/machine.entity';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Order, OrderItem, ProductionJob, Material, Machine]),
        BusinessesModule
    ],
    controllers: [ReportsController],
    providers: [ReportsService],
})
export class ReportsModule { }
