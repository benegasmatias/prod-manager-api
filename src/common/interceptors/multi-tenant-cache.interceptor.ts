import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
    Logger,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { AppCacheService } from '../cache/app-cache.service';
import { getBusinessIdFromRequest } from '../../businesses/utils/business-request.utils';
import { Reflector } from '@nestjs/core';
import { CacheTTL } from '../cache/cache.constants';

/**
 * MultiTenantCacheInterceptor
 * Automatically caches GET responses based on businessId + URL + QueryParams.
 */
@Injectable()
export class MultiTenantCacheInterceptor implements NestInterceptor {
    private readonly logger = new Logger('CacheInterceptor');

    constructor(
        private readonly cacheService: AppCacheService,
        private readonly reflector: Reflector,
    ) { }

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
        const request = context.switchToHttp().getRequest();
        
        // Solo cacheamos peticiones GET
        if (request.method !== 'GET') return next.handle();

        const businessId = getBusinessIdFromRequest(request) || 'global';
        const route = request.path;
        const query = JSON.stringify(request.query || {});
        
        const resource = this.reflector.get<string>('cache:resource', context.getHandler()) || 'route';
        const extras = [route, query];

        // 1. Intentar obtener de caché
        const cachedResponse = await this.cacheService.get(resource, businessId, ...extras);

        if (cachedResponse) {
            this.logger.log(`🎯 [HIT] ${businessId} -> ${route}`);
            return of(cachedResponse);
        }

        // 2. Si no hay, ir a DB y guardar el resultado
        this.logger.debug(`☁️ [MISS] ${businessId} -> ${route}`);
        const ttl = this.reflector.get<number>('cache:ttl', context.getHandler()) || CacheTTL.MEDIUM;
        
        return next.handle().pipe(
            tap(async (response) => {
                if (response) {
                    await this.cacheService.set(resource, businessId, response, ttl * 1000, ...extras);
                }
            }),
        );
    }
}

/**
 * Decorador para configurar caché por endpoint
 */
export const TenantCache = (options: { ttl?: number; resource?: string }) => {
    return (target: any, key: string, descriptor: PropertyDescriptor) => {
        if (options.ttl) Reflect.defineMetadata('cache:ttl', options.ttl, descriptor.value);
        if (options.resource) Reflect.defineMetadata('cache:resource', options.resource, descriptor.value);
    };
};
