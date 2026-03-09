import { Controller, Get, Patch, Param, Req, UseGuards, Query, Body, Post, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';
import { Notification } from './entities/notification.entity';

@Controller('notifications')
@UseGuards(SupabaseAuthGuard)
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) { }

    @Get()
    async findAll(@Req() req, @Query('businessId') businessId?: string): Promise<Notification[]> {
        return this.notificationsService.findAllForUser(req.user, businessId);
    }

    @Get('unread-count')
    async getUnreadCount(@Req() req, @Query('businessId') businessId?: string): Promise<{ count: number }> {
        const count = await this.notificationsService.getUnreadCount(req.user, businessId);
        return { count };
    }

    @Patch(':id/read')
    async markAsRead(@Req() req, @Param('id') id: string): Promise<Notification> {
        return this.notificationsService.markAsRead(id, req.user.id);
    }

    @Patch('read-all')
    async markAllAsRead(@Req() req, @Body('businessId') businessId?: string): Promise<{ success: boolean }> {
        await this.notificationsService.markAllAsRead(req.user, businessId);
        return { success: true };
    }

    @Delete('all')
    async removeAll(@Req() req, @Body('businessId') businessId?: string): Promise<{ success: boolean }> {
        await this.notificationsService.removeAllForUser(req.user, businessId);
        return { success: true };
    }

    @Delete(':id')

    async remove(@Param('id') id: string): Promise<{ success: boolean }> {
        await this.notificationsService.remove(id);
        return { success: true };
    }

    // This endpoint would likely be called by Admin panel or internal events
    @Post()
    async create(@Body() data: Partial<Notification>): Promise<Notification> {
        return this.notificationsService.create(data);
    }
}

