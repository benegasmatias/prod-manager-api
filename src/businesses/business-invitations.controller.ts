import { Controller, Get, Post, Body, Param, UseGuards, Request, NotFoundException, BadRequestException } from '@nestjs/common';
import { BusinessInvitationsService } from './business-invitations.service';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { BusinessRole } from '../common/enums';
import { RequireBusinessRole } from './decorators/require-business-role.decorator';
import { BusinessRoleGuard } from './guards/business-role.guard';

@Controller('business-invitations')
export class BusinessInvitationsController {
    constructor(private readonly invitationsService: BusinessInvitationsService) { }

    // 1. Obtener info de la invitación por token (Público, para mostrar el nombre del negocio)
    @Get('by-token/:token')
    async getInfo(@Param('token') token: string) {
        const invitation = await this.invitationsService.findByToken(token);
        return {
            id: invitation.id,
            businessName: invitation.business?.name,
            businessCategory: invitation.business?.category,
            role: invitation.role,
            invitedBy: invitation.invitedByUser?.fullName || invitation.invitedByUser?.email,
            status: invitation.status,
            expiresAt: invitation.expiresAt,
            email: invitation.email,
        };
    }

    // 2. Aceptar invitación
    @Post(':token/accept')
    @UseGuards(SupabaseAuthGuard)
    async accept(@Param('token') token: string, @Request() req) {
        const user = req.user;
        return this.invitationsService.acceptInvitation(token, user.id, user.email);
    }

    // 3. Rechazar invitación
    @Post(':token/reject')
    @UseGuards(SupabaseAuthGuard)
    async reject(@Param('token') token: string, @Request() req) {
        const user = req.user;
        return this.invitationsService.rejectInvitation(token, user.email);
    }

    // 4. Verificar estado de invitación por email
    @Get('check/:businessId')
    @UseGuards(SupabaseAuthGuard)
    async checkStatus(
        @Param('businessId') businessId: string,
        @Request() req
    ) {
        const email = req.query.email as string;
        if (!email) throw new BadRequestException('Email es requerido');
        return this.invitationsService.checkStatus(businessId, email);
    }

    @Get('me')
    @UseGuards(SupabaseAuthGuard)
    async getMyInvitations(@Request() req) {
        return this.invitationsService.findMyInvitations(req.user.email);
    }
}
