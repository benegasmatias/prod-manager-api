import { MachinesService } from './machines.service';
import { MachineStatus } from '../common/enums';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
export declare class MachinesController {
    private readonly printersService;
    constructor(printersService: MachinesService);
    create(createDto: CreateMachineDto): Promise<import("./entities/machine.entity").Machine>;
    findAll(businessId?: string, onlyActive?: string, page?: string, pageSize?: string): Promise<{
        data: import("./entities/machine.entity").Machine[];
        total: number;
    }>;
    findOne(id: string, businessId?: string): Promise<import("./entities/machine.entity").Machine>;
    update(id: string, updateDto: UpdateMachineDto, businessId?: string): Promise<import("./entities/machine.entity").Machine>;
    updateStatus(id: string, status: MachineStatus, businessId?: string): Promise<import("./entities/machine.entity").Machine>;
    assignOrder(id: string, orderId: string, materialId?: string, metadata?: any, businessId?: string): Promise<import("./entities/machine.entity").Machine>;
    release(id: string, businessId?: string): Promise<import("./entities/machine.entity").Machine>;
    remove(id: string, businessId?: string): Promise<void>;
}
