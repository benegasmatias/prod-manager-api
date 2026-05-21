import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';
import { BusinessRoleGuard } from '../businesses/guards/business-role.guard';
import { RequireBusinessRole } from '../businesses/decorators/require-business-role.decorator';
import { BusinessRole } from '../common/enums';
import { Request } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';

@Controller('employees')
@UseGuards(SupabaseAuthGuard, BusinessAccessGuard, BusinessRoleGuard)
export class EmployeesController {
    constructor(
        private readonly employeesService: EmployeesService,
        private readonly auditService: AuditService
    ) { }

    @Post()
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    create(@Query('businessId') businessId: string, @Body() data: any, @Request() req: any) {
        const context = this.auditService.extractContext(req);
        return this.employeesService.create(businessId, data, context);
    }

    @Get()
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.SALES, BusinessRole.OPERATOR)
    async findAll(
        @Query('businessId') businessId: string,
        @Query('active') active?: string,
        @Request() req?: any
    ) {
        const isActive = active !== undefined ? active === 'true' : undefined;
        const employees = await this.employeesService.findAll(businessId, isActive);
        
        const role = req?.businessRole;
        if (role === BusinessRole.SALES || role === BusinessRole.OPERATOR) {
            return employees.map(emp => ({
                id: emp.id,
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email,
                role: emp.role,
                active: emp.active,
            }));
        }
        return employees;
    }

    @Get(':id')
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.SALES, BusinessRole.OPERATOR)
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId') businessId: string,
        @Request() req?: any
    ) {
        const employee = await this.employeesService.findOne(id, businessId);
        const role = req?.businessRole;
        if (role === BusinessRole.SALES || role === BusinessRole.OPERATOR) {
            return {
                id: employee.id,
                firstName: employee.firstName,
                lastName: employee.lastName,
                email: employee.email,
                role: employee.role,
                active: employee.active,
            };
        }
        return employee;
    }

    @Patch(':id')
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    update(
        @Param('id', ParseUUIDPipe) id: string, 
        @Query('businessId') businessId: string, 
        @Body() data: any,
        @Request() req: any
    ) {
        const context = this.auditService.extractContext(req);
        return this.employeesService.update(id, businessId, data, context);
    }

    @Delete(':id')
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    remove(@Param('id', ParseUUIDPipe) id: string, @Query('businessId') businessId: string) {
        return this.employeesService.remove(id, businessId);
    }
}
