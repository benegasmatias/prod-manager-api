import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
export declare const createSupabaseDbConfig: (config: ConfigService) => TypeOrmModuleOptions;
export declare class AppModule {
}
