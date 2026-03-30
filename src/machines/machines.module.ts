import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Machine } from './entities/machine.entity';
import { MachinesController } from './machines.controller';
import { MachinesService } from './machines.service';
import { OrdersModule } from '../orders/orders.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Machine]),
        OrdersModule,
        JobsModule
    ],
    controllers: [MachinesController],
    providers: [MachinesService],
    exports: [MachinesService],
})
export class MachinesModule { }
