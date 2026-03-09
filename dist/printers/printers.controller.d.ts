import { PrintersService } from './printers.service';
import { PrinterStatus } from '../common/enums';
import { CreatePrinterDto } from './dto/create-printer.dto';
import { UpdatePrinterDto } from './dto/update-printer.dto';
export declare class PrintersController {
    private readonly printersService;
    constructor(printersService: PrintersService);
    create(createDto: CreatePrinterDto): Promise<import("./entities/printer.entity").Printer>;
    findAll(businessId?: string, onlyActive?: string): Promise<import("./entities/printer.entity").Printer[]>;
    findOne(id: string, businessId?: string): Promise<import("./entities/printer.entity").Printer>;
    update(id: string, updateDto: UpdatePrinterDto, businessId?: string): Promise<import("./entities/printer.entity").Printer>;
    updateStatus(id: string, status: PrinterStatus, businessId?: string): Promise<import("./entities/printer.entity").Printer>;
    assignOrder(id: string, orderId: string, materialId?: string, metadata?: any, businessId?: string): Promise<import("./entities/printer.entity").Printer>;
    release(id: string, businessId?: string): Promise<import("./entities/printer.entity").Printer>;
    remove(id: string, businessId?: string): Promise<void>;
}
