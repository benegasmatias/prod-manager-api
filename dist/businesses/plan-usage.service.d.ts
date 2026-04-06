import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { User } from '../users/entities/user.entity';
import { Machine } from '../machines/entities/machine.entity';
import { Employee } from '../employees/entities/employee.entity';
import { AuditService } from '../audit/audit.service';
import { BusinessSubscription } from './entities/business-subscription.entity';
export declare class PlanUsageService {
    private readonly businessRepository;
    private readonly userRepository;
    private readonly machineRepository;
    private readonly employeeRepository;
    private readonly subscriptionRepository;
    private readonly auditService;
    constructor(businessRepository: Repository<Business>, userRepository: Repository<User>, machineRepository: Repository<Machine>, employeeRepository: Repository<Employee>, subscriptionRepository: Repository<BusinessSubscription>, auditService: AuditService);
    ensureBusinessCreationAllowed(userId: string): Promise<void>;
    ensureMachineCreationAllowed(businessId: string): Promise<void>;
    ensureEmployeeCreationAllowed(businessId: string): Promise<void>;
    getBusinessUsage(businessId: string): Promise<any>;
    private throwQuotaException;
}
