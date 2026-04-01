import { AppDataSource } from './data-source';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { OrderStatus } from '../common/enums';
import { Business } from '../businesses/entities/business.entity';
import { BusinessMembership, UserRole } from '../businesses/entities/business-membership.entity';
import { Machine } from '../machines/entities/machine.entity';
import { MachineStatus } from '../common/enums';
import { GlobalRoleConfig } from '../admin/entities/global-role-config.entity';
import { OrderSiteInfo } from '../orders/entities/order-site-info.entity';

async function seed() {

    try {
        await AppDataSource.initialize();
        console.log('🌱 Data Source has been initialized for seeding!');

        const orderRepo = AppDataSource.getRepository(Order);
        const itemRepo = AppDataSource.getRepository(OrderItem);
        const businessRepo = AppDataSource.getRepository(Business);
        const roleConfigRepo = AppDataSource.getRepository(GlobalRoleConfig);

        // 0. Global Roles
        const baseRoles = [
            {
                role: 'SUPER_ADMIN',
                description: 'Acceso total al ecosistema',
                capabilities: { 'all_access': true }
            },
            {
                role: 'ADMIN',
                description: 'Administrador operativo del panel general',
                capabilities: { 'manage_businesses': true, 'manage_users': true, 'view_audit': true }
            }
        ];

        for (const r of baseRoles) {
            const exists = await roleConfigRepo.findOneBy({ role: r.role });
            if (!exists) {
                await roleConfigRepo.save(roleConfigRepo.create(r));
                console.log(`✅ Rol configurado: ${r.role}`);
            }
        }

        // 1. Negocios Base
        const baseBusinesses = [
            { name: 'Taller Impresión 3D Alfa', category: 'IMPRESIONES_3D' },
            { name: 'Servicios Metalúrgicos', category: 'METALURGICA' },
            { name: 'Carpintería Moderna', category: 'CARPINTERIA' },
        ];

        const createdBusinesses = [];
        for (const base of baseBusinesses) {
            let biz = await businessRepo.findOne({
                where: { name: base.name, category: base.category }
            });
            if (!biz) {
                biz = businessRepo.create({
                    name: base.name,
                    category: base.category,
                });
                biz = await businessRepo.save(biz);
                console.log(`✅ Negocio creado: ${base.name} [${base.category}]`);
            }
            createdBusinesses.push(biz);
        }

        const biz3D = createdBusinesses.find(b => b.category === 'IMPRESIONES_3D');
        const bizMetal = createdBusinesses.find(b => b.category === 'METALURGICA');

        // 2. Pedido 3D
        const dueSoon = new Date();
        dueSoon.setDate(dueSoon.getDate() + 1);

        const order3D = orderRepo.create({
            businessId: biz3D.id,
            clientName: 'Cliente 3D (Matias)',
            dueDate: dueSoon,
            priority: 10,
            status: OrderStatus.IN_PROGRESS,
        });
        const savedOrder3D = await orderRepo.save(order3D);

        await itemRepo.save([
            itemRepo.create({
                orderId: savedOrder3D.id,
                name: 'Soporte Laptop Gamer',
                estimatedMinutes: 360,
                weightGrams: 240,
                price: 15.5,
                qty: 2,
                doneQty: 1,
            })
        ]);
        console.log('✅ Pedido 3D creado.');

        // 3. Pedido Metalúrgica (Con SiteInfo)
        const dueFar = new Date();
        dueFar.setDate(dueFar.getDate() + 10);

        const orderMetal = orderRepo.create({
            businessId: bizMetal.id,
            clientName: 'Instalación Rejas (Gomez)',
            dueDate: dueFar,
            priority: 5,
            status: OrderStatus.PENDING,
            siteInfo: {
                address: 'Av. Corrientes 1234, CABA',
                visitDate: '2026-04-15',
                visitTime: '10:00 AM',
                visitObservations: 'Traer escalera de 4 metros.'
            } as OrderSiteInfo
        });
        await orderRepo.save(orderMetal);
        console.log('✅ Pedido Metalúrgica creado con SiteInfo.');

        // 4. Máquinas
        const printerRepo = AppDataSource.getRepository(Machine);
        const baseMachines = [
            { name: 'Ender 3 S1 #1', model: 'Creality Ender 3 S1', nozzle: '0.4mm', status: MachineStatus.IDLE, businessId: biz3D.id },
            { name: 'Prusa MK3S+ #1', model: 'Prusa i3 MK3S+', nozzle: '0.6mm', status: MachineStatus.PRINTING, businessId: biz3D.id },
        ];

        for (const p of baseMachines) {
            const exists = await printerRepo.findOne({ where: { name: p.name, businessId: p.businessId } });
            if (!exists) {
                await printerRepo.save(printerRepo.create(p));
                console.log(`✅ Máquina creada: ${p.name}`);
            }
        }

        console.log('🚀 Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}

seed();
