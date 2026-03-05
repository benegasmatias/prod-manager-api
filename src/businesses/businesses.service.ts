import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { BusinessTemplateDto } from './dto/business-template.dto';
import { BusinessMembership, UserRole } from './entities/business-membership.entity';
import { User } from '../users/entities/user.entity';
import { BusinessTemplate } from './entities/business-template.entity';
import { DataSource, MoreThanOrEqual } from 'typeorm';
import { CreateBusinessFromTemplateDto } from './dto/create-business-from-template.dto';
import { Order } from '../orders/entities/order.entity';
import { Customer } from '../customers/entities/customer.entity';
import { OrderStatus } from '../common/enums';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';

@Injectable()
export class BusinessesService {
    constructor(
        @InjectRepository(Business)
        private readonly businessRepository: Repository<Business>,
        @InjectRepository(BusinessMembership)
        private readonly membershipRepository: Repository<BusinessMembership>,
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        @InjectRepository(BusinessTemplate)
        private readonly templateRepository: Repository<BusinessTemplate>,
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(Customer)
        private readonly customerRepository: Repository<Customer>,
        private readonly dataSource: DataSource,
    ) { }

    async getTemplates(): Promise<BusinessTemplateDto[]> {
        const templates = await this.templateRepository.find();
        return templates.map(t => ({
            key: t.key,
            name: t.name,
            description: t.description,
            imageKey: t.imageKey,
        }));
    }

    async createFromTemplate(userId: string, createDto: CreateBusinessFromTemplateDto): Promise<any> {
        const { templateKey, name } = createDto;
        const template = await this.templateRepository.findOneBy({ key: templateKey });

        if (!template && templateKey !== 'GENERICO') {
            throw new NotFoundException(`Template with key ${templateKey} not found`);
        }

        return await this.dataSource.transaction(async (manager) => {
            // 1. Buscar si el usuario ya tiene un negocio de esta categoría (Regla A: 1 rubro por user)
            const existingMembership = await manager.findOne(BusinessMembership, {
                where: {
                    userId,
                    business: { category: templateKey }
                },
                relations: ['business']
            });

            if (existingMembership) {
                throw new BadRequestException(`Ya tienes un negocio registrado en el rubro ${templateKey}. No se permiten duplicados por rubro.`);
            }

            console.log(`[Onboarding] Creating new business for user ${userId} [Category: ${templateKey}]`);
            // Crear el negocio
            const business = manager.create(Business, {
                name: name || (template ? `${template.name} - Mi Espacio` : 'Mi Negocio'),
                category: templateKey
            });
            const businessToUse = await manager.save(Business, business);

            // Crear membership OWNER
            const membership = manager.create(BusinessMembership, {
                userId,
                businessId: businessToUse.id,
                role: UserRole.OWNER
            });
            await manager.save(BusinessMembership, membership);

            // 2. Setear defaultBusinessId en el usuario si no tiene uno
            const user = await manager.findOneBy(User, { id: userId });
            if (user && !user.defaultBusinessId) {
                user.defaultBusinessId = businessToUse.id;
                await manager.save(User, user);
                console.log(`✅ [Onboarding] defaultBusinessId seteado (primera vez) -> ${businessToUse.id}`);
            }

            // 3. Respuesta estructurada exacta
            return {
                business: {
                    id: businessToUse.id,
                    name: businessToUse.name,
                    category: businessToUse.category
                },
                defaultBusinessId: businessToUse.id
            };
        });
    }

    async checkAccess(userId: string, businessId: string): Promise<boolean> {
        const membership = await this.membershipRepository.findOne({
            where: { userId, businessId }
        });
        return !!membership;
    }

    async findUserBusinesses(userId: string): Promise<Business[]> {
        const memberships = await this.membershipRepository.find({
            where: { userId },
            relations: ['business']
        });
        return memberships.map(m => m.business);
    }

    async getDashboardSummary(userId: string, businessId: string): Promise<DashboardSummaryDto> {
        const hasAccess = await this.checkAccess(userId, businessId);
        if (!hasAccess) {
            throw new ForbiddenException('No tienes acceso a este negocio');
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // 1. Total Sales (DELIVERED/DONE orders)
        const salesResult = await this.orderRepository
            .createQueryBuilder('order')
            .select('SUM(order.totalPrice)', 'total')
            .where('order.businessId = :businessId', { businessId })
            .andWhere('order.status IN (:...statuses)', { statuses: [OrderStatus.DELIVERED, OrderStatus.DONE] })
            .getRawOne();

        // 2. Active Orders
        const activeOrdersCount = await this.orderRepository.count({
            where: {
                businessId,
                status: OrderStatus.PENDING, // Or any non-final status
            }
        });

        // 3. New Customers (Last 30 days)
        // Note: Customer entity currently doesn't have businessId.
        // For now, filtering only by date. TODO: Add businessId to Customer entity.
        const newCustomersCount = await this.customerRepository.count({
            where: {
                createdAt: MoreThanOrEqual(thirtyDaysAgo)
            }
        });

        // 4. Recent Orders
        const recentOrders = await this.orderRepository.find({
            where: { businessId },
            order: { createdAt: 'DESC' },
            take: 5
        });

        // 5. Alerts (Overdue orders)
        const now = new Date();
        const overdueOrders = await this.orderRepository.find({
            where: {
                businessId,
                status: OrderStatus.PENDING,
                dueDate: MoreThanOrEqual(now) // Technically should be LessThan, but let's check your priority logic
            }
        });

        // Real overdue check: status not final AND dueDate < now
        const realOverdue = await this.orderRepository
            .createQueryBuilder('order')
            .where('order.businessId = :businessId', { businessId })
            .andWhere('order.status NOT IN (:...finalStatuses)', { finalStatuses: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] })
            .andWhere('order.dueDate < :now', { now: new Date() })
            .getMany();

        return {
            totalSales: Number(salesResult?.total) || 0,
            profit: null, // No cost model yet
            activeOrders: activeOrdersCount,
            newCustomers: newCustomersCount,
            recentOrders: recentOrders.map(o => ({
                id: o.id,
                clientName: o.clientName || 'Sin Nombre',
                total: Number(o.totalPrice),
                status: o.status,
                dueDate: o.dueDate
            })),
            alerts: realOverdue.map(o => ({
                type: 'vencido',
                message: `Pedido ${o.code || o.id.slice(0, 8)} está vencido`,
                metadata: { orderId: o.id }
            })),
            trends: null // Trends not yet calculated
        };
    }

    async findOne(userId: string, id: string): Promise<Business> {
        const hasAccess = await this.checkAccess(userId, id);
        if (!hasAccess) {
            throw new ForbiddenException('No tienes acceso a este negocio');
        }

        const business = await this.businessRepository.findOneBy({ id });
        if (!business) {
            throw new NotFoundException('Negocio no encontrado');
        }
        return business;
    }

    async update(userId: string, id: string, updateDto: UpdateBusinessDto): Promise<Business> {
        const hasAccess = await this.checkAccess(userId, id);
        if (!hasAccess) {
            throw new ForbiddenException('No tienes acceso a este negocio');
        }

        await this.businessRepository.update(id, updateDto);
        return this.findOne(userId, id);
    }
}
