import { Repository } from 'typeorm';
import { Printer } from './entities/printer.entity';
import { PrinterStatus } from '../common/enums';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';
import { OrdersService } from '../orders/orders.service';
import { JobsService } from '../jobs/jobs.service';
export declare class PrintersService {
    private readonly printerRepository;
    private readonly ordersService;
    private readonly jobsService;
    constructor(printerRepository: Repository<Printer>, ordersService: OrdersService, jobsService: JobsService);
    assignOrder(printerId: string, orderId: string, materialId?: string, businessId?: string, metadata?: any): Promise<Printer>;
    release(printerId: string, businessId?: string): Promise<Printer>;
    create(createDto: CreatePrinterDto): Promise<Printer>;
    findAll(businessId?: string, onlyActive?: boolean): Promise<Printer[]>;
    findOne(id: string, businessId?: string): Promise<Printer>;
    update(id: string, updateDto: UpdatePrinterDto, businessId?: string): Promise<Printer>;
    updateStatus(id: string, status: PrinterStatus, businessId?: string): Promise<Printer>;
    deactivate(id: string, businessId?: string): Promise<void>;
}
