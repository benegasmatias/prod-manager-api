import { Repository } from 'typeorm';
import { Printer } from './entities/printer.entity';
import { PrinterStatus } from '../common/enums';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { OrdersService } from '../orders/orders.service';
import { JobsService } from '../jobs/jobs.service';
export declare class PrintersService {
    private readonly printerRepository;
    private readonly ordersService;
    private readonly jobsService;
    constructor(printerRepository: Repository<Printer>, ordersService: OrdersService, jobsService: JobsService);
    assignOrder(printerId: string, orderId: string): Promise<Printer>;
    release(printerId: string): Promise<Printer>;
    create(createPrinterDto: CreatePrinterDto): Promise<Printer>;
    findAll(businessId?: string): Promise<Printer[]>;
    findOne(id: string): Promise<Printer>;
    updateStatus(id: string, status: PrinterStatus): Promise<Printer>;
}
