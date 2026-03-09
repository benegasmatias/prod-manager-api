import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from '../businesses/entities/business.entity';
import { User } from '../users/entities/user.entity';

import { GlobalRoleConfig } from './entities/global-role-config.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { Notification } from '../notifications/entities/notification.entity';

@Injectable()
export class AdminService {
    constructor(
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(GlobalRoleConfig)
        private readonly roleConfigRepository: Repository<GlobalRoleConfig>,
        private readonly notificationsService: NotificationsService,
    ) { }


    // Roles and Permissions
    async findAllRoleConfigs(): Promise<GlobalRoleConfig[]> {
        return this.roleConfigRepository.find();
    }

    async updateRoleConfig(role: string, data: Partial<GlobalRoleConfig>): Promise<GlobalRoleConfig> {
        await this.roleConfigRepository.update(role, data);
        return this.roleConfigRepository.findOneBy({ role }) as Promise<GlobalRoleConfig>;
    }

    async sendNotification(data: Partial<Notification>): Promise<Notification> {
        return this.notificationsService.create(data);
    }



    // Negocios
    async findAllBusinesses(): Promise<Business[]> {
        return this.businessRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['memberships'], // O pcional para ver dueños
        });
    }

    async findBusinessById(id: string): Promise<Business> {
        const business = await this.businessRepository.findOne({
            where: { id },
            relations: ['memberships'],
        });
        if (!business) throw new NotFoundException('Negocio no encontrado');
        return business;
    }

    async updateBusinessStatus(id: string, status: string): Promise<Business> {
        await this.businessRepository.update(id, { status });
        return this.findBusinessById(id);
    }

    async updateBusinessSubscription(id: string, planId: string, expiresAt: Date): Promise<Business> {
        await this.businessRepository.update(id, {
            planId,
            subscriptionExpiresAt: expiresAt,
            status: 'ACTIVE'
        });
        return this.findBusinessById(id);
    }

    async registerPayment(id: string, months: number): Promise<Business> {
        const business = await this.findBusinessById(id);
        const currentExpires = business.subscriptionExpiresAt || new Date();
        const newExpires = new Date(currentExpires);
        newExpires.setMonth(newExpires.getMonth() + months);

        await this.businessRepository.update(id, {
            subscriptionExpiresAt: newExpires,
            status: 'ACTIVE'
        });
        return this.findBusinessById(id);
    }


    // Usuarios locales (del ecosistema)
    async findAllUsers(): Promise<User[]> {
        return this.userRepository.find({
            order: { createdAt: 'DESC' },
        });
    }

    async updateUserStatus(id: string, active: boolean): Promise<User> {
        await this.userRepository.update(id, { active });
        const user = await this.userRepository.findOneBy({ id });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
    }

    async updateUserGlobalRole(id: string, role: string): Promise<User> {
        await this.userRepository.update(id, { globalRole: role });
        const user = await this.userRepository.findOneBy({ id });
        if (!user) throw new NotFoundException('Usuario no encontrado');
        return user;
    }
}
