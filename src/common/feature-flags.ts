export function isFeatureEnabled(
    feature: string,
    business?: { id: string; category?: string; capabilities?: string[]; capabilitiesOverride?: any; metadata?: any }
): boolean {
    if (feature === 'ENABLE_PARALLEL_PRODUCTION') {
        // 1. Direct environment variable overrides
        const envVal = process.env.ENABLE_PARALLEL_PRODUCTION;
        if (envVal === 'true') {
            return true;
        }
        if (envVal === 'false') {
            return false;
        }

        // 2. Progressive rollout by specific business IDs via env
        if (business?.id && process.env.ENABLED_PARALLEL_PRODUCTION_BUSINESS_IDS) {
            const enabledBizIds = process.env.ENABLED_PARALLEL_PRODUCTION_BUSINESS_IDS.split(',').map(id => id.trim());
            if (enabledBizIds.includes(business.id)) {
                return true;
            }
        }

        // 3. Rollout by explicit business capabilities or metadata flags
        if (business) {
            if (business.capabilities?.includes('ENABLE_PARALLEL_PRODUCTION')) {
                return true;
            }
            if (
                business.capabilitiesOverride?.ENABLE_PARALLEL_PRODUCTION === true ||
                business.capabilitiesOverride?.enableParallelProduction === true
            ) {
                return true;
            }
            if (business.metadata?.enableParallelProduction === true) {
                return true;
            }
        }

        // 4. Default activation rule: enabled ONLY for IMPRESION_3D in dev/testing environments
        const isDevOrTest = !process.env.NODE_ENV || ['development', 'test', 'qa'].includes(process.env.NODE_ENV);
        if (isDevOrTest && business?.category === 'IMPRESION_3D') {
            return true;
        }

        // Disabled by default
        return false;
    }

    return false;
}
