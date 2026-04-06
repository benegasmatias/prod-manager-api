import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { SupabaseService } from '../common/supabase/supabase.service';
import { BusinessesService } from '../businesses/businesses.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { PlanUsageService } from '../businesses/plan-usage.service';
export declare class EmployeesService {
    private readonly employeeRepository;
    private readonly supabaseService;
    private readonly businessesService;
    private readonly usersService;
    private readonly planUsageService;
    private readonly auditService;
    constructor(employeeRepository: Repository<Employee>, supabaseService: SupabaseService, businessesService: BusinessesService, usersService: UsersService, planUsageService: PlanUsageService, auditService: AuditService);
    findAll(businessId: string, active?: boolean): Promise<Employee[]>;
    findOne(id: string, businessId: string): Promise<Employee>;
    create(businessId: string, data: any): Promise<Employee>;
    update(id: string, businessId: string, data: any): Promise<Employee>;
    remove(id: string, businessId: string): Promise<void>;
}
