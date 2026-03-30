import { Repository } from 'typeorm';
import { Machine } from './entities/machine.entity';
import { MachineStatus } from '../common/enums';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { OrdersService } from '../orders/orders.service';
import { JobsService } from '../jobs/jobs.service';
export declare class MachinesService {
    private readonly machineRepository;
    private readonly ordersService;
    private readonly jobsService;
    constructor(machineRepository: Repository<Machine>, ordersService: OrdersService, jobsService: JobsService);
    assignOrder(machineId: string, orderId: string, materialId?: string, businessId?: string, metadata?: any): Promise<Machine>;
    release(machineId: string, businessId?: string): Promise<Machine>;
    create(createDto: CreateMachineDto): Promise<Machine>;
    findAll(businessId?: string, onlyActive?: boolean, page?: number, pageSize?: number): Promise<{
        data: Machine[];
        total: number;
    }>;
    findOne(id: string, businessId?: string): Promise<Machine>;
    update(id: string, updateDto: UpdateMachineDto, businessId?: string): Promise<Machine>;
    updateStatus(id: string, status: MachineStatus, businessId?: string): Promise<Machine>;
    deactivate(id: string, businessId?: string): Promise<void>;
}
