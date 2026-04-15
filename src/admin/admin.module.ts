import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController, PlansPublicController } from './admin.controller';
import { Business } from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';
import { BusinessTemplate } from '../businesses/entities/business-template.entity';
import { GlobalRoleConfig } from './entities/global-role-config.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionReminderService } from './tasks/subscription-reminder.service';
import { AdminAuditLog } from './entities/admin-audit-log.entity';

@Module({

    imports: [
        TypeOrmModule.forFeature([Business, User, GlobalRoleConfig, SubscriptionPlan, BusinessTemplate, AdminAuditLog]),
        UsersModule, // For guards/supabase dependencies
        NotificationsModule,
    ],

    providers: [AdminService, SubscriptionReminderService],

    controllers: [AdminController, PlansPublicController],
    exports: [AdminService],
})
export class AdminModule { }
