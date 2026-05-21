import { Controller, Get, Query, UseGuards, BadRequestException } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessAccessGuard } from '../businesses/guards/business-access.guard';

@Controller('reports')
@UseGuards(SupabaseAuthGuard, BusinessAccessGuard)
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Get('summary')
    getSummary(@Query('businessId') businessId: string) {
        if (!businessId) {
            throw new BadRequestException('El ID del negocio es obligatorio');
        }
        return this.reportsService.getStats(businessId);
    }
}
