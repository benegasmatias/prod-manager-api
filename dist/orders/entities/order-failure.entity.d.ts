import { Order } from './order.entity';
import { Material } from '../../materials/entities/material.entity';
export declare class OrderFailure {
    id: string;
    orderId: string;
    order: Order;
    reason: string;
    wastedGrams: number;
    materialId: string;
    material: Material;
    createdAt: Date;
}
