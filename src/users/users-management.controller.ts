import { Controller, Patch, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService } from './users.service';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { UpdateDefaultBusinessDto } from './dto/update-default-business.dto';

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersManagementController {
    constructor(private readonly usersService: UsersService) { }

    @Patch('default-business')
    async updateDefaultBusiness(@Request() req, @Body() dto: UpdateDefaultBusinessDto) {
        return this.usersService.setDefaultBusiness(req.user.id, dto.businessId);
    }
}
