import { Injectable, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { User } from '../users/entities/user.entity';
import { Machine } from '../machines/entities/machine.entity';
import { Employee } from '../employees/entities/employee.entity';
import { PLAN_LIMITS, PlanLimits } from './config/plan-limits.config';

@Injectable()
export class PlanUsageService {
    constructor(
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(Machine)
        private readonly machineRepository: Repository<Machine>,
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
    ) { }

    async ensureBusinessCreationAllowed(userId: string): Promise<void> {
        const user = await this.userRepository.findOneBy({ id: userId });
        const userPlan = user?.plan || 'FREE';
        const limits = PLAN_LIMITS[userPlan];

        const businessCount = await this.businessRepository.countBy({ 
            memberships: { userId } as any // Simplificado, idealmente vía query builder
        });

        if (businessCount >= limits.maxBusinessesPerUser) {
            this.throwQuotaException('BUSINESSES', userPlan, limits.maxBusinessesPerUser, businessCount);
        }
    }

    async ensureMachineCreationAllowed(businessId: string): Promise<void> {
        const business = await this.businessRepository.findOneBy({ id: businessId });
        const plan = business?.plan || 'FREE';
        const limits = PLAN_LIMITS[plan];

        const machineCount = await this.machineRepository.countBy({ businessId, active: true });

        if (machineCount >= limits.maxMachinesPerBusiness) {
            this.throwQuotaException('MACHINES', plan, limits.maxMachinesPerBusiness, machineCount);
        }
    }

    async ensureEmployeeCreationAllowed(businessId: string): Promise<void> {
        const business = await this.businessRepository.findOneBy({ id: businessId });
        const plan = business?.plan || 'FREE';
        const limits = PLAN_LIMITS[plan];

        const employeeCount = await this.employeeRepository.countBy({ businessId, active: true });

        if (employeeCount >= limits.maxEmployeesPerBusiness) {
            this.throwQuotaException('EMPLOYEES', plan, limits.maxEmployeesPerBusiness, employeeCount);
        }
    }

    async getBusinessUsage(businessId: string): Promise<any> {
        const business = await this.businessRepository.findOneBy({ id: businessId });
        const plan = business?.plan || 'FREE';
        const limits = PLAN_LIMITS[plan];

        const [machines, employees] = await Promise.all([
            this.machineRepository.countBy({ businessId, active: true }),
            this.employeeRepository.countBy({ businessId, active: true }),
        ]);

        return {
            plan,
            limits,
            usage: {
                MACHINES: machines,
                EMPLOYEES: employees,
            },
            remaining: {
                MACHINES: limits.maxMachinesPerBusiness - machines,
                EMPLOYEES: limits.maxEmployeesPerBusiness - employees,
            }
        };
    }

    private throwQuotaException(resource: string, plan: string, limit: number, usage: number) {
        const suggestedPlan = plan === 'FREE' ? 'PRO' : 'ENTERPRISE';

        throw new ForbiddenException({
            statusCode: 403,
            message: `Límite excedido para ${resource} en plan ${plan}. (${usage}/${limit})`,
            errorCode: 'QUOTA_EXCEEDED',
            metadata: {
                resource,
                plan,
                limit,
                usage,
                remaining: 0,
                suggestedPlan
            }
        });
    }
}
