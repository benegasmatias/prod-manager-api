import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { Appointment } from './entities/appointment.entity';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { AppointmentStatus } from '../common/enums';
import { BusinessesService } from '../businesses/businesses.service';

@Injectable()
export class AppointmentsService {
    constructor(
        @InjectRepository(Appointment)
        private readonly appointmentRepository: Repository<Appointment>,
        private readonly businessesService: BusinessesService,
    ) {}

    async create(businessId: string, createDto: CreateAppointmentDto): Promise<Appointment> {
        await this.validateAppointment(businessId, createDto);

        const appointment = this.appointmentRepository.create({
            ...createDto,
            businessId,
            start: new Date(createDto.start),
            end: createDto.end ? new Date(createDto.end) : null,
        });
        return await this.appointmentRepository.save(appointment);
    }

    private async validateAppointment(businessId: string, dto: CreateAppointmentDto | UpdateAppointmentDto) {
        const business = await this.businessesService.findOne(businessId);
        const config = business.config?.appointments;

        if (!config) return; // No config, no specific rules

        const start = dto.start ? new Date(dto.start) : null;
        const end = dto.end ? new Date(dto.end) : null;

        if (start && end && end <= start) {
            throw new BadRequestException('La fecha de fin debe ser posterior a la de inicio.');
        }

        if (config.requireVehicle && !dto.vehicleId) {
            throw new BadRequestException('El vehículo es obligatorio para este negocio.');
        }

        if (!config.allowAnonymous && !dto.customerId) {
            throw new BadRequestException('El cliente es obligatorio para este negocio.');
        }

        if (dto.type && config.types?.length > 0) {
            if (!config.types.includes(dto.type)) {
                throw new BadRequestException(`El tipo "${dto.type}" no es válido para este negocio.`);
            }
        }
    }

    async findAll(businessId: string, query: any): Promise<{ data: Appointment[], total: number }> {
        const { 
            customerId, 
            employeeId, 
            vehicleId, 
            status, 
            type,
            dateFrom, 
            dateTo, 
            page = 1, 
            pageSize = 50 
        } = query;
        
        const where: any = { businessId };
        
        if (customerId) where.customerId = customerId;
        if (employeeId) where.employeeId = employeeId;
        if (vehicleId) where.vehicleId = vehicleId;
        if (status) where.status = status;
        if (type) where.type = type;

        if (dateFrom && dateTo) {
            where.start = Between(new Date(dateFrom), new Date(dateTo));
        } else if (dateFrom) {
            where.start = MoreThanOrEqual(new Date(dateFrom));
        } else if (dateTo) {
            where.start = LessThanOrEqual(new Date(dateTo));
        }

        const [data, total] = await this.appointmentRepository.findAndCount({
            where,
            relations: ['customer', 'vehicle', 'employee'],
            order: { start: 'ASC' },
            take: pageSize,
            skip: (page - 1) * pageSize,
        });

        return { data, total };
    }

    async findOne(businessId: string, id: string): Promise<Appointment> {
        const appointment = await this.appointmentRepository.findOne({
            where: { id, businessId },
            relations: ['customer', 'vehicle', 'employee'],
        });

        if (!appointment) {
            throw new NotFoundException(`Turno con ID ${id} no encontrado`);
        }
        return appointment;
    }

    async update(businessId: string, id: string, updateDto: UpdateAppointmentDto): Promise<Appointment> {
        const appointment = await this.findOne(businessId, id);
        
        // Merge current with update for validation
        const mergedDto = { ...appointment, ...updateDto };
        await this.validateAppointment(businessId, mergedDto as any);
        
        const updated = {
            ...updateDto,
            start: updateDto.start ? new Date(updateDto.start) : appointment.start,
            end: updateDto.end ? new Date(updateDto.end) : appointment.end,
        };

        Object.assign(appointment, updated);
        return await this.appointmentRepository.save(appointment);
    }

    async remove(businessId: string, id: string): Promise<void> {
        const appointment = await this.findOne(businessId, id);
        await this.appointmentRepository.remove(appointment);
    }

    async updateStatus(businessId: string, id: string, status: AppointmentStatus): Promise<Appointment> {
        const appointment = await this.findOne(businessId, id);
        appointment.status = status;
        return await this.appointmentRepository.save(appointment);
    }
}
