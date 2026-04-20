import { Module, Global, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { UsersManagementController } from './users-management.controller';
import { SupabaseService } from '../common/supabase/supabase.service';

import { BusinessesModule } from '../businesses/businesses.module';

import { GlobalAdminGuard } from './guards/global-admin.guard';
import { UserStatusGuard } from './guards/user-status.guard';

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        forwardRef(() => BusinessesModule),
    ],
    controllers: [UsersController, UsersManagementController],
    providers: [UsersService, SupabaseService, GlobalAdminGuard, UserStatusGuard],
    exports: [UsersService, SupabaseService, TypeOrmModule, GlobalAdminGuard, UserStatusGuard],
})
export class UsersModule { }
