import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Redis } from 'ioredis';
import { CacheKeyBuilder } from './cache-key.builder';

@Injectable()
export class AppCacheService {
    private readonly logger = new Logger(AppCacheService.name);

    constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) { }

    /**
     * Get a value from cache
     */
    async get<T>(resource: string, businessId: string, ...extras: string[]): Promise<T | undefined> {
        const key = CacheKeyBuilder.build(resource, businessId, ...extras);
        return await this.cacheManager.get<T>(key);
    }

    /**
     * Set a value in cache with multi-tenant isolation
     */
    async set(resource: string, businessId: string, value: any, ttl?: number, ...extras: string[]): Promise<void> {
        const key = CacheKeyBuilder.build(resource, businessId, ...extras);
        await this.cacheManager.set(key, value, ttl);
    }

    /**
     * Delete a specific key
     */
    async del(resource: string, businessId: string, ...extras: string[]): Promise<void> {
        const key = CacheKeyBuilder.build(resource, businessId, ...extras);
        await this.cacheManager.del(key);
    }

    /**
     * Invalidate all keys for a specific business and resource
     */
    async invalidate(businessId: string, resource?: string): Promise<void> {
        const prefix = CacheKeyBuilder.buildPrefix(businessId, resource);
        await this.deleteByPattern(prefix);
    }

    /**
     * Utility to delete keys by pattern (Optimized for Redis if available)
     */
    async deleteByPattern(pattern: string): Promise<void> {
        try {
            // En cache-manager v5+, accedemos vía .stores[0]
            const cacheAny = this.cacheManager as any;
            const store = cacheAny.store || (cacheAny.stores ? cacheAny.stores[0] : null);
            
            if (!store) return;

            // Intentar obtener el cliente de Redis (Keyv o nativo)
            const redis: Redis = store.client || store.redis || (store.instance ? store.instance.client : null);

            if (redis && typeof redis.scan === 'function') {
                this.logger.debug(`Invalidating keys with pattern: ${pattern}`);
                let cursor = '0';
                do {
                    const [nextCursor, keys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                    cursor = nextCursor;
                    if (keys.length > 0) {
                        await redis.del(...keys);
                    }
                } while (cursor !== '0');
            } else {
                this.logger.warn(`Invalidación por prefijo ${pattern} no disponible (requiere Redis).`);
            }
        } catch (error) {
            this.logger.error(`Error durante la invalidación por patrón ${pattern}:`, error);
        }
    }

    /**
     * Handy method to cache a resolved function result (Wrap pattern)
     */
    async wrap<T>(
        resource: string, 
        businessId: string, 
        fn: () => Promise<T>, 
        ttl?: number, 
        ...extras: string[]
    ): Promise<T> {
        const key = CacheKeyBuilder.build(resource, businessId, ...extras);
        const cached = await this.cacheManager.get<T>(key);
        
        if (cached !== undefined) return cached;

        const result = await fn();
        await this.cacheManager.set(key, result, ttl);
        return result;
    }
}
