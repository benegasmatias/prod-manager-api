"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const user_entity_1 = require("./src/users/entities/user.entity");
const typeorm_1 = require("@nestjs/typeorm");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const userRepository = app.get((0, typeorm_1.getRepositoryToken)(user_entity_1.User));
    const email = 'benegas.matias21@gmail.com';
    const user = await userRepository.findOneBy({ email });
    if (user) {
        user.globalRole = 'SUPER_ADMIN';
        user.active = true;
        await userRepository.save(user);
        console.log(`✅ User ${email} promoted to SUPER_ADMIN`);
    }
    else {
        console.log(`❌ User ${email} not found in database. Please log into the app first to create the profile.`);
    }
    await app.close();
}
bootstrap();
//# sourceMappingURL=seed-admin.js.map