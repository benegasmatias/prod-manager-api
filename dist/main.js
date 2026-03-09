"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
    }));
    app.useGlobalFilters(new http_exception_filter_1.AllExceptionsFilter());
    app.enableCors({
        origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    const port = process.env.PORT || 3030;
    await app.listen(port);
    console.log(`🚀 API running on: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map