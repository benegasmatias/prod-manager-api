import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { BusinessTemplateDto } from './dto/business-template.dto';
import { BusinessMembership, UserRole } from './entities/business-membership.entity';
import { User } from '../users/entities/user.entity';
import { BusinessTemplate } from './entities/business-template.entity';
import { DataSource, MoreThanOrEqual, In } from 'typeorm';
import { CreateBusinessFromTemplateDto } from './dto/create-business-from-template.dto';
import { Order } from '../orders/entities/order.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Printer } from '../printers/entities/printer.entity';
import { PrinterStatus, OrderStatus } from '../common/enums';
import { Material } from '../materials/entities/material.entity';
import { DashboardSummaryDto, DashboardAlertDto } from './dto/dashboard-summary.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Employee } from '../employees/entities/employee.entity';

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
        @InjectRepository(Printer)
        private readonly printerRepository: Repository<Printer>,
        @InjectRepository(Material)
        private readonly materialRepository: Repository<Material>,
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

            // 1.b Autocompletar el Personal con el Dueño
            const user = await manager.findOneBy(User, { id: userId });
            if (user) {
                // Verificar si ya existe (por si acaso se reintenta la transacción)
                const existingEmployee = await manager.findOne(Employee, {
                    where: { businessId: businessToUse.id, email: user.email }
                });

                if (!existingEmployee) {
                    const nameParts = (user.fullName || 'Propietario').trim().split(/\s+/);
                    const firstName = nameParts[0] || 'Propietario';
                    const lastName = nameParts.slice(1).join(' ');

                    const employee = manager.create(Employee, {
                        businessId: businessToUse.id,
                        firstName: firstName,
                        lastName: lastName,
                        email: user.email,
                        active: true,
                        specialties: 'Administrador / Dueño'
                    });
                    await manager.save(Employee, employee);
                    console.log(`✅ [Onboarding] Owner ${user.email} added as first Employee for business ${businessToUse.id}`);
                }
            }

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

        // 2. Pending Balance (Total - Deposits for non-delivered/cancelled orders)
        const activeOrdersWithItems = await this.orderRepository.find({
            where: {
                businessId,
                status: In([OrderStatus.PENDING, OrderStatus.IN_PROGRESS, OrderStatus.CONFIRMED, OrderStatus.READY, OrderStatus.DONE])
            },
            relations: ['items']
        });

        const pendingBalance = activeOrdersWithItems.reduce((acc, order) => {
            const total = Number(order.totalPrice) || 0;
            const deposits = order.items?.reduce((iAcc, item) => iAcc + Number(item.deposit || 0), 0) || 0;
            return acc + (total - deposits);
        }, 0);

        // 3. Active Printers
        const activePrintersCount = await this.printerRepository.count({
            where: {
                businessId,
                status: PrinterStatus.PRINTING
            }
        });

        // 3.b Production Orders (only those specifically IN_PROGRESS)
        const productionOrdersCount = await this.orderRepository.count({
            where: {
                businessId,
                status: OrderStatus.IN_PROGRESS
            }
        });

        // 4. New Customers (Last 30 days)
        const newCustomersCount = await this.customerRepository.count({
            where: {
                createdAt: MoreThanOrEqual(thirtyDaysAgo)
            }
        });

        // 5. Recent Orders
        const recentOrders = await this.orderRepository.find({
            where: { businessId },
            order: { updatedAt: 'DESC' },
            take: 5
        });

        // 6. Overdue Alerts
        const realOverdue = await this.orderRepository
            .createQueryBuilder('order')
            .where('order.businessId = :businessId', { businessId })
            .andWhere('order.status NOT IN (:...finalStatuses)', { finalStatuses: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] })
            .andWhere('order.dueDate < :now', { now: new Date() })
            .getMany();

        // 7. Low Stock Material Alerts
        const CRITICAL_STOCK_UMBRAL = 200; // gramos
        const lowStockMaterials = await this.materialRepository.find({
            where: {
                businessId,
                active: true,
                remainingWeightGrams: MoreThanOrEqual(0) // Only to enable index/filter if useful, handled by queryBuilder below more safely
            }
        });
        const criticalMaterials = lowStockMaterials.filter(m => m.remainingWeightGrams < CRITICAL_STOCK_UMBRAL);

        const mergedAlerts: DashboardAlertDto[] = [
            ...realOverdue.map(o => ({
                type: 'vencido' as const,
                message: `Pedido ${o.code || o.id.slice(0, 8)} está vencido`,
                metadata: { orderId: o.id }
            })),
            ...criticalMaterials.map(m => ({
                type: 'stock_bajo' as const,
                message: `${m.name} (${m.type}) tiene bajo stock: ${m.remainingWeightGrams.toFixed(0)}g restantes.`,
                metadata: { materialId: m.id }
            }))
        ];

        return {
            totalSales: Number(salesResult?.total) || 0,
            pendingBalance,
            activeOrders: activeOrdersWithItems.length,
            productionOrders: productionOrdersCount,
            activePrinters: activePrintersCount,
            newCustomers: newCustomersCount,
            recentOrders: recentOrders.map(o => ({
                id: o.id,
                clientName: o.clientName || 'Sin Nombre',
                total: Number(o.totalPrice),
                status: o.status,
                dueDate: o.dueDate
            })),
            alerts: mergedAlerts,
            trends: null
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
