import { Controller, Get, Post, Body, UseGuards, Request, Param, Patch } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { CreateBusinessFromTemplateDto } from './dto/create-business-from-template.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Controller('businesses')
@UseGuards(SupabaseAuthGuard)
export class BusinessesController {
    constructor(private readonly businessesService: BusinessesService) { }

    @Get()
    async findAll(@Request() req) {
        return this.businessesService.findUserBusinesses(req.user.id);
    }

    @Get('/:id')
    async findOne(@Request() req, @Param('id') id: string) {
        return this.businessesService.findOne(req.user.id, id);
    }

    @Get(':id/dashboard-summary')
    async getSummary(@Request() req, @Param('id') id: string) {
        return this.businessesService.getDashboardSummary(req.user.id, id);
    }

    @Get('test-reload')
    async testReload() {
        return { message: "RELOAD_SUCCESS_OK_v1", time: new Date().toISOString() };
    }

    @Post()
    async create(@Request() req, @Body() createDto: CreateBusinessFromTemplateDto) {
        return this.businessesService.createFromTemplate(req.user.id, createDto);
    }

    @Patch('/:id')
    async update(@Request() req, @Param('id') id: string, @Body() updateDto: UpdateBusinessDto) {
        return this.businessesService.update(req.user.id, id, updateDto);
    }
}
