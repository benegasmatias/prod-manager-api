"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AllowBusinessStatuses = exports.BUSINESS_STATUSES_KEY = void 0;
const common_1 = require("@nestjs/common");
exports.BUSINESS_STATUSES_KEY = 'businessStatuses';
const AllowBusinessStatuses = (...statuses) => (0, common_1.SetMetadata)(exports.BUSINESS_STATUSES_KEY, statuses);
exports.AllowBusinessStatuses = AllowBusinessStatuses;
//# sourceMappingURL=allow-business-statuses.decorator.js.map