"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const order_entity_1 = require("../orders/entities/order.entity");
const order_item_entity_1 = require("../orders/entities/order-item.entity");
const production_job_entity_1 = require("../jobs/entities/production-job.entity");
const material_entity_1 = require("../materials/entities/material.entity");
const machine_entity_1 = require("../machines/entities/machine.entity");
const enums_1 = require("../common/enums");
let ReportsService = class ReportsService {
    constructor(orderRepository, orderItemRepository, jobRepository, materialRepository, machineRepository) {
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.jobRepository = jobRepository;
        this.materialRepository = materialRepository;
        this.machineRepository = machineRepository;
    }
    async getStats(businessId) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const pendingOrders = await this.orderRepository.count({
            where: {
                businessId,
                status: (0, typeorm_2.In)([enums_1.OrderStatus.PENDING, enums_1.OrderStatus.IN_PROGRESS, enums_1.OrderStatus.CONFIRMED, enums_1.OrderStatus.READY])
            }
        });
        const activeJobs = await this.jobRepository.count({
            where: {
                order: { businessId },
                status: (0, typeorm_2.In)([enums_1.ProductionJobStatus.QUEUED, enums_1.ProductionJobStatus.PRINTING, enums_1.ProductionJobStatus.PAUSED])
            }
        });
        const monthlySalesData = await this.orderRepository.find({
            where: {
                businessId,
                status: (0, typeorm_2.In)([enums_1.OrderStatus.DONE, enums_1.OrderStatus.DELIVERED, enums_1.OrderStatus.READY]),
                createdAt: (0, typeorm_2.Between)(startOfMonth, now)
            }
        });
        const monthlyTotal = monthlySalesData.reduce((acc, order) => acc + Number(order.totalPrice || 0), 0);
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const salesHistory = await this.orderRepository.find({
            where: {
                businessId,
                status: (0, typeorm_2.In)([enums_1.OrderStatus.DONE, enums_1.OrderStatus.DELIVERED, enums_1.OrderStatus.READY]),
                createdAt: (0, typeorm_2.Between)(sixMonthsAgo, now)
            },
            order: { createdAt: 'ASC' }
        });
        const salesByMonth = this.groupByMonth(salesHistory);
        const orderItems = await this.orderItemRepository.find({
            where: { order: { businessId } },
            relations: ['order']
        });
        const productUsage = this.groupProductUsage(orderItems);
        const machines = await this.machineRepository.find({
            where: { businessId }
        });
        const finishedJobs = await this.jobRepository.find({
            where: {
                order: { businessId },
                status: enums_1.ProductionJobStatus.DONE
            },
            relations: ['machine']
        });
        const printerStats = machines.map(p => {
            const jobsCount = finishedJobs.filter(j => j.machineId === p.id).length;
            return {
                name: p.name,
                jobsDone: jobsCount,
                efficiency: Math.round(Math.random() * 20 + 75)
            };
        });
        return {
            summary: {
                pendingOrders,
                activeJobs,
                monthlyTotal,
                averageMargin: 32.5
            },
            charts: {
                salesByMonth,
                productUsage
            },
            printerStats
        };
    }
    groupByMonth(orders) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const result = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            result[`${months[d.getMonth()]}`] = 0;
        }
        orders.forEach(o => {
            const m = months[o.createdAt.getMonth()];
            if (result[m] !== undefined) {
                result[m] += Number(o.totalPrice || 0);
            }
        });
        return Object.entries(result).map(([name, total]) => ({ name, total }));
    }
    groupProductUsage(items) {
        const stats = {};
        items.forEach(item => {
            const name = item.name || 'Otros';
            stats[name] = (stats[name] || 0) + Number(item.qty || 1);
        });
        return Object.entries(stats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(order_entity_1.Order)),
    __param(1, (0, typeorm_1.InjectRepository)(order_item_entity_1.OrderItem)),
    __param(2, (0, typeorm_1.InjectRepository)(production_job_entity_1.ProductionJob)),
    __param(3, (0, typeorm_1.InjectRepository)(material_entity_1.Material)),
    __param(4, (0, typeorm_1.InjectRepository)(machine_entity_1.Machine)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository])
], ReportsService);
//# sourceMappingURL=reports.service.js.map