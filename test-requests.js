"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./src/app.module");
const catalog_request_service_1 = require("./src/catalog-requests/services/catalog-request.service");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const service = app.get(catalog_request_service_1.CatalogRequestService);
    const businessId = '00a38fac-a26a-4e02-8269-4fb8bf89a6d6';
    const requests = await service.findAll(businessId);
    console.log(JSON.stringify(requests[0], null, 2));
    await app.close();
}
bootstrap();
//# sourceMappingURL=test-requests.js.map