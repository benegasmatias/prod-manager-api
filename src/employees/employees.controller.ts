import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';
import { BusinessRoleGuard } from '../businesses/guards/business-role.guard';
import { RequireBusinessRole } from '../businesses/decorators/require-business-role.decorator';
import { BusinessRole } from '../common/enums';

@Controller('employees')
@UseGuards(SupabaseAuthGuard, BusinessAccessGuard, BusinessRoleGuard)
export class EmployeesController {
    constructor(private readonly employeesService: EmployeesService) { }

    @Post()
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    create(@Query('businessId') businessId: string, @Body() data: any) {
        return this.employeesService.create(businessId, data);
    }

    @Get()
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    findAll(
        @Query('businessId') businessId: string,
        @Query('active') active?: string
    ) {
        const isActive = active !== undefined ? active === 'true' : undefined;
        return this.employeesService.findAll(businessId, isActive);
    }

    @Get(':id')
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    findOne(@Param('id', ParseUUIDPipe) id: string, @Query('businessId') businessId: string) {
        return this.employeesService.findOne(id, businessId);
    }

    @Patch(':id')
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    update(@Param('id', ParseUUIDPipe) id: string, @Query('businessId') businessId: string, @Body() data: any) {
        return this.employeesService.update(id, businessId, data);
    }

    @Delete(':id')
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    remove(@Param('id', ParseUUIDPipe) id: string, @Query('businessId') businessId: string) {
        return this.employeesService.remove(id, businessId);
    }
}
