import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { Business } from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';
import { GlobalRoleConfig } from './entities/global-role-config.entity';
import { UsersModule } from '../users/users.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SubscriptionReminderService } from './tasks/subscription-reminder.service';

@Module({

    imports: [
        TypeOrmModule.forFeature([Business, User, GlobalRoleConfig]),
        UsersModule, // For guards/supabase dependencies
        NotificationsModule,
    ],

    providers: [AdminService, SubscriptionReminderService],

    controllers: [AdminController],
    exports: [AdminService],
})
export class AdminModule { }
