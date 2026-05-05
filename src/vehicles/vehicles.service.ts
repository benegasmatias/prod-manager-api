import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehiclesService {
    constructor(
        @InjectRepository(Vehicle)
        private readonly vehicleRepository: Repository<Vehicle>,
    ) {}

    async create(businessId: string, data: any): Promise<Vehicle> {
        const vehicle = this.vehicleRepository.create({
            ...data,
            businessId,
        });
        const saved = await this.vehicleRepository.save(vehicle);
        return Array.isArray(saved) ? saved[0] : saved;
    }

    async findAll(businessId: string, customerId?: string): Promise<Vehicle[]> {
        const where: any = { businessId };
        if (customerId) where.customerId = customerId;
        return this.vehicleRepository.find({
            where,
            relations: ['customer'],
            order: { plate: 'ASC' },
        });
    }

    async findOne(businessId: string, id: string): Promise<Vehicle> {
        const vehicle = await this.vehicleRepository.findOne({
            where: { id, businessId },
            relations: ['customer', 'orders'],
        });
        if (!vehicle) throw new NotFoundException('Vehículo no encontrado');
        return vehicle;
    }

    async update(businessId: string, id: string, data: any): Promise<Vehicle> {
        const vehicle = await this.findOne(businessId, id);
        Object.assign(vehicle, data);
        const saved = await this.vehicleRepository.save(vehicle);
        return Array.isArray(saved) ? saved[0] : saved;
    }

    async findByPlate(businessId: string, plate: string): Promise<Vehicle> {
        return this.vehicleRepository.findOne({
            where: { businessId, plate },
        });
    }
}
