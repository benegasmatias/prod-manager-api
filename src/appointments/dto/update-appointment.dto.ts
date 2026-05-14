import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentDto } from './create-appointment.dto';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateAppointmentDto extends PartialType(CreateAppointmentDto) {
    @IsOptional()
    @IsUUID()
    convertedOrderId?: string;
}
