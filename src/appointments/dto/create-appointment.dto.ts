import { IsString, IsOptional, IsUUID, IsDateString, IsEnum, IsObject } from 'class-validator';
import { AppointmentStatus } from '../../common/enums';

export class CreateAppointmentDto {
    @IsString()
    subject: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsDateString()
    start: string;

    @IsOptional()
    @IsDateString()
    end?: string;

    @IsOptional()
    @IsEnum(AppointmentStatus)
    status?: AppointmentStatus;

    @IsOptional()
    @IsString()
    type?: string;

    @IsOptional()
    @IsUUID()
    customerId?: string;

    @IsOptional()
    @IsUUID()
    vehicleId?: string;

    @IsOptional()
    @IsUUID()
    employeeId?: string;

    @IsOptional()
    @IsObject()
    metadata?: any;
}
