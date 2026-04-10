import { CACHE_NAMESPACE } from './cache.constants';

/**
 * CacheKeyBuilder
 * Utility to generate standardized, collision-free cache keys for a multi-tenant environment.
 */
export class CacheKeyBuilder {
    /**
     * Builds a standard key: namespace:businessId:resource:[optionalExtras]
     */
    static build(resource: string, businessId: string, ...extras: string[]): string {
        const parts = [
            CACHE_NAMESPACE,
            businessId || 'global',
            resource
        ];

        if (extras.length > 0) {
            parts.push(...extras);
        }

        return parts.join(':').toLowerCase();
    }

    /**
     * Builds a prefix for bulk invalidation: namespace:businessId:resource:*
     */
    static buildPrefix(businessId: string, resource?: string): string {
        const parts = [CACHE_NAMESPACE, businessId];
        if (resource) parts.push(resource);
        return parts.join(':').toLowerCase() + ':*';
    }

    /**
     * Standardizes a query params object into a string for key uniqueness
     */
    static hashParams(params: Record<string, any>): string {
        if (!params || Object.keys(params).length === 0) return '';
        
        // Sort keys to ensure same params result in same hash regardless of order
        const sortedKeys = Object.keys(params).sort();
        return sortedKeys
            .map(key => `${key}=${params[key]}`)
            .join('&');
    }
}
