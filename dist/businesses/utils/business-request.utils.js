"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBusinessIdFromRequest = getBusinessIdFromRequest;
function getBusinessIdFromRequest(request) {
    let businessId = request.params?.id || request.params?.businessId;
    if (!businessId) {
        businessId = request.query?.businessId;
    }
    if (!businessId) {
        businessId = request.body?.businessId;
    }
    return businessId || null;
}
//# sourceMappingURL=business-request.utils.js.map