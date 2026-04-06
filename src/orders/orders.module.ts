import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { OrderStrategyProvider } from './order-strategy.provider';
import { OrderWorkflowService } from './order-workflow.service';
import { OrderFinancialService } from './order-financial.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderFailure } from './entities/order-failure.entity';
import { OrderStatusHistory } from '../history/entities/order-status-history.entity';
import { OrderSiteInfo } from './entities/order-site-info.entity';
import { Product } from '../products/entities/product.entity';
import { ProductionJob } from '../jobs/entities/production-job.entity';
import { Machine } from '../machines/entities/machine.entity';
import { Material } from '../materials/entities/material.entity';
import { Payment } from '../payments/entities/payment.entity';
import { BusinessesModule } from '../businesses/businesses.module';


@Module({
    imports: [TypeOrmModule.forFeature([
        Order, 
        OrderItem, 
        OrderFailure, 
        OrderStatusHistory, 
        OrderSiteInfo,
        Product, 
        ProductionJob, 
        Machine, 
        Material, 
        Payment
    ]), BusinessesModule],
    controllers: [OrdersController],
    providers: [OrdersService, OrderStrategyProvider, OrderWorkflowService, OrderFinancialService],
    exports: [OrdersService, OrderWorkflowService, TypeOrmModule],
})
export class OrdersModule { }
