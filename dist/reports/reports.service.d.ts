import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { ProductionJob } from '../jobs/entities/production-job.entity';
import { Material } from '../materials/entities/material.entity';
import { Machine } from '../machines/entities/machine.entity';
export declare class ReportsService {
    private readonly orderRepository;
    private readonly orderItemRepository;
    private readonly jobRepository;
    private readonly materialRepository;
    private readonly machineRepository;
    constructor(orderRepository: Repository<Order>, orderItemRepository: Repository<OrderItem>, jobRepository: Repository<ProductionJob>, materialRepository: Repository<Material>, machineRepository: Repository<Machine>);
    getStats(businessId: string): Promise<{
        summary: {
            pendingOrders: number;
            activeJobs: number;
            monthlyTotal: number;
            averageMargin: number;
        };
        charts: {
            salesByMonth: {
                name: string;
                total: number;
            }[];
            productUsage: {
                name: string;
                value: number;
            }[];
        };
        printerStats: {
            name: string;
            jobsDone: number;
            efficiency: number;
        }[];
    }>;
    private groupByMonth;
    private groupProductUsage;
}
