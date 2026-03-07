import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, In } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { ProductionJob } from '../jobs/entities/production-job.entity';
import { Material } from '../materials/entities/material.entity';
import { Printer } from '../printers/entities/printer.entity';
import { OrderStatus, JobStatus } from '../common/enums';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Order)
        private readonly orderRepository: Repository<Order>,
        @InjectRepository(OrderItem)
        private readonly orderItemRepository: Repository<OrderItem>,
        @InjectRepository(ProductionJob)
        private readonly jobRepository: Repository<ProductionJob>,
        @InjectRepository(Material)
        private readonly materialRepository: Repository<Material>,
        @InjectRepository(Printer)
        private readonly printerRepository: Repository<Printer>,
    ) { }

    async getStats(businessId: string) {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // 1. KPI Summary
        const pendingOrders = await this.orderRepository.count({
            where: {
                businessId,
                status: In([OrderStatus.PENDING, OrderStatus.IN_PROGRESS, OrderStatus.CONFIRMED, OrderStatus.READY])
            }
        });

        const activeJobs = await this.jobRepository.count({
            where: {
                order: { businessId },
                status: In([JobStatus.QUEUED, JobStatus.PRINTING, JobStatus.PAUSED])
            }
        });

        // Total sales this month (Done or Delivered)
        const monthlySalesData = await this.orderRepository.find({
            where: {
                businessId,
                status: In([OrderStatus.DONE, OrderStatus.DELIVERED, OrderStatus.READY]),
                createdAt: Between(startOfMonth, now)
            }
        });

        const monthlyTotal = monthlySalesData.reduce((acc, order) => acc + Number(order.totalPrice || 0), 0);

        // 2. Sales Chart Data (last 6 months)
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        const salesHistory = await this.orderRepository.find({
            where: {
                businessId,
                status: In([OrderStatus.DONE, OrderStatus.DELIVERED, OrderStatus.READY]),
                createdAt: Between(sixMonthsAgo, now)
            },
            order: { createdAt: 'ASC' }
        });

        const salesByMonth = this.groupByMonth(salesHistory);

        // 3. Product Distribution
        const orderItems = await this.orderItemRepository.find({
            where: { order: { businessId } },
            relations: ['order']
        });

        const productUsage = this.groupProductUsage(orderItems);

        // 4. Printer Performance
        const printers = await this.printerRepository.find({
            where: { businessId }
        });

        const finishedJobs = await this.jobRepository.find({
            where: {
                order: { businessId },
                status: JobStatus.DONE
            },
            relations: ['printer']
        });

        const printerStats = printers.map(p => {
            const jobsCount = finishedJobs.filter(j => j.printerId === p.id).length;
            return {
                name: p.name,
                jobsDone: jobsCount,
                efficiency: Math.round(Math.random() * 20 + 75) // Mocked efficiency for now as we don't have timers
            };
        });

        return {
            summary: {
                pendingOrders,
                activeJobs,
                monthlyTotal,
                averageMargin: 32.5 // Mocked as we don't have cost tracking yet
            },
            charts: {
                salesByMonth,
                productUsage
            },
            printerStats
        };
    }

    private groupByMonth(orders: Order[]) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const result: Record<string, number> = {};

        // Initialize last 6 months
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

    private groupProductUsage(items: OrderItem[]) {
        const stats: Record<string, number> = {};

        items.forEach(item => {
            const name = item.name || 'Otros';
            stats[name] = (stats[name] || 0) + Number(item.qty || 1);
        });

        return Object.entries(stats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5); // top 5
    }
}
