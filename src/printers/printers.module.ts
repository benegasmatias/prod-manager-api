import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Printer } from './entities/printer.entity';
import { PrintersController } from './printers.controller';
import { PrintersService } from './printers.service';
import { OrdersModule } from '../orders/orders.module';
import { JobsModule } from '../jobs/jobs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Printer]),
        OrdersModule,
        JobsModule
    ],
    controllers: [PrintersController],
    providers: [PrintersService],
    exports: [PrintersService],
})
export class PrintersModule { }
