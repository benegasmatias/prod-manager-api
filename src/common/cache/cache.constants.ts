/**
 * Cache Constants
 * Define global prefixes and TTLs to maintain consistency across the system.
 */

export const CACHE_NAMESPACE = 'pm'; // ProdManager namespace

export enum CacheTTL {
    SHORT = 60,         // 1 minute (e.g. lists being modified)
    MEDIUM = 300,       // 5 minutes (e.g. dashboard summary)
    LONG = 3600,        // 1 hour (e.g. business config, catalogs)
    VERY_LONG = 86400,  // 1 day (e.g. static templates)
}

export const CACHE_KEYS = {
    BUSINESS_CONFIG: 'business:config',
    BUSINESS_DASHBOARD: 'business:dashboard',
    BUSINESS_TEMPLATES: 'business:templates',
    MASTERS_PRODUCTS: 'masters:products',
    MASTERS_MATERIALS: 'masters:materials',
    SESSION: 'session',
};
