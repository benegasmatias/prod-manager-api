"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const typeorm_1 = require("typeorm");
async function run() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const ds = app.get(typeorm_1.DataSource);
    const businesses = await ds.query('SELECT id, name, category FROM businesses');
    console.log(JSON.stringify(businesses, null, 2));
    await app.close();
}
run();
//# sourceMappingURL=list_businesses.js.map