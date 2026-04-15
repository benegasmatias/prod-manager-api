import { Controller, Get, Patch, Body, Param, UseGuards, Request, ForbiddenException, Post, Delete } from '@nestjs/common';

import { AdminService } from './admin.service';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

/**
 * Super Admin Guard (Inline for simple project for now, 
 * but checking globalRole on request.user)
 */
import { GlobalAdminGuard } from '../users/guards/global-admin.guard';

@UseGuards(SupabaseAuthGuard)
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // Endpoint temporal para inicializar el primer administrador
    // No usa GlobalAdminGuard porque es el paso de bootstrap
    @Patch('init')
    async initAdmin(@Request() req) {
        return this.adminService.bootstrapAdmin(req.user.id);
    }

    // ──────────────── Plans CRUD ────────────────

    @UseGuards(GlobalAdminGuard)
    @Get('plans')
    async getPlans(@Request() req) {
        return this.adminService.findAllPlans();
    }

    @UseGuards(GlobalAdminGuard)
    @Get('plans/:id')
    async getPlan(@Request() req, @Param('id') id: string) {
        return this.adminService.findPlanById(id);
    }

    @UseGuards(GlobalAdminGuard)
    @Post('plans')
    async createPlan(@Request() req, @Body() dto: CreatePlanDto) {
        return this.adminService.createPlan(dto);
    }

    @UseGuards(GlobalAdminGuard)
    @Patch('plans/:id')
    async updatePlan(@Request() req, @Param('id') id: string, @Body() dto: UpdatePlanDto) {
        return this.adminService.updatePlan(id, dto);
    }

    @UseGuards(GlobalAdminGuard)
    @Delete('plans/:id')
    async deletePlan(@Request() req, @Param('id') id: string) {
        return this.adminService.deletePlan(id);
    }


    // Configuración de Roles
    @UseGuards(GlobalAdminGuard)
    @Get('roles')
    async getRoleConfigs(@Request() req) {
        return this.adminService.findAllRoleConfigs();
    }

    @UseGuards(GlobalAdminGuard)
    @Patch('roles/:role')
    async updateRoleConfig(@Request() req, @Param('role') role: string, @Body() body: any) {
        return this.adminService.updateRoleConfig(role, body);
    }

    @UseGuards(GlobalAdminGuard)
    @Post('notifications')
    async sendNotification(@Request() req, @Body() body: any) {
        return this.adminService.sendNotification(body);
    }



    // Negocios
    @UseGuards(GlobalAdminGuard)
    @Get('businesses')
    async getAllBusinesses(@Request() req) {
        return this.adminService.findAllBusinesses();
    }

    @UseGuards(GlobalAdminGuard)
    @Get('businesses/:id')
    async getBusiness(@Request() req, @Param('id') id: string) {
        return this.adminService.findBusinessById(id);
    }

    @UseGuards(GlobalAdminGuard)
    @Patch('businesses/:id/status')
    async updateBusinessStatus(@Request() req, @Param('id') id: string, @Body() body: { status: string }) {
        return this.adminService.updateBusinessStatus(id, body.status, req.user.id);
    }

    @UseGuards(GlobalAdminGuard)
    @Patch('businesses/:id/subscription')
    async updateBusinessSubscription(
        @Request() req,
        @Param('id') id: string,
        @Body() body: { planId: string, expiresAt: string }
    ) {
        return this.adminService.updateBusinessSubscription(id, body.planId, new Date(body.expiresAt), req.user.id);
    }

    @UseGuards(GlobalAdminGuard)
    @Patch('businesses/:id/payment')
    async registerPayment(@Request() req, @Param('id') id: string, @Body() body: { months: number }) {
        return this.adminService.registerPayment(id, body.months || 1, req.user.id);
    }


    // Usuarios
    @UseGuards(GlobalAdminGuard)
    @Get('users')
    async getAllUsers(@Request() req) {
        return this.adminService.findAllUsers();
    }

    @UseGuards(GlobalAdminGuard)
    @Patch('users/:id/approve')
    async approveUser(@Request() req, @Param('id') id: string) {
        return this.adminService.approveUser(id, req.user.id);
    }

    @UseGuards(GlobalAdminGuard)
    @Patch('users/:id/block')
    async blockUser(@Request() req, @Param('id') id: string) {
        return this.adminService.blockUser(id, req.user.id);
    }

    @UseGuards(GlobalAdminGuard)
    @Patch('users/:id/role')
    async updateUserRole(@Request() req, @Param('id') id: string, @Body() body: { role: string }) {
        return this.adminService.updateUserGlobalRole(id, body.role, req.user.id);
    }

    @UseGuards(GlobalAdminGuard)
    @Post('capabilities-init')
    async initializeCapabilities(@Request() req) {
        return this.adminService.initializeCapabilities();
    }

    @UseGuards(GlobalAdminGuard)
    @Post('templates/seed-retail')
    async seedRetailTemplate(@Request() req) {
        return this.adminService.seedRetailTemplate();
    }

    @UseGuards(GlobalAdminGuard)
    @Get('stats')
    async getStats(@Request() req) {
        return this.adminService.getPlatformStats();
    }
}

/**
 * Public controller for plans — no auth required (used by landing page)
 */
@Controller('plans')
export class PlansPublicController {
    constructor(private readonly adminService: AdminService) { }

    @Get()
    async getActivePlans() {
        return this.adminService.findActivePlans();
    }
}
