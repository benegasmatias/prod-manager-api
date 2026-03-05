import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { BusinessesService } from '../businesses/businesses.service';
export declare class CustomersController {
    private readonly customersService;
    private readonly businessesService;
    constructor(customersService: CustomersService, businessesService: BusinessesService);
    create(req: any, createCustomerDto: CreateCustomerDto): Promise<import("./entities/customer.entity").Customer>;
    findAll(req: any, businessId: string, q?: string, page?: number, limit?: number): Promise<{
        items: import("./entities/customer.entity").Customer[];
        total: number;
        page: number;
        limit: number;
    }>;
    findOne(id: string): Promise<import("./entities/customer.entity").Customer>;
    update(req: any, id: string, updateCustomerDto: UpdateCustomerDto): Promise<import("./entities/customer.entity").Customer>;
    remove(req: any, id: string): Promise<{
        success: boolean;
    }>;
}
