import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsService } from './jobs.service';
import { ProductionJobService } from './production-job.service';
import { JobsController } from './jobs.controller';
import { ProductionJobsController } from './production-jobs.controller';
import { OrdersModule } from '../orders/orders.module';
import { ProductionJob } from './entities/production-job.entity';
import { JobProgress } from './entities/job-progress.entity';
import { JobStatusHistory } from '../history/entities/job-status-history.entity';
import { Machine } from '../machines/entities/machine.entity';
import { Material } from '../materials/entities/material.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Business } from '../businesses/entities/business.entity';
import { BusinessTemplate } from '../businesses/entities/business-template.entity';
import { ProductionJobMaterial } from './entities/production-job-material.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            ProductionJob, 
            JobProgress, 
            JobStatusHistory, 
            Machine, 
            Material, 
            OrderItem, 
            Business, 
            BusinessTemplate,
            ProductionJobMaterial
        ]),
        OrdersModule,
    ],
    controllers: [JobsController, ProductionJobsController],
    providers: [JobsService, ProductionJobService],
    exports: [JobsService, ProductionJobService],
})
export class JobsModule { }
