import { Global, Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { AppCacheService } from './app-cache.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');
        const logger = new Logger('AppCacheModule');

        if (redisUrl) {
          logger.log('🚀 Cache Store: REDIS enabled');
          const store = await redisStore({
            url: redisUrl,
            ttl: 600000,
          });
          return { store: store as any };
        }

        logger.warn('⚠️ Cache Store: MEMORY (No REDIS_URL found)');
        return {
          ttl: 600000,
          max: 1000,
        } as any;
      },
    }),
  ],
  providers: [AppCacheService],
  exports: [AppCacheService, CacheModule],
})
export class AppCacheModule {}
