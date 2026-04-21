import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calibration } from './entities/calibration.entity';
import { CreateCalibrationDto } from './dto/create-calibration.dto';
import { UpdateCalibrationDto } from './dto/update-calibration.dto';

@Injectable()
export class CalibrationsService {
    constructor(
        @InjectRepository(Calibration)
        private readonly calibrationRepository: Repository<Calibration>,
    ) {}

    async create(createDto: CreateCalibrationDto, businessId: string): Promise<Calibration> {
        const calibration = this.calibrationRepository.create({
            ...createDto,
            businessId,
        });
        return this.calibrationRepository.save(calibration);
    }

    async findAll(businessId: string, machineId?: string, materialId?: string): Promise<Calibration[]> {
        const where: any = { businessId };
        if (machineId) where.machineId = machineId;
        if (materialId) where.materialId = materialId;

        return this.calibrationRepository.find({
            where,
            relations: ['machine', 'material'],
            order: { createdAt: 'DESC' },
        });
    }

    async findOne(id: string, businessId: string): Promise<Calibration> {
        const calibration = await this.calibrationRepository.findOne({
            where: { id, businessId },
            relations: ['machine', 'material'],
        });
        if (!calibration) {
            throw new NotFoundException(`Registro de calibración no encontrado`);
        }
        return calibration;
    }

    async update(id: string, updateDto: UpdateCalibrationDto, businessId: string): Promise<Calibration> {
        await this.findOne(id, businessId);
        await this.calibrationRepository.update(id, updateDto);
        return this.findOne(id, businessId);
    }

    async remove(id: string, businessId: string): Promise<void> {
        await this.findOne(id, businessId);
        await this.calibrationRepository.delete(id);
    }
}
