import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
export declare class EmployeesService {
    private readonly employeeRepository;
    constructor(employeeRepository: Repository<Employee>);
    findAll(businessId: string, active?: boolean): Promise<Employee[]>;
    findOne(id: string, businessId: string): Promise<Employee>;
    create(businessId: string, data: any): Promise<Employee>;
    update(id: string, businessId: string, data: any): Promise<Employee>;
    remove(id: string, businessId: string): Promise<void>;
}
