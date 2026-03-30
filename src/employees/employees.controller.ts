import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';

@Controller('employees')
@UseGuards(SupabaseAuthGuard)
export class EmployeesController {
    constructor(private readonly employeesService: EmployeesService) { }

    @Post()
    create(@Query('businessId') businessId: string, @Body() data: any) {
        return this.employeesService.create(businessId, data);
    }

    @Get()
    findAll(
        @Query('businessId') businessId: string,
        @Query('active') active?: string
    ) {
        const isActive = active !== undefined ? active === 'true' : undefined;
        return this.employeesService.findAll(businessId, isActive);
    }

    @Get(':id')
    findOne(@Param('id', ParseUUIDPipe) id: string, @Query('businessId') businessId: string) {
        return this.employeesService.findOne(id, businessId);
    }

    @Patch(':id')
    update(@Param('id', ParseUUIDPipe) id: string, @Query('businessId') businessId: string, @Body() data: any) {
        return this.employeesService.update(id, businessId, data);
    }

    @Delete(':id')
    remove(@Param('id', ParseUUIDPipe) id: string, @Query('businessId') businessId: string) {
        return this.employeesService.remove(id, businessId);
    }
}
