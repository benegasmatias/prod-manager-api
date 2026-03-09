"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const business_entity_1 = require("./src/businesses/entities/business.entity");
const user_entity_1 = require("./src/users/entities/user.entity");
const business_membership_entity_1 = require("./src/businesses/entities/business-membership.entity");
const typeorm_1 = require("@nestjs/typeorm");
const crypto = require("crypto");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const businessRepo = app.get((0, typeorm_1.getRepositoryToken)(business_entity_1.Business));
    const userRepo = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    const membershipRepo = app.get((0, typeorm_1.getRepositoryToken)(business_membership_entity_1.BusinessMembership));
    console.log('🚀 Seeding mock data...');
    const mockUsers = [
        { id: crypto.randomUUID(), email: 'juan.perez@example.com', fullName: 'Juan Perez', globalRole: 'USER', active: true },
        { id: crypto.randomUUID(), email: 'ana.garcia@example.com', fullName: 'Ana Garcia', globalRole: 'USER', active: true },
        { id: crypto.randomUUID(), email: 'admin.test@example.com', fullName: 'Admin Test', globalRole: 'ADMIN', active: true },
        { id: crypto.randomUUID(), email: 'user.blocked@example.com', fullName: 'User Bloqueado', globalRole: 'USER', active: false },
    ];
    const mockBusinesses = [
        { name: 'Carpintería Los Olivos', category: 'CARPINTERIA', status: 'ACTIVE', planId: 'PRO' },
        { name: 'Metalúrgica Ferro', category: 'METALURGICA', status: 'ACTIVE', planId: 'ENTERPRISE' },
        { name: 'Taller 3D Print', category: 'IMPRESION_3D', status: 'TRIAL', planId: 'FREE' },
        { name: 'Mecánica Veloz', category: 'MECANICA', status: 'SUSPENDED', planId: 'PRO' },
    ];
    for (const u of mockUsers) {
        const existing = await userRepo.findOneBy({ email: u.email });
        if (!existing) {
            const user = userRepo.create(u);
            await userRepo.save(user);
            console.log(`✅ User created: ${u.email}`);
        }
        else {
            console.log(`ℹ️ User already exists: ${u.email}`);
        }
    }
    for (const b of mockBusinesses) {
        const existingB = await businessRepo.findOneBy({ name: b.name });
        if (!existingB) {
            const business = businessRepo.create({
                ...b,
                trialExpiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                subscriptionExpiresAt: b.status === 'ACTIVE' ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null
            });
            const savedBusiness = await businessRepo.save(business);
            console.log(`✅ Business created: ${b.name}`);
            const owner = await userRepo.findOneBy({ email: mockUsers[0].email });
            if (owner) {
                const membership = membershipRepo.create({
                    userId: owner.id,
                    businessId: savedBusiness.id,
                    role: business_membership_entity_1.UserRole.ADMIN
                });
                await membershipRepo.save(membership);
            }
        }
        else {
            console.log(`ℹ️ Business already exists: ${b.name}`);
        }
    }
    console.log('✨ Seeding complete!');
    await app.close();
}
bootstrap();
//# sourceMappingURL=seed-mock-data.js.map