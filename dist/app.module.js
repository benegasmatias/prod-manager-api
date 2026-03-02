"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = exports.createSupabaseDbConfig = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const nestjs_cls_1 = require("nestjs-cls");
const customers_module_1 = require("./customers/customers.module");
const products_module_1 = require("./products/products.module");
const orders_module_1 = require("./orders/orders.module");
const jobs_module_1 = require("./jobs/jobs.module");
const payments_module_1 = require("./payments/payments.module");
const printers_module_1 = require("./printers/printers.module");
const materials_module_1 = require("./materials/materials.module");
const createSupabaseDbConfig = (config) => ({
    type: 'postgres',
    host: config.get('DB_SUPABASE_HOST'),
    port: Number(config.get('DB_SUPABASE_PORT')),
    username: config.get('DB_SUPABASE_USERNAME'),
    password: config.get('DB_SUPABASE_PASSWORD'),
    database: config.get('DB_SUPABASE_NAME'),
    autoLoadEntities: true,
    synchronize: false,
    ssl: {
        rejectUnauthorized: false,
    },
});
exports.createSupabaseDbConfig = createSupabaseDbConfig;
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            nestjs_cls_1.ClsModule.forRoot({
                global: true,
                middleware: { mount: true },
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (configService) => (0, exports.createSupabaseDbConfig)(configService),
            }),
            customers_module_1.CustomersModule,
            products_module_1.ProductsModule,
            orders_module_1.OrdersModule,
            jobs_module_1.JobsModule,
            payments_module_1.PaymentsModule,
            printers_module_1.PrintersModule,
            materials_module_1.MaterialsModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map