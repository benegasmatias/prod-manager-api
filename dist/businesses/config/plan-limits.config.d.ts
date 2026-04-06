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
export declare const PLAN_LIMITS: Record<string, PlanLimits>;
