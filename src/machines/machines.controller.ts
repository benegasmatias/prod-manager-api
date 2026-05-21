import { Controller, Get, Post, Patch, Body, Param, ParseUUIDPipe, UseGuards, Query, Put, Delete, Request } from '@nestjs/common';
import { MachinesService } from './machines.service';
import { AuditService } from '../audit/audit.service';
import { MachineStatus, BusinessStatus, BusinessRole } from '../common/enums';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { CreateMachineDto } from './dto/create-machine.dto';
import { UpdateMachineDto } from './dto/update-machine.dto';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';
import { BusinessStatusGuard } from '../businesses/guards/business-status.guard';
import { BusinessRoleGuard } from '../businesses/guards/business-role.guard';
import { BusinessCapabilityGuard } from '../businesses/guards/business-capability.guard';
import { AllowBusinessStatuses } from '../businesses/decorators/allow-business-statuses.decorator';
import { RequireBusinessRole } from '../businesses/decorators/require-business-role.decorator';
import { RequireCapability } from '../businesses/decorators/require-capability.decorator';

@Controller('machines')
@UseGuards(SupabaseAuthGuard, BusinessAccessGuard, BusinessRoleGuard, BusinessCapabilityGuard)
@RequireCapability('PRODUCTION_MACHINES')
export class MachinesController {
    constructor(
        private readonly printersService: MachinesService,
        private readonly auditService: AuditService
    ) { }

    @Post()
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async create(@Body() createDto: CreateMachineDto, @Request() req: any) {
        const context = this.auditService.extractContext(req);
        return this.printersService.create(createDto, context);
    }

    @Get()
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.OPERATOR)
    async findAll(
        @Query('businessId') businessId?: string,
        @Query('onlyActive') onlyActive?: string,
        @Query('page') page: string = '1',
        @Query('pageSize') pageSize: string = '50',
        @Request() req?: any
    ) {
        const active = onlyActive === 'false' ? false : true;
        const result = await this.printersService.findAll(businessId, active, Number(page), Number(pageSize));
        
        const role = req?.businessRole;
        if (role === BusinessRole.OPERATOR) {
            const items = result.data.map(m => ({
                id: m.id,
                name: m.name,
                status: m.status,
                active: m.active,
                blockedByQuota: m.blockedByQuota
            }));
            return {
                data: items,
                total: result.total
            };
        }
        return result;
    }

    @Get(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.OPERATOR)
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId') businessId?: string,
        @Request() req?: any
    ) {
        const machine = await this.printersService.findOne(id, businessId);
        const role = req?.businessRole;
        if (role === BusinessRole.OPERATOR) {
            return {
                id: machine.id,
                name: machine.name,
                status: machine.status,
                active: machine.active,
                blockedByQuota: machine.blockedByQuota
            };
        }
        return machine;
    }

    @Patch(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDto: UpdateMachineDto,
        @Request() req: any,
        @Query('businessId') businessId?: string,
    ) {
        const context = this.auditService.extractContext(req);
        return this.printersService.update(id, updateDto, businessId, context);
    }

    @Patch(':id/status')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('status') status: MachineStatus,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.updateStatus(id, status, businessId);
    }

    @Post(':id/assign-order')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async assignOrder(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('orderId', ParseUUIDPipe) orderId: string,
        @Body('orderItemId') orderItemId?: string,
        @Body('materialId') materialId?: string,
        @Body('metadata') metadata?: any,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.assignOrder(id, orderId, orderItemId, materialId, businessId, metadata);
    }

    @Post(':id/release')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async release(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.release(id, businessId);
    }

    @Delete(':id')
    @UseGuards(BusinessStatusGuard)
    @AllowBusinessStatuses(BusinessStatus.ACTIVE)
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async remove(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId') businessId?: string,
    ) {
        return this.printersService.deactivate(id, businessId);
    }
}
