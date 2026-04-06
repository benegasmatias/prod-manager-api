"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequireBusinessRole = exports.ROLES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.ROLES_KEY = 'business_roles';
const RequireBusinessRole = (...roles) => (0, common_1.SetMetadata)(exports.ROLES_KEY, roles);
exports.RequireBusinessRole = RequireBusinessRole;
//# sourceMappingURL=require-business-role.decorator.js.map