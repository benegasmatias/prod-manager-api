import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Request } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto, CreateProgressDto, UpdateJobDto } from './dto/job.dto';
import { JobStatus } from '../common/enums';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';

@Controller('jobs')
@UseGuards(SupabaseAuthGuard)
export class JobsController {
    constructor(private readonly jobsService: JobsService) { }

    @Post()
    create(@Body() createJobDto: CreateJobDto, @Request() req: any) {
        return this.jobsService.create(createJobDto, req.user.id);
    }

    @Get('queue')
    getQueue(@Query('businessId') businessId?: string) {
        return this.jobsService.getQueue(businessId);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.jobsService.findOne(id);
    }

    @Patch(':id/status')
    updateStatus(
        @Param('id') id: string,
        @Body('status') status: JobStatus,
        @Body('notes') notes?: string,
        @Request() req?: any,
    ) {
        return this.jobsService.updateStatus(id, status, notes, req?.user?.id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateJobDto: UpdateJobDto, @Request() req: any) {
        return this.jobsService.update(id, updateJobDto, req.user.id);
    }

    @Post(':id/progress')
    addProgress(@Param('id') id: string, @Body() createProgressDto: CreateProgressDto, @Request() req: any) {
        return this.jobsService.addProgress(id, createProgressDto, req.user.id);
    }
}
