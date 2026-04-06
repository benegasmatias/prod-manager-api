export interface PlanLimits {
    maxBusinessesPerUser: number;
    maxMachinesPerBusiness: number;
    maxEmployeesPerBusiness: number;
    features: {
        hasMaterials: boolean;
        hasVisits: boolean;
        hasAdminStatus: boolean;
    };
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
    FREE: {
        maxBusinessesPerUser: 1,
        maxMachinesPerBusiness: 3,
        maxEmployeesPerBusiness: 2,
        features: {
            hasMaterials: false,
            hasVisits: false,
            hasAdminStatus: false,
        }
    },
    PRO: {
        maxBusinessesPerUser: 5,
        maxMachinesPerBusiness: 20,
        maxEmployeesPerBusiness: 15,
        features: {
            hasMaterials: true,
            hasVisits: true,
            hasAdminStatus: true,
        }
    },
    ENTERPRISE: {
        maxBusinessesPerUser: 999, // "Unlimited"
        maxMachinesPerBusiness: 999,
        maxEmployeesPerBusiness: 999,
        features: {
            hasMaterials: true,
            hasVisits: true,
            hasAdminStatus: true,
        }
    }
};
