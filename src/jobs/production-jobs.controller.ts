import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, ParseUUIDPipe, Request } from '@nestjs/common';
import { ProductionJobService } from './production-job.service';
import { CreateProductionJobsDto, AssignResourcesDto, UpdateJobStatusDto, UpdateJobPriorityDto, UpdateJobStageDto, AssignMaterialDto } from './dto/production-job.dto';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessRoleGuard } from '../businesses/guards/business-role.guard';
import { BusinessCapabilityGuard } from '../businesses/guards/business-capability.guard';
import { RequireBusinessRole } from '../businesses/decorators/require-business-role.decorator';
import { RequireCapability } from '../businesses/decorators/require-capability.decorator';
import { BusinessRole } from '../common/enums';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';

@Controller('production-jobs')
@UseGuards(SupabaseAuthGuard, BusinessAccessGuard, BusinessRoleGuard, BusinessCapabilityGuard)
@RequireCapability('PRODUCTION_MANAGEMENT')
export class ProductionJobsController {
    constructor(private readonly jobService: ProductionJobService) { }

    @Post()
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.SALES)
    async createJobs(
        @Query('businessId', ParseUUIDPipe) businessId: string, 
        @Body() createDto: CreateProductionJobsDto
    ) {
        return this.jobService.createJobsForOrder(businessId, createDto.orderId, createDto.itemIds);
    }

    @Get()
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.SALES, BusinessRole.OPERATOR, BusinessRole.VIEWER)
    async findAll(
        @Query('businessId', ParseUUIDPipe) businessId: string, 
        @Query() filters: any
    ) {
        return this.jobService.findAll(businessId, filters);
    }

    @Get(':id')
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.SALES, BusinessRole.OPERATOR, BusinessRole.VIEWER)
    async findOne(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId', ParseUUIDPipe) businessId: string
    ) {
        return this.jobService.findOne(businessId, id);
    }

    @Patch(':id/assign')
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.OPERATOR)
    async assign(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId', ParseUUIDPipe) businessId: string,
        @Body() assignDto: AssignResourcesDto
    ) {
        return this.jobService.assignResources(businessId, id, assignDto);
    }

    @Patch(':id/resources')
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.OPERATOR)
    async assignResources(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId', ParseUUIDPipe) businessId: string,
        @Body() assignDto: AssignResourcesDto
    ) {
        return this.jobService.assignResources(businessId, id, assignDto);
    }

    @Patch(':id/priority')
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN)
    async updatePriority(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId', ParseUUIDPipe) businessId: string,
        @Body() priorityDto: UpdateJobPriorityDto
    ) {
        return this.jobService.updatePriority(businessId, id, priorityDto.priority);
    }

    @Patch(':id/status')
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.OPERATOR)
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId', ParseUUIDPipe) businessId: string,
        @Body() statusDto: UpdateJobStatusDto
    ) {
        return this.jobService.updateStatus(businessId, id, statusDto.status);
    }

    @Patch(':id/stage')
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.OPERATOR)
    async updateStage(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId', ParseUUIDPipe) businessId: string,
        @Body() stageDto: UpdateJobStageDto
    ) {
        return this.jobService.updateStage(businessId, id, stageDto.stage);
    }

    @Post(':id/materials')
    @RequireBusinessRole(BusinessRole.OWNER, BusinessRole.BUSINESS_ADMIN, BusinessRole.OPERATOR)
    async addMaterial(
        @Param('id', ParseUUIDPipe) id: string,
        @Query('businessId', ParseUUIDPipe) businessId: string,
        @Body() materialDto: AssignMaterialDto
    ) {
        return this.jobService.assignMaterial(businessId, id, materialDto);
    }
}
