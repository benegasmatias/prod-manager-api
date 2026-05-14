import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './entities/appointment.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { BusinessesModule } from '../businesses/businesses.module';
import { AuditModule } from '../audit/audit.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Appointment]),
        BusinessesModule,
        AuditModule
    ],
    controllers: [AppointmentsController],
    providers: [AppointmentsService],
    exports: [AppointmentsService],
})
export class AppointmentsModule {}
