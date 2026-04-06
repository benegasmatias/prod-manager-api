import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
export declare class CustomersController {
    private readonly customersService;
    constructor(customersService: CustomersService);
    create(req: any, createCustomerDto: CreateCustomerDto): Promise<import("./entities/customer.entity").Customer>;
    findAll(req: any, businessId: string, q?: string, page?: number, limit?: number): Promise<{
        items: {
            id: string;
            name: string;
            phone: string;
            email: string;
            notes: string;
            createdAt: Date;
            totalOrders: any;
        }[];
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
