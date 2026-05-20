import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { ProductionJob } from '../jobs/entities/production-job.entity';
import { OrderStatusHistory } from '../history/entities/order-status-history.entity';
import { OrderFailure } from './entities/order-failure.entity';
import { Material } from '../materials/entities/material.entity';
import { Payment } from '../payments/entities/payment.entity';
import { OrderStrategyProvider } from './order-strategy.provider';
import { OrderWorkflowService } from './order-workflow.service';
import { OrderFinancialService } from './order-financial.service';
import { PlanUsageService } from '../businesses/plan-usage.service';
import { BadRequestException } from '@nestjs/common';

describe('OrdersService - Combo-Set Hardening (FASE 4)', () => {
    let service: OrdersService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                { provide: getRepositoryToken(Order), useValue: {} },
                { provide: getRepositoryToken(OrderItem), useValue: {} },
                { provide: getRepositoryToken(ProductionJob), useValue: {} },
                { provide: getRepositoryToken(OrderStatusHistory), useValue: {} },
                { provide: getRepositoryToken(OrderFailure), useValue: {} },
                { provide: getRepositoryToken(Material), useValue: {} },
                { provide: getRepositoryToken(Payment), useValue: {} },
                {
                    provide: OrderStrategyProvider,
                    useValue: { getStrategy: jest.fn() },
                },
                {
                    provide: OrderWorkflowService,
                    useValue: { createWorkflow: jest.fn() },
                },
                {
                    provide: OrderFinancialService,
                    useValue: { calculateItemsTotal: jest.fn() },
                },
                {
                    provide: PlanUsageService,
                    useValue: { ensureOrderCreationAllowed: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
    });

    it('should pass validation with a valid Combo-Set payload', () => {
        const validItems = [
            {
                name: 'Caja - Tapa',
                precioUnitario: 12500,
                metadata: {
                    isComboHeader: true,
                    parentComboGroup: 'combo_abc123',
                },
            },
            {
                name: 'Caja - Base',
                precioUnitario: 0,
                metadata: {
                    isComboChild: true,
                    parentComboGroup: 'combo_abc123',
                    qtyPerCombo: 1,
                },
            },
        ];

        expect(() => service['validateComboSetPayload'](validItems)).not.toThrow();
    });

    it('should throw BadRequestException if a child item has a price other than 0', () => {
        const invalidItems = [
            {
                name: 'Caja - Tapa',
                precioUnitario: 12500,
                metadata: {
                    isComboHeader: true,
                    parentComboGroup: 'combo_abc123',
                },
            },
            {
                name: 'Caja - Base',
                precioUnitario: 500, // Invalid! Should be 0
                metadata: {
                    isComboChild: true,
                    parentComboGroup: 'combo_abc123',
                    qtyPerCombo: 1,
                },
            },
        ];

        expect(() => service['validateComboSetPayload'](invalidItems)).toThrow(
            BadRequestException,
        );
    });

    it('should throw BadRequestException if qtyPerCombo is non-positive', () => {
        const invalidItems = [
            {
                name: 'Caja - Tapa',
                precioUnitario: 12500,
                metadata: {
                    isComboHeader: true,
                    parentComboGroup: 'combo_abc123',
                },
            },
            {
                name: 'Caja - Base',
                precioUnitario: 0,
                metadata: {
                    isComboChild: true,
                    parentComboGroup: 'combo_abc123',
                    qtyPerCombo: 0, // Invalid! Must be > 0
                },
            },
        ];

        expect(() => service['validateComboSetPayload'](invalidItems)).toThrow(
            BadRequestException,
        );
    });

    it('should throw BadRequestException if an item is both header and child', () => {
        const invalidItems = [
            {
                name: 'Caja - Todo',
                precioUnitario: 0,
                metadata: {
                    isComboHeader: true,
                    isComboChild: true, // Invalid! Cannot be both
                    parentComboGroup: 'combo_abc123',
                },
            },
        ];

        expect(() => service['validateComboSetPayload'](invalidItems)).toThrow(
            BadRequestException,
        );
    });

    it('should throw BadRequestException for an orphaned child without a header', () => {
        const invalidItems = [
            {
                name: 'Caja - Base',
                precioUnitario: 0,
                metadata: {
                    isComboChild: true,
                    parentComboGroup: 'combo_abc123',
                    qtyPerCombo: 1,
                },
            },
        ];

        expect(() => service['validateComboSetPayload'](invalidItems)).toThrow(
            BadRequestException,
        );
    });

    it('should throw BadRequestException for a header with an empty child list', () => {
        const invalidItems = [
            {
                name: 'Caja - Tapa',
                precioUnitario: 12500,
                metadata: {
                    isComboHeader: true,
                    parentComboGroup: 'combo_abc123',
                },
            },
        ];

        expect(() => service['validateComboSetPayload'](invalidItems)).toThrow(
            BadRequestException,
        );
    });
});
