import { Controller, Get, Patch, Body, Param, UseGuards, Request, ForbiddenException, Post, Delete } from '@nestjs/common';

import { AdminService } from './admin.service';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { CreatePlanDto, UpdatePlanDto } from './dto/plan.dto';

/**
 * Super Admin Guard (Inline for simple project for now, 
 * but checking globalRole on request.user)
 */
@UseGuards(SupabaseAuthGuard)
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // Endpoint temporal para inicializar el primer administrador
    @Patch('init')
    async initAdmin(@Request() req) {
        return this.adminService.updateUserGlobalRole(req.user.id, 'SUPER_ADMIN');
    }

    private checkGlobalAdmin(req: any) {
        const userRole = req.user?.globalRole;
        if (userRole !== 'SUPER_ADMIN' && userRole !== 'ADMIN') {
            throw new ForbiddenException('No tienes permisos administrativos globales.');
        }
    }

    // ──────────────── Plans CRUD ────────────────

    @Get('plans')
    async getPlans(@Request() req) {
        this.checkGlobalAdmin(req);
        return this.adminService.findAllPlans();
    }

    @Get('plans/:id')
    async getPlan(@Request() req, @Param('id') id: string) {
        this.checkGlobalAdmin(req);
        return this.adminService.findPlanById(id);
    }

    @Post('plans')
    async createPlan(@Request() req, @Body() dto: CreatePlanDto) {
        this.checkGlobalAdmin(req);
        return this.adminService.createPlan(dto);
    }

    @Patch('plans/:id')
    async updatePlan(@Request() req, @Param('id') id: string, @Body() dto: UpdatePlanDto) {
        this.checkGlobalAdmin(req);
        return this.adminService.updatePlan(id, dto);
    }

    @Delete('plans/:id')
    async deletePlan(@Request() req, @Param('id') id: string) {
        this.checkGlobalAdmin(req);
        return this.adminService.deletePlan(id);
    }


    // Configuración de Roles
    @Get('roles')
    async getRoleConfigs(@Request() req) {
        this.checkGlobalAdmin(req);
        return this.adminService.findAllRoleConfigs();
    }

    @Patch('roles/:role')
    async updateRoleConfig(@Request() req, @Param('role') role: string, @Body() body: any) {
        this.checkGlobalAdmin(req);
        return this.adminService.updateRoleConfig(role, body);
    }

    @Post('notifications')
    async sendNotification(@Request() req, @Body() body: any) {
        this.checkGlobalAdmin(req);
        return this.adminService.sendNotification(body);
    }



    // Negocios
    @Get('businesses')
    async getAllBusinesses(@Request() req) {
        this.checkGlobalAdmin(req);
        return this.adminService.findAllBusinesses();
    }

    @Get('businesses/:id')
    async getBusiness(@Request() req, @Param('id') id: string) {
        this.checkGlobalAdmin(req);
        return this.adminService.findBusinessById(id);
    }

    @Patch('businesses/:id/status')
    async updateBusinessStatus(@Request() req, @Param('id') id: string, @Body() body: { status: string }) {
        this.checkGlobalAdmin(req);
        return this.adminService.updateBusinessStatus(id, body.status);
    }

    @Patch('businesses/:id/subscription')
    async updateBusinessSubscription(
        @Request() req,
        @Param('id') id: string,
        @Body() body: { planId: string, expiresAt: string }
    ) {
        this.checkGlobalAdmin(req);
        return this.adminService.updateBusinessSubscription(id, body.planId, new Date(body.expiresAt));
    }

    @Patch('businesses/:id/payment')
    async registerPayment(@Request() req, @Param('id') id: string, @Body() body: { months: number }) {
        this.checkGlobalAdmin(req);
        return this.adminService.registerPayment(id, body.months || 1);
    }


    // Usuarios
    @Get('users')
    async getAllUsers(@Request() req) {
        this.checkGlobalAdmin(req);
        return this.adminService.findAllUsers();
    }

    @Patch('users/:id/status')
    async updateUserStatus(@Request() req, @Param('id') id: string, @Body() body: { active: boolean }) {
        this.checkGlobalAdmin(req);
        return this.adminService.updateUserStatus(id, body.active);
    }

    @Patch('users/:id/role')
    async updateUserRole(@Request() req, @Param('id') id: string, @Body() body: { role: string }) {
        this.checkGlobalAdmin(req);
        return this.adminService.updateUserGlobalRole(id, body.role);
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
