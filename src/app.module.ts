import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ClsModule } from 'nestjs-cls';
import { DataSourceOptions } from 'typeorm';

import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { JobsModule } from './jobs/jobs.module';
import { PaymentsModule } from './payments/payments.module';
import { PrintersModule } from './printers/printers.module';
import { MaterialsModule } from './materials/materials.module';

export const createSupabaseDbConfig = (
  config: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: config.get<string>('DB_SUPABASE_HOST'),
  port: Number(config.get<number>('DB_SUPABASE_PORT')),
  username: config.get<string>('DB_SUPABASE_USERNAME'),
  password: config.get<string>('DB_SUPABASE_PASSWORD'),
  database: config.get<string>('DB_SUPABASE_NAME'),
  autoLoadEntities: true,
  synchronize: false, // Recomendado para Supabase en producción
  ssl: {
    rejectUnauthorized: false,
  },
});

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ClsModule.forRoot({
      global: true,
      middleware: { mount: true },
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        createSupabaseDbConfig(configService),
    }),
    CustomersModule,
    ProductsModule,
    OrdersModule,
    JobsModule,
    PaymentsModule,
    PrintersModule,
    MaterialsModule,
  ],
})
export class AppModule { }
