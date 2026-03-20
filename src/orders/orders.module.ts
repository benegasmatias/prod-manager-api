import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderFailure } from './entities/order-failure.entity';
import { OrderStatusHistory } from '../history/entities/order-status-history.entity';
import { Product } from '../products/entities/product.entity';
import { ProductionJob } from '../jobs/entities/production-job.entity';
import { Machine } from '../machines/entities/machine.entity';
import { Material } from '../materials/entities/material.entity';
import { Payment } from '../payments/entities/payment.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Order, OrderItem, OrderFailure, OrderStatusHistory, Product, ProductionJob, Machine, Material, Payment])],

    controllers: [OrdersController],
    providers: [OrdersService],
    exports: [OrdersService, TypeOrmModule],
})
export class OrdersModule { }
