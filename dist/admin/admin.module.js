"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const admin_service_1 = require("./admin.service");
const admin_controller_1 = require("./admin.controller");
const business_entity_1 = require("../businesses/entities/business.entity");
const user_entity_1 = require("../users/entities/user.entity");
const global_role_config_entity_1 = require("./entities/global-role-config.entity");
const subscription_plan_entity_1 = require("./entities/subscription-plan.entity");
const users_module_1 = require("../users/users.module");
const notifications_module_1 = require("../notifications/notifications.module");
const subscription_reminder_service_1 = require("./tasks/subscription-reminder.service");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([business_entity_1.Business, user_entity_1.User, global_role_config_entity_1.GlobalRoleConfig, subscription_plan_entity_1.SubscriptionPlan]),
            users_module_1.UsersModule,
            notifications_module_1.NotificationsModule,
        ],
        providers: [admin_service_1.AdminService, subscription_reminder_service_1.SubscriptionReminderService],
        controllers: [admin_controller_1.AdminController, admin_controller_1.PlansPublicController],
        exports: [admin_service_1.AdminService],
    })
], AdminModule);
//# sourceMappingURL=admin.module.js.map