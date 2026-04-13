import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from './entities/business.entity';
import { BusinessMembership } from './entities/business-membership.entity';
import { BusinessSubscription } from './entities/business-subscription.entity';
import { WebhookEvent } from './entities/webhook-event.entity';
import { BusinessTemplate } from './entities/business-template.entity';
import { User } from '../users/entities/user.entity';
import { Order } from '../orders/entities/order.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Machine } from '../machines/entities/machine.entity';
import { Material } from '../materials/entities/material.entity';
import { Employee } from '../employees/entities/employee.entity';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { BusinessTemplatesController } from './business-templates.controller';
import { BusinessSubscriptionController } from './business-subscription.controller';
import { WebhooksController } from './webhooks.controller';
import { BillingService } from './billing.service';
import { PlanUsageService } from './plan-usage.service';
import { BusinessStrategyProvider } from './strategies/business-strategy.provider';
import { AuditModule } from '../audit/audit.module';

import { BusinessInvitation } from './entities/business-invitation.entity';
import { BusinessInvitationsService } from './business-invitations.service';
import { BusinessInvitationsController } from './business-invitations.controller';
import { BusinessCapabilityGuard } from './guards/business-capability.guard';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            Business, 
            BusinessMembership, 
            BusinessSubscription,
            WebhookEvent,
            User, 
            BusinessTemplate, 
            BusinessInvitation,
            Order, 
            Customer, 
            Machine, 
            Material,
            Employee
        ]),
        AuditModule
    ],
    controllers: [
        BusinessesController, 
        BusinessTemplatesController, 
        BusinessSubscriptionController, 
        WebhooksController,
        BusinessInvitationsController
    ],
    providers: [
        BusinessesService, 
        BusinessInvitationsService,
        BusinessStrategyProvider, 
        PlanUsageService, 
        BillingService,
        BusinessCapabilityGuard
    ],
    exports: [
        BusinessesService, 
        BusinessInvitationsService,
        PlanUsageService, 
        BillingService,
        BusinessCapabilityGuard,
        TypeOrmModule
    ],
})
export class BusinessesModule { }
