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
import { Machine } from '../machines/entities/machine.entity';
import { MachineStatus, OrderStatus, OrderType } from '../common/enums';
import { Material } from '../materials/entities/material.entity';
import { DashboardSummaryDto, DashboardAlertDto } from './dto/dashboard-summary.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
import { Employee } from '../employees/entities/employee.entity';
import { BusinessStrategyProvider } from './strategies/business-strategy.provider';

const DEFAULT_BASE_CONFIG = {
    sidebarItems: ['/dashboard', '/pedidos', '/stock', '/clientes', '/ajustes'],
    labels: { produccion: 'Producción', items: 'Trabajos' },
    icons: { pedidos: 'Box', produccion: 'Cpu' },
    stats: [
        { key: 'totalSales', label: 'Ventas Totales', icon: 'TrendingUp', format: 'currency' },
        { key: 'pendingBalance', label: 'Saldo a Cobrar', icon: 'Wallet', format: 'currency' }
    ],
    productionStages: [
        { key: 'PENDING', label: 'Pendiente', color: 'bg-zinc-100' },
        { key: 'DONE', label: 'Terminado', color: 'bg-emerald-500' }
    ],
    itemFields: [
        { key: 'nombreProducto', label: 'Nombre / Trabajo', tipo: 'text', required: true }
    ],
    features: { hasMaterials: false, hasVisits: false },
};

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
        @InjectRepository(Machine)
        private readonly machineRepository: Repository<Machine>,
        @InjectRepository(Material)
        private readonly materialRepository: Repository<Material>,
        private readonly dataSource: DataSource,
        private readonly strategyProvider: BusinessStrategyProvider,
    ) { }

    async getTemplates(): Promise<BusinessTemplateDto[]> {
        const templates = await this.templateRepository.find({
            where: { isEnabled: true }
        });
        return templates.map(t => ({
            key: t.key,
            name: t.name,
            description: t.description,
            imageKey: t.imageKey,
            isAvailable: t.isAvailable,
            isComingSoon: t.isComingSoon
        }));
    }

    async createFromTemplate(userId: string, createDto: CreateBusinessFromTemplateDto): Promise<any> {
        const { templateKey, name } = createDto;
        const template = await this.templateRepository.findOneBy({ key: templateKey });

        if (!template && templateKey !== 'GENERICO') {
            throw new NotFoundException(`Template with key ${templateKey} not found`);
        }

        if (template && !template.isEnabled) {
            throw new BadRequestException(`El rubro ${template.name} no está habilitado para nuevos registros en este momento.`);
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

            console.log(`[Onboarding] Creating new business for user ${userId} [Category: ${templateKey}] - Status: DRAFT`);
            // Crear el negocio en estado DRAFT
            const business = manager.create(Business, {
                name: name || (template ? `${template.name} - Mi Espacio` : 'Mi Negocio'),
                category: templateKey,
                status: 'DRAFT',
                onboardingStep: 'BASIC_INFO'
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
                }
                
                // Si es su primer negocio (o no tiene default), lo asignamos como default aunque esté en DRAFT
                if (!user.defaultBusinessId) {
                    user.defaultBusinessId = businessToUse.id;
                    await manager.save(User, user);
                }
            }

            return {
                businessId: businessToUse.id,
                name: businessToUse.name,
                status: businessToUse.status,
                onboardingStep: businessToUse.onboardingStep
            };
        });
    }

    async updateOnboardingStep(userId: string, businessId: string, step: string): Promise<any> {
        const business = await this.findOne(userId, businessId);
        if (business.status !== 'DRAFT' && business.status !== 'ACTIVE') {
            throw new BadRequestException('Solo se puede actualizar onboarding en negocios activos o borradores.');
        }

        business.onboardingStep = step;
        await this.businessRepository.save(business);
        return { businessId, onboardingStep: step };
    }

    async activateBusiness(userId: string, businessId: string): Promise<any> {
        const business = await this.findOne(userId, businessId);
        
        if (business.status === 'ACTIVE') {
            return { businessId, status: 'ACTIVE', message: 'El negocio ya está activo.' };
        }

        if (business.status !== 'DRAFT') {
            throw new BadRequestException('Solo se pueden activar negocios que estén en modo borrador (DRAFT).');
        }

        // VALIDACIÓN DE CONSISTENCIA (Mínimo necesario para operar)
        if (!business.name || business.name.length < 3) {
            throw new BadRequestException('El nombre del negocio debe tener al menos 3 caracteres.');
        }

        if (!business.category) {
            throw new BadRequestException('El negocio debe tener un rubro definido.');
        }

        // El Onboarding debe estar virtualmente terminado para activar
        business.status = 'ACTIVE';
        business.onboardingCompleted = true;
        business.onboardingStep = 'DONE';
        
        await this.businessRepository.save(business);
        
        console.log(`✅ [SaaS Lifecycle] Business ${businessId} [${business.name}] ACTIVATED by user ${userId}`);
        
        return {
            businessId: business.id,
            name: business.name,
            status: business.status,
            message: 'Negocio activado con éxito.'
        };
    }

    async checkAccess(userId: string, businessId: string): Promise<boolean> {
        const membership = await this.membershipRepository.findOne({
            where: { userId, businessId }
        });
        return !!membership;
    }

    async findUserBusinesses(userId: string, filters?: { isEnabled?: boolean, acceptingOrders?: boolean, status?: string }): Promise<Business[]> {
        const whereClause: any = { userId };
        
        if (filters) {
            whereClause.business = {};
            if (filters.isEnabled !== undefined) whereClause.business.isEnabled = filters.isEnabled;
            if (filters.acceptingOrders !== undefined) whereClause.business.acceptingOrders = filters.acceptingOrders;
            if (filters.status !== undefined) whereClause.business.status = filters.status;
        }

        const memberships = await this.membershipRepository.find({
            where: whereClause,
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

        const ACTIVE_WORKING_STATUSES = [
            OrderStatus.PENDING, OrderStatus.IN_PROGRESS, OrderStatus.CONFIRMED,
            OrderStatus.READY, OrderStatus.DONE, OrderStatus.DESIGN,
            OrderStatus.CUTTING, OrderStatus.WELDING, OrderStatus.ASSEMBLY,
            OrderStatus.PAINTING, OrderStatus.BARNIZADO, OrderStatus.POST_PROCESS,
            OrderStatus.REPRINT_PENDING, OrderStatus.RE_WORK, OrderStatus.IN_STOCK,
            OrderStatus.SITE_VISIT, OrderStatus.SITE_VISIT_DONE, OrderStatus.VISITA_REPROGRAMADA, 
            OrderStatus.QUOTATION, OrderStatus.BUDGET_GENERATED, OrderStatus.SURVEY_DESIGN, OrderStatus.APPROVED,
            OrderStatus.OFFICIAL_ORDER, OrderStatus.INSTALACION_OBRA
        ];

        const PRODUCTION_STATUSES = [
            OrderStatus.IN_PROGRESS, OrderStatus.DESIGN, OrderStatus.CUTTING,
            OrderStatus.WELDING, OrderStatus.ASSEMBLY, OrderStatus.PAINTING,
            OrderStatus.BARNIZADO, OrderStatus.POST_PROCESS, OrderStatus.RE_WORK,
            OrderStatus.OFFICIAL_ORDER // El taller suele considerarse también como producción activa
        ];


        // Ejecutar todas las consultas en paralelo
        const [
            salesResult,
            activeOrdersWithItems,
            activeMachinesCount,
            productionOrdersCount,
            newCustomersCount,
            recentOrders,
            realOverdue
        ] = await Promise.all([
            // 1. Total Sales
            this.orderRepository.createQueryBuilder('order')
                .select('SUM(order.totalPrice)', 'total')
                .where('order.businessId = :businessId', { businessId })
                .andWhere('order.status IN (:...statuses)', { statuses: [OrderStatus.DELIVERED, OrderStatus.DONE] })
                .getRawOne(),

            // 2. Pending Balance (necesitamos los items para los saldos)
            this.orderRepository.find({
                where: { businessId, status: In(ACTIVE_WORKING_STATUSES) },
                relations: ['items', 'siteInfo']
            }),

            // 3. Active Machines
            this.machineRepository.count({
                where: { businessId, status: MachineStatus.PRINTING }
            }),

            // 3.b Production Orders
            this.orderRepository.count({
                where: { businessId, status: In(PRODUCTION_STATUSES) }
            }),

            // 4. New Customers
            this.customerRepository.count({
                where: { businessId, createdAt: MoreThanOrEqual(thirtyDaysAgo) }
            }),

            // 5. Recent Orders
            this.orderRepository.find({
                where: { businessId },
                order: { updatedAt: 'DESC' },
                take: 5
            }),

            // 6. Overdue Alerts
            this.orderRepository.createQueryBuilder('order')
                .where('order.businessId = :businessId', { businessId })
                .andWhere('order.status NOT IN (:...finalStatuses)', { finalStatuses: [OrderStatus.DELIVERED, OrderStatus.CANCELLED] })
                .andWhere('order.type != :stockType', { stockType: OrderType.STOCK })
                .andWhere('LOWER(order.clientName) != :stockName', { stockName: 'stock' })
                .andWhere('order.dueDate < :now', { now: new Date() })
                .getMany()
        ]);

        const pendingBalance = activeOrdersWithItems.reduce((acc, order) => {
            const total = Number(order.totalPrice) || 0;
            const deposits = order.items?.reduce((iAcc, item) => iAcc + Number(item.deposit || 0), 0) || 0;
            const payments = order.payments?.reduce((iAcc, p) => iAcc + Number(p.amount || 0), 0) || 0;
            return acc + (total - deposits - payments);
        }, 0);

        // --- NUEVA LÓGICA DE STRATEGY (CAPA 2) ---
        const business = await this.businessRepository.findOneBy({ id: businessId });
        const strategy = this.strategyProvider.getStrategy(business?.category);
        const now = new Date();
        const context = {
            activeOrders: activeOrdersWithItems,
            realOverdueCount: realOverdue.length,
            todayStr: now.toISOString().split('T')[0],
            nextWeekDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        };

        const operationalCounters = strategy.getOperationalCounters(context);
        const pipelineSummary = strategy.getPipelineSummary(context);
        const calendarEvents = strategy.getCalendarEvents(context);
        // ----------------------------------------

        const mergedAlerts: DashboardAlertDto[] = [
            ...realOverdue.map(o => ({
                type: 'vencido' as const,
                message: `Pedido ${o.code || o.id.slice(0, 8)} está vencido`,
                metadata: { orderId: o.id }
            })),
        ];

        // 7. Low Stock Material Alerts
        const CRITICAL_STOCK_UMBRAL = 200; // gramos
        const lowStockMaterials = await this.materialRepository.find({
            where: {
                businessId,
                active: true,
                remainingWeightGrams: MoreThanOrEqual(0)
            }
        });
        const criticalMaterials = lowStockMaterials.filter(m => m.remainingWeightGrams < CRITICAL_STOCK_UMBRAL);

        mergedAlerts.push(...criticalMaterials.map(m => ({
            type: 'stock_bajo' as const,
            message: `${m.name} (${m.type}) tiene bajo stock: ${m.remainingWeightGrams.toFixed(0)}g restantes.`,
            metadata: { materialId: m.id }
        })));

        return {
            totalSales: Number(salesResult?.total) || 0,
            pendingBalance,
            activeOrders: activeOrdersWithItems.length,
            productionOrders: productionOrdersCount,
            activeMachines: activeMachinesCount,
            newCustomers: newCustomersCount,
            recentOrders: recentOrders.map(o => ({
                id: o.id,
                clientName: o.clientName || 'Sin Nombre',
                total: Number(o.totalPrice),
                status: o.status,
                dueDate: o.dueDate,
                type: o.type
            })),
            alerts: mergedAlerts,
            trends: null,
            operationalCounters,
            pipelineSummary,
            calendarEvents
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

    async resolveBusinessConfig(userId: string, businessId: string): Promise<any> {
        const business = await this.findOne(userId, businessId);
        if (!business) throw new NotFoundException('Negocio no encontrado');

        const template = await this.templateRepository.findOneBy({ key: business.category });
        
        // 1. Iniciar con defaults del sistema para asegurar contrato
        let resolvedConfig = JSON.parse(JSON.stringify(DEFAULT_BASE_CONFIG));

        // 2. Aplicar configuración del template (si existe)
        if (template && template.config) {
            resolvedConfig = {
                ...resolvedConfig,
                ...template.config,
                labels: { ...(resolvedConfig.labels || {}), ...(template.config.labels || {}) },
                icons: { ...(resolvedConfig.icons || {}), ...(template.config.icons || {}) },
                features: { ...(resolvedConfig.features || {}), ...(template.config.features || {}) }
            };
        }

        // 3. Aplicar overrides del inquilino (Business)
        const overrides = business.capabilitiesOverride || {};
        if (Object.keys(overrides).length > 0) {
            resolvedConfig = {
                ...resolvedConfig,
                ...overrides,
                // Mergear features explícitamente para permitir overrides parciales
                features: { 
                    ...(resolvedConfig.features || {}), 
                    ...(overrides.features || {}) 
                }
            };
            
            // Si el inquilino re-define listas completas, el Spread ya las pisa
        }

        // 4. Validación estructural final
        this.validateConfigSchema(resolvedConfig);

        return {
            businessId: business.id,
            businessName: business.name,
            category: business.category,
            status: business.status,
            isEnabled: business.isEnabled,
            onboardingCompleted: business.onboardingCompleted,
            config: resolvedConfig
        };
    }

    private validateConfigSchema(config: any) {
        const requiredKeys = ['sidebarItems', 'productionStages', 'itemFields', 'features'];
        const missing = requiredKeys.filter(k => !config[k]);
        if (missing.length > 0) {
            console.warn(`[BusinessesService] Configuración con keys faltantes: ${missing.join(', ')}`);
            // Sanitización: asegurar que al menos sean arrays vacíos para no romper JS
            missing.forEach(k => {
                if (k === 'features') config[k] = {};
                else config[k] = [];
            });
        }
    }

    async addMemberToBusiness(userId: string, businessId: string, role: string): Promise<BusinessMembership> {
        let membership = await this.membershipRepository.findOne({
            where: { userId, businessId }
        });

        if (!membership) {
            membership = this.membershipRepository.create({
                userId,
                businessId,
                role: role as any
            });
        } else {
            membership.role = role as any;
        }

        return this.membershipRepository.save(membership);
    }
}
