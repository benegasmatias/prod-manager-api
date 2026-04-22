import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { MaterialsService } from './materials.service';
import { Material } from './entities/material.entity';
import { MaterialMovement } from './entities/material-movement.entity';
import { MaterialType } from '../common/enums';

describe('MaterialsService Validation (Phase 2)', () => {
    let service: MaterialsService;
    let materialRepo;
    let movementRepo;

    const mockMaterial: any = {
        id: '1',
        name: 'PLA Test',
        type: 'PLA',
        remainingWeightGrams: 1000,
        businessId: 'bus-1',
        attributes: {}
    };

    beforeEach(async () => {
        materialRepo = {
            create: jest.fn(d => ({ ...d })),
            save: jest.fn(d => Promise.resolve({ id: '1', ...d })),
            findOneBy: jest.fn(),
            update: jest.fn(),
            find: jest.fn(),
        };
        movementRepo = {
            create: jest.fn(d => ({ ...d })),
            save: jest.fn(d => Promise.resolve({ id: 'mov-1', ...d })),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                MaterialsService,
                { provide: getRepositoryToken(Material), useValue: materialRepo },
                { provide: getRepositoryToken(MaterialMovement), useValue: movementRepo },
            ],
        }).compile();

        service = module.get<MaterialsService>(MaterialsService);
    });

    it('Flow 1: Creation should populate legacy + attributes and record movement', async () => {
        const dto = {
            name: 'New Material',
            type: 'PLA',
            remainingWeightGrams: 500,
            businessId: 'bus-1',
            attributes: { nozzleTemp: 200 }
        };

        const result = await service.create(dto as any);
        
        expect(result.name).toBe('New Material');
        expect(result.attributes).toEqual({ nozzleTemp: 200 });
        expect(movementRepo.save).toHaveBeenCalled(); // Initial stock movement
        const mov = (movementRepo.save as jest.Mock).mock.calls[0][0];
        expect(mov.type).toBe('IN');
        expect(mov.newValue).toBe(500);
    });

    it('Flow 2: Meta-only update should NOT record movement', async () => {
        materialRepo.findOneBy.mockResolvedValue({ ...mockMaterial });
        
        await service.update('1', { name: 'Updated Name' } as any);
        
        expect(materialRepo.update).toHaveBeenCalled();
        // Check if movementRepo.save was called. Since beforeEach resets, we check calls count.
        expect(movementRepo.save).not.toHaveBeenCalled();
    });

    it('Flow 3: Stock update should record exactly one movement with old/new values', async () => {
        materialRepo.findOneBy
            .mockResolvedValueOnce({ ...mockMaterial }) // For update logic
            .mockResolvedValueOnce({ ...mockMaterial, remainingWeightGrams: 800 }); // For after-update findOne

        await service.update('1', { remainingWeightGrams: 800 } as any);
        
        expect(movementRepo.save).toHaveBeenCalledTimes(1);
        const mov = (movementRepo.save as jest.Mock).mock.calls[0][0];
        expect(mov.oldValue).toBe(1000);
        expect(mov.newValue).toBe(800);
        expect(mov.quantity).toBe(200);
        expect(mov.type).toBe('OUT');
    });

    it('Flow 4: Increase stock should record IN movement', async () => {
        materialRepo.findOneBy
            .mockResolvedValueOnce({ ...mockMaterial })
            .mockResolvedValueOnce({ ...mockMaterial, remainingWeightGrams: 1500 });

        await service.update('1', { remainingWeightGrams: 1500 } as any);
        
        const mov = (movementRepo.save as jest.Mock).mock.calls[0][0];
        expect(mov.type).toBe('IN');
        expect(mov.quantity).toBe(500);
    });
});
