import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { Customer } from './entities/customer.entity';
import { BusinessesModule } from '../businesses/businesses.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Customer]),
        BusinessesModule
    ],
    controllers: [CustomersController],
    providers: [CustomersService],
})
export class CustomersModule { }
