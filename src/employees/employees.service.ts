import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './entities/employee.entity';
import { SupabaseService } from '../common/supabase/supabase.service';
import { BusinessesService } from '../businesses/businesses.service';
import { UsersService } from '../users/users.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction } from '../audit/entities/audit-log.entity';

import { PlanUsageService } from '../businesses/plan-usage.service';

@Injectable()
export class EmployeesService {
    constructor(
        @InjectRepository(Employee)
        private readonly employeeRepository: Repository<Employee>,
        private readonly supabaseService: SupabaseService,
        private readonly businessesService: BusinessesService,
        private readonly usersService: UsersService,
        private readonly planUsageService: PlanUsageService,
        private readonly auditService: AuditService,
    ) { }

    async findAll(businessId: string, active?: boolean): Promise<Employee[]> {
        const where: any = { businessId };

        if (active !== undefined) {
            where.active = active;
        }

        return this.employeeRepository.find({
            where,
            order: { firstName: 'ASC' },
        });
    }

    async findOne(id: string, businessId: string): Promise<Employee> {
        const employee = await this.employeeRepository.findOneBy({ id, businessId });
        if (!employee) {
            throw new NotFoundException('Empleado no encontrado');
        }
        return employee;
    }

    async create(businessId: string, data: any): Promise<Employee> {
        await this.planUsageService.ensureEmployeeCreationAllowed(businessId);
        
        const { email, firstName, lastName, role } = data;
        const supabase = this.supabaseService.getClient();

        // 1. Buscar si el usuario ya existe en Supabase Auth por email
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        let userFound = (users as any[]).find(u => u.email === email);
        let userId: string;
        let mustChange = false;

        if (!userFound) {
            console.log(`[EmployeesService] Creando nuevo usuario en Supabase para ${email}`);
            // 2. Si no existe, crearlo con password temporal 12345
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email,
                password: '12345',
                email_confirm: true,
                user_metadata: { full_name: `${firstName} ${lastName || ''}`.trim() }
            });

            if (createError) throw createError;
            userId = newUser.user.id;
            mustChange = true;
            
            // Send invitation if needed
            // await supabase.auth.admin.inviteUserByEmail(email); 
        } else {
            console.log(`[EmployeesService] Usuario ya existe en Supabase: ${email}`);
            userId = userFound.id;
        }

        // 4. Asegurar que el usuario exista en nuestra tabla de usuarios local
        const localUser = await this.usersService.findOrCreate(userId, email, `${firstName} ${lastName || ''}`.trim());
        
        // Si el usuario es nuevo, activamos la bandera de cambio de contraseña
        if (mustChange) {
            await this.usersService.update(userId, { mustChangePassword: true } as any);
        }

        // 5. Asociar al negocio (BusinessMembership)
        await this.businessesService.addMemberToBusiness(userId, businessId, role || 'MEMBER');

        // 6. Crear el registro de Empleado
        const employee = this.employeeRepository.create({
            ...data,
            businessId,
        });
        const result = await this.employeeRepository.save(employee);
        const savedEmployee = Array.isArray(result) ? result[0] : result;

        await this.auditService.log(
            AuditAction.RESOURCE_CREATED,
            'EMPLOYEE',
            savedEmployee.id,
            businessId,
            null,
            { email: savedEmployee.email, role: savedEmployee.role }
        );

        return savedEmployee;
    }

    async update(id: string, businessId: string, data: any): Promise<Employee> {
        await this.findOne(id, businessId);
        await this.employeeRepository.update(id, data);
        return this.findOne(id, businessId);
    }

    async remove(id: string, businessId: string): Promise<void> {
        const employee = await this.findOne(id, businessId);
        employee.active = false;
        await this.employeeRepository.save(employee);
    }
}
