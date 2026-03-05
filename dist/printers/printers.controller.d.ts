import { PrintersService } from './printers.service';
import { PrinterStatus } from '../common/enums';
import { CreatePrinterDto } from './dto/create-printer.dto';
export declare class PrintersController {
    private readonly printersService;
    constructor(printersService: PrintersService);
    create(createPrinterDto: CreatePrinterDto): Promise<import("./entities/printer.entity").Printer>;
    findAll(businessId?: string): Promise<import("./entities/printer.entity").Printer[]>;
    findOne(id: string): Promise<import("./entities/printer.entity").Printer>;
    updateStatus(id: string, status: PrinterStatus): Promise<import("./entities/printer.entity").Printer>;
    assignOrder(id: string, orderId: string): Promise<import("./entities/printer.entity").Printer>;
    release(id: string): Promise<import("./entities/printer.entity").Printer>;
}
