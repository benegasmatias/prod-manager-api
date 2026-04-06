"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAN_LIMITS = void 0;
exports.PLAN_LIMITS = {
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
        maxBusinessesPerUser: 999,
        maxMachinesPerBusiness: 999,
        maxEmployeesPerBusiness: 999,
        features: {
            hasMaterials: true,
            hasVisits: true,
            hasAdminStatus: true,
        }
    }
};
//# sourceMappingURL=plan-limits.config.js.map