import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from './customers/customers.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { JobsModule } from './jobs/jobs.module';
import { PaymentsModule } from './payments/payments.module';
import { MachinesModule } from './machines/machines.module';
import { MaterialsModule } from './materials/materials.module';
import { UsersModule } from './users/users.module';
import { BusinessesModule } from './businesses/businesses.module';
import { ReportsModule } from './reports/reports.module';
import { EmployeesModule } from './employees/employees.module';
import { AdminModule } from './admin/admin.module';
import { FilesModule } from './files/files.module';
import { AuditModule } from './audit/audit.module';
import { MailModule } from './common/mail/mail.module';
import { RetailModule } from './retail/retail.module';

@Module({
  imports: [
    AuditModule,
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get<string>('DATABASE_URL'),
        autoLoadEntities: true,
        synchronize: configService.get<string>('DB_SYNCHRONIZE') === 'true', // Only for dev, set DB_SYNCHRONIZE=false in Render
        ssl: configService.get<string>('DB_SSL') === 'true' ? { rejectUnauthorized: false } : false,
        extra: {
          max: 30,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000,
        }
      }),
    }),
    CustomersModule,
    ProductsModule,
    OrdersModule,
    JobsModule,
    PaymentsModule,
    MachinesModule,
    MaterialsModule,
    UsersModule,
    BusinessesModule,
    ReportsModule,
    EmployeesModule,
    AdminModule,
    FilesModule,
    MailModule,
    RetailModule,
  ],
})
export class AppModule { }
