export interface PlanLimits {
    maxBusinessesPerUser: number;
    maxMachinesPerBusiness: number;
    maxEmployeesPerBusiness: number;
    maxOrdersPerMonth: number;
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
        maxEmployeesPerBusiness: 1,
        maxOrdersPerMonth: 10,
        features: {
            hasMaterials: false,
            hasVisits: false,
            hasAdminStatus: false,
        }
    },
    PRO: {
        maxBusinessesPerUser: 1,
        maxMachinesPerBusiness: 10,
        maxEmployeesPerBusiness: 3,
        maxOrdersPerMonth: 50,
        features: {
            hasMaterials: true,
            hasVisits: true,
            hasAdminStatus: true,
        }
    },
    ENTERPRISE: {
        maxBusinessesPerUser: 1,
        maxMachinesPerBusiness: 50,
        maxEmployeesPerBusiness: 7,
        maxOrdersPerMonth: 500,
        features: {
            hasMaterials: true,
            hasVisits: true,
            hasAdminStatus: true,
        }
    }
};
