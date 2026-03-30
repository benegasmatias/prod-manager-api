import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController, PlansPublicController } from './admin.controller';
import { Business } from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';
import { GlobalRoleConfig } from './entities/global-role-config.entity';
import { SubscriptionPlan } from './entities/subscription-plan.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionReminderService } from './tasks/subscription-reminder.service';

@Module({

    imports: [
        TypeOrmModule.forFeature([Business, User, GlobalRoleConfig, SubscriptionPlan]),
        UsersModule, // For guards/supabase dependencies
        NotificationsModule,
    ],

    providers: [AdminService, SubscriptionReminderService],

    controllers: [AdminController, PlansPublicController],
    exports: [AdminService],
})
export class AdminModule { }
