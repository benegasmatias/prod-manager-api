import { EmployeesService } from './employees.service';
export declare class EmployeesController {
    private readonly employeesService;
    constructor(employeesService: EmployeesService);
    create(businessId: string, data: any): Promise<import("./entities/employee.entity").Employee>;
    findAll(businessId: string, active?: string): Promise<import("./entities/employee.entity").Employee[]>;
    findOne(id: string, businessId: string): Promise<import("./entities/employee.entity").Employee>;
    update(id: string, businessId: string, data: any): Promise<import("./entities/employee.entity").Employee>;
    remove(id: string, businessId: string): Promise<void>;
}
