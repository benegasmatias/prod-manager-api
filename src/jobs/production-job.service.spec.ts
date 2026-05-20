import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductionJobService } from './production-job.service';
import { ProductionJob } from './entities/production-job.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Business } from '../businesses/entities/business.entity';
import { BusinessTemplate } from '../businesses/entities/business-template.entity';
import { ProductionJobMaterial } from './entities/production-job-material.entity';
import { Material } from '../materials/entities/material.entity';
import { Machine } from '../machines/entities/machine.entity';
import { OrderWorkflowService } from '../orders/order-workflow.service';
import { DataSource } from 'typeorm';
import { ProductionJobStatus, MachineStatus } from '../common/enums';
import { BadRequestException } from '@nestjs/common';

describe('ProductionJobService Machine Constraint Tests', () => {
    let service: ProductionJobService;
    let jobRepo;
    let machineRepo;
    let itemRepo;
    let workflowService;

    beforeEach(async () => {
        jobRepo = {
            findOne: jest.fn(),
            save: jest.fn(d => Promise.resolve(d)),
        };
        machineRepo = {
            findOne: jest.fn(),
            update: jest.fn(),
        };
        itemRepo = {
            findOne: jest.fn(),
            save: jest.fn(),
        };
        workflowService = {
            aggregateOrderStatus: jest.fn(),
        };

        const mockManager = {
            update: jest.fn((entityClass, id, data) => {
                if (entityClass === Machine) {
                    return machineRepo.update(id, data);
                }
                return Promise.resolve();
            }),
            save: jest.fn(d => Promise.resolve(d)),
            find: jest.fn(() => Promise.resolve([])),
            findOne: jest.fn(() => Promise.resolve(null)),
            create: jest.fn(c => c),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ProductionJobService,
                { provide: getRepositoryToken(ProductionJob), useValue: jobRepo },
                { provide: getRepositoryToken(OrderItem), useValue: itemRepo },
                { provide: getRepositoryToken(Business), useValue: {} },
                { provide: getRepositoryToken(BusinessTemplate), useValue: {} },
                { provide: getRepositoryToken(ProductionJobMaterial), useValue: {} },
                { provide: getRepositoryToken(Material), useValue: {} },
                { provide: getRepositoryToken(Machine), useValue: machineRepo },
                { provide: OrderWorkflowService, useValue: workflowService },
                {
                    provide: DataSource,
                    useValue: {
                        manager: mockManager,
                        transaction: jest.fn((cb) => cb(mockManager)),
                    },
                },
            ],
        }).compile();

        service = module.get<ProductionJobService>(ProductionJobService);
    });

    it('1. Allows starting job if machine is IDLE', async () => {
        const mockJob = {
            id: 'job-1',
            status: ProductionJobStatus.QUEUED,
            machineId: 'mach-1',
            businessId: 'bus-1',
        };
        const mockMachine = {
            id: 'mach-1',
            name: 'Ender 3',
            active: true,
            status: MachineStatus.IDLE,
        };

        jobRepo.findOne
            .mockResolvedValueOnce(mockJob)
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce({ ...mockJob, status: ProductionJobStatus.IN_PROGRESS });
        machineRepo.findOne.mockResolvedValue(mockMachine);

        const result = await service.updateStatus('bus-1', 'job-1', ProductionJobStatus.IN_PROGRESS);
        expect(result.status).toBe(ProductionJobStatus.IN_PROGRESS);
        expect(machineRepo.update).toHaveBeenCalledWith('mach-1', { status: MachineStatus.PRINTING });
    });

    it('2. Rejects starting job if machine is in MAINTENANCE or DOWN', async () => {
        const mockJob = {
            id: 'job-1',
            status: ProductionJobStatus.QUEUED,
            machineId: 'mach-1',
            businessId: 'bus-1',
        };
        const mockMachine = {
            id: 'mach-1',
            name: 'Ender 3',
            active: true,
            status: MachineStatus.MAINTENANCE,
        };

        jobRepo.findOne.mockResolvedValue(mockJob);
        machineRepo.findOne.mockResolvedValue(mockMachine);

        await expect(
            service.updateStatus('bus-1', 'job-1', ProductionJobStatus.IN_PROGRESS)
        ).rejects.toThrow(BadRequestException);
    });

    it('3. Rejects starting second job on same machine if another is IN_PROGRESS', async () => {
        const mockJob2 = {
            id: 'job-2',
            status: ProductionJobStatus.QUEUED,
            machineId: 'mach-1',
            businessId: 'bus-1',
        };
        const mockMachine = {
            id: 'mach-1',
            name: 'Ender 3',
            active: true,
            status: MachineStatus.PRINTING,
        };
        const activeJob = {
            id: 'job-1',
            status: ProductionJobStatus.IN_PROGRESS,
            machineId: 'mach-1',
        };

        jobRepo.findOne
            .mockResolvedValueOnce(mockJob2) // Inside updateStatus
            .mockResolvedValueOnce(activeJob); // Inside validateMachineAvailability (jobRepository.findOne)

        machineRepo.findOne.mockResolvedValue(mockMachine);

        await expect(
            service.updateStatus('bus-1', 'job-2', ProductionJobStatus.IN_PROGRESS)
        ).rejects.toThrow('ya está ocupada por otro trabajo en proceso');
    });

    it('4. Allows updating/resuming the same active job on the machine without blocking itself', async () => {
        const mockJob1 = {
            id: 'job-1',
            status: ProductionJobStatus.IN_PROGRESS,
            machineId: 'mach-1',
            businessId: 'bus-1',
        };
        const mockMachine = {
            id: 'mach-1',
            name: 'Ender 3',
            active: true,
            status: MachineStatus.PRINTING,
        };

        jobRepo.findOne
            .mockResolvedValueOnce(mockJob1) // Inside updateStatus
            .mockResolvedValueOnce(mockJob1); // Inside validateMachineAvailability (jobRepository.findOne)

        machineRepo.findOne.mockResolvedValue(mockMachine);

        const result = await service.updateStatus('bus-1', 'job-1', ProductionJobStatus.IN_PROGRESS);
        expect(result.status).toBe(ProductionJobStatus.IN_PROGRESS);
    });

    it('5. Throws if trying to start job without machine assigned', async () => {
        const mockJob = {
            id: 'job-1',
            status: ProductionJobStatus.QUEUED,
            machineId: null,
            businessId: 'bus-1',
        };

        jobRepo.findOne.mockResolvedValue(mockJob);

        await expect(
            service.updateStatus('bus-1', 'job-1', ProductionJobStatus.IN_PROGRESS)
        ).rejects.toThrow('No se puede iniciar el trabajo sin una máquina asignada');
    });
});
