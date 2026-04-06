import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessTemplateDto } from './dto/business-template.dto';

@Controller('business-templates')
@UseGuards(SupabaseAuthGuard)
export class BusinessTemplatesController {
    constructor(private readonly businessesService: BusinessesService) { }

    @Get()
    async getTemplates(@Request() req): Promise<BusinessTemplateDto[]> {
        return await this.businessesService.getTemplates(req.user.id);
    }
}
