import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { SupabaseService } from '../common/supabase/supabase.service';
import { BusinessesService } from '../businesses/businesses.service';
import { UsersService } from '../users/users.service';
export declare class EmployeesService {
    private readonly employeeRepository;
    private readonly supabaseService;
    private readonly businessesService;
    private readonly usersService;
    constructor(employeeRepository: Repository<Employee>, supabaseService: SupabaseService, businessesService: BusinessesService, usersService: UsersService);
    findAll(businessId: string, active?: boolean): Promise<Employee[]>;
    findOne(id: string, businessId: string): Promise<Employee>;
    create(businessId: string, data: any): Promise<Employee>;
    update(id: string, businessId: string, data: any): Promise<Employee>;
    remove(id: string, businessId: string): Promise<void>;
}
