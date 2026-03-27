import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './entities/employee.entity';
import { EmployeesService } from './employees.service';
import { EmployeesController } from './employees.controller';
import { UsersModule } from '../users/users.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { SupabaseModule } from '../common/supabase/supabase.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Employee]),
        UsersModule,
        BusinessesModule,
        SupabaseModule
    ],
    controllers: [EmployeesController],
    providers: [EmployeesService],
    exports: [EmployeesService],
})
export class EmployeesModule { }
