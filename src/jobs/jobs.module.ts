import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { OrdersModule } from '../orders/orders.module';
import { ProductionJob } from './entities/production-job.entity';
import { JobProgress } from './entities/job-progress.entity';
import { JobStatusHistory } from '../history/entities/job-status-history.entity';
import { Printer } from '../printers/entities/printer.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([ProductionJob, JobProgress, JobStatusHistory, Printer]),
        OrdersModule,
    ],
    controllers: [JobsController],
    providers: [JobsService],
    exports: [JobsService],
})
export class JobsModule { }
