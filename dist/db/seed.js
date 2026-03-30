"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const data_source_1 = require("./data-source");
const order_entity_1 = require("../orders/entities/order.entity");
const order_item_entity_1 = require("../orders/entities/order-item.entity");
const user_entity_1 = require("../users/entities/user.entity");
const enums_1 = require("../common/enums");
const business_entity_1 = require("../businesses/entities/business.entity");
const business_membership_entity_1 = require("../businesses/entities/business-membership.entity");
const machine_entity_1 = require("../machines/entities/machine.entity");
const enums_2 = require("../common/enums");
const global_role_config_entity_1 = require("../admin/entities/global-role-config.entity");
async function seed() {
    try {
        await data_source_1.AppDataSource.initialize();
        console.log('🌱 Data Source has been initialized for seeding!');
        const orderRepo = data_source_1.AppDataSource.getRepository(order_entity_1.Order);
        const itemRepo = data_source_1.AppDataSource.getRepository(order_item_entity_1.OrderItem);
        const userRepo = data_source_1.AppDataSource.getRepository(user_entity_1.User);
        const businessRepo = data_source_1.AppDataSource.getRepository(business_entity_1.Business);
        const membershipRepo = data_source_1.AppDataSource.getRepository(business_membership_entity_1.BusinessMembership);
        const roleConfigRepo = data_source_1.AppDataSource.getRepository(global_role_config_entity_1.GlobalRoleConfig);
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
            },
            {
                role: 'SUPPORT',
                description: 'Soporte técnico y atención al cliente',
                capabilities: { 'view_businesses': true, 'view_users': true, 'manage_tickets': true }
            }
        ];
        for (const r of baseRoles) {
            const exists = await roleConfigRepo.findOneBy({ role: r.role });
            if (!exists) {
                await roleConfigRepo.save(roleConfigRepo.create(r));
                console.log(`✅ Rol configurado: ${r.role}`);
            }
        }
        const baseBusinesses = [
            { name: 'Taller Impresión 3D Alfa', category: 'IMPRESIONES_3D' },
            { name: 'Impresiones 3D Express', category: 'IMPRESIONES_3D' },
            { name: 'PrintWorks 3D Studio', category: 'IMPRESIONES_3D' },
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
            else {
                console.log(`ℹ️ Negocio ya existe: ${base.name}`);
            }
            createdBusinesses.push(biz);
        }
        if (createdBusinesses.length < 2) {
            console.warn('⚠️ Menos de 2 negocios encontrados/creados. Algunos otros seeds podrían fallar.');
        }
        const biz1 = createdBusinesses[0];
        const biz2 = createdBusinesses[1];
        console.log('ℹ️ Auto-vinculación de usuarios deshabilitada.');
        const dueSoon = new Date();
        dueSoon.setDate(dueSoon.getDate() + 1);
        const order1 = orderRepo.create({
            businessId: biz1.id,
            clientName: 'Cliente Urgente (Matias)',
            dueDate: dueSoon,
            priority: 10,
            status: enums_1.OrderStatus.IN_PROGRESS,
        });
        const savedOrder1 = await orderRepo.save(order1);
        await itemRepo.save([
            itemRepo.create({
                orderId: savedOrder1.id,
                name: 'Soporte Laptop Gamer',
                description: 'Diseño reforzado en PLA blanco',
                stlUrl: 'https://example.com/stl/soporte-laptop.stl',
                estimatedMinutes: 360,
                weightGrams: 240,
                price: 15.5,
                qty: 2,
                doneQty: 1,
            }),
            itemRepo.create({
                orderId: savedOrder1.id,
                name: 'Pikachu Articulado',
                description: 'Pintado a mano, 10cm',
                stlUrl: 'https://example.com/stl/pikachu.stl',
                estimatedMinutes: 120,
                weightGrams: 45,
                price: 25.0,
                qty: 1,
                doneQty: 0,
            }),
        ]);
        console.log('✅ Pedido 1 creado con 2 items.');
        const dueFar = new Date();
        dueFar.setDate(dueFar.getDate() + 10);
        const order2 = orderRepo.create({
            businessId: biz1.id,
            clientName: 'Juan Gomez (Pedidazo)',
            dueDate: dueFar,
            priority: 5,
            status: enums_1.OrderStatus.PENDING,
        });
        const savedOrder2 = await orderRepo.save(order2);
        await itemRepo.save([
            itemRepo.create({
                orderId: savedOrder2.id,
                name: 'Maceta Geometríca S',
                description: 'Material: PETG, Color: Negro',
                stlUrl: 'https://example.com/stl/maceta-s.stl',
                estimatedMinutes: 80,
                weightGrams: 30,
                price: 5.0,
                qty: 5,
                doneQty: 0,
            }),
            itemRepo.create({
                orderId: savedOrder2.id,
                name: 'Maceta Geometríca M',
                description: 'Material: PETG, Color: Negro',
                stlUrl: 'https://example.com/stl/maceta-m.stl',
                estimatedMinutes: 150,
                weightGrams: 65,
                price: 8.5,
                qty: 3,
                doneQty: 0,
            }),
            itemRepo.create({
                orderId: savedOrder2.id,
                name: 'Llavero Logotipo',
                description: 'Lote de llaveros corporativos',
                stlUrl: 'https://example.com/stl/logo.stl',
                estimatedMinutes: 15,
                weightGrams: 5,
                price: 1.5,
                qty: 20,
                doneQty: 0,
            }),
        ]);
        console.log('✅ Pedido 2 creado con 3 items.');
        const printerRepo = data_source_1.AppDataSource.getRepository(machine_entity_1.Machine);
        const baseMachines = [
            { name: 'Ender 3 S1 #1', model: 'Creality Ender 3 S1', nozzle: '0.4mm', status: enums_2.MachineStatus.IDLE, businessId: biz1.id },
            { name: 'Prusa MK3S+ #1', model: 'Prusa i3 MK3S+', nozzle: '0.6mm', status: enums_2.MachineStatus.PRINTING, businessId: biz1.id },
            { name: 'Artillery Genius #1', model: 'Artillery Genius Pro', nozzle: '0.4mm', status: enums_2.MachineStatus.IDLE, businessId: biz1.id },
        ];
        for (const p of baseMachines) {
            const exists = await printerRepo.findOne({ where: { name: p.name, businessId: p.businessId } });
            if (!exists) {
                await printerRepo.save(printerRepo.create(p));
                console.log(`✅ Impresora creada: ${p.name}`);
            }
        }
        console.log('🚀 Seeding completed successfully!');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}
seed();
//# sourceMappingURL=seed.js.map