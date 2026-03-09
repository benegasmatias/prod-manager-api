"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const global_role_config_entity_1 = require("./src/admin/entities/global-role-config.entity");
const typeorm_1 = require("@nestjs/typeorm");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const repo = app.get((0, typeorm_1.getRepositoryToken)(global_role_config_entity_1.GlobalRoleConfig));
    console.log('🚀 Seeding role configs...');
    const configs = [
        {
            role: 'SUPER_ADMIN',
            description: 'Control total del ecosistema, gestión de otros administradores y configuración de sistema.',
            capabilities: {
                'Eliminar Organizaciones': true,
                'Suspender Usuarios': true,
                'Modificar Planes y Precios': true,
                'Ver Logs de Auditoría': true
            }
        },
        {
            role: 'ADMIN',
            description: 'Gestión de negocios, usuarios y suscripciones. Sin acceso a configuraciones críticas de sistema.',
            capabilities: {
                'Eliminar Organizaciones': false,
                'Suspender Usuarios': true,
                'Modificar Planes y Precios': false,
                'Ver Logs de Auditoría': true
            }
        },
        {
            role: 'SUPPORT',
            description: 'Acceso de solo lectura a datos de usuarios y negocios para resolución de problemas técnicos.',
            capabilities: {
                'Eliminar Organizaciones': false,
                'Suspender Usuarios': false,
                'Modificar Planes y Precios': false,
                'Ver Logs de Auditoría': true
            }
        }
    ];
    for (const c of configs) {
        const existing = await repo.findOneBy({ role: c.role });
        if (!existing) {
            await repo.save(repo.create(c));
            console.log(`✅ Config created for ${c.role}`);
        }
        else {
            await repo.update(c.role, c);
            console.log(`ℹ️ Config updated for ${c.role}`);
        }
    }
    console.log('✨ Role seeding complete!');
    await app.close();
}
bootstrap();
//# sourceMappingURL=seed-roles.js.map