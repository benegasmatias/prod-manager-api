"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialType = exports.ProductionJobPriority = exports.ProductionJobStatus = exports.OrderItemStatus = exports.WebhookStatus = exports.SubscriptionStatus = exports.BusinessRole = exports.BusinessStatus = exports.PaymentMethod = exports.FileType = exports.Priority = exports.MachineStatus = exports.JobStatus = exports.OrderStatus = exports.OrderType = void 0;
var OrderType;
(function (OrderType) {
    OrderType["CLIENT"] = "CLIENT";
    OrderType["STOCK"] = "STOCK";
})(OrderType || (exports.OrderType = OrderType = {}));
var OrderStatus;
(function (OrderStatus) {
    OrderStatus["PENDING"] = "PENDING";
    OrderStatus["IN_PROGRESS"] = "IN_PROGRESS";
    OrderStatus["DONE"] = "DONE";
    OrderStatus["DRAFT"] = "DRAFT";
    OrderStatus["CONFIRMED"] = "CONFIRMED";
    OrderStatus["READY"] = "READY";
    OrderStatus["DELIVERED"] = "DELIVERED";
    OrderStatus["CANCELLED"] = "CANCELLED";
    OrderStatus["DESIGN"] = "DESIGN";
    OrderStatus["CUTTING"] = "CUTTING";
    OrderStatus["WELDING"] = "WELDING";
    OrderStatus["ASSEMBLY"] = "ASSEMBLY";
    OrderStatus["PAINTING"] = "PAINTING";
    OrderStatus["BARNIZADO"] = "BARNIZADO";
    OrderStatus["POST_PROCESS"] = "POST_PROCESS";
    OrderStatus["FAILED"] = "FAILED";
    OrderStatus["REPRINT_PENDING"] = "REPRINT_PENDING";
    OrderStatus["RE_WORK"] = "RE_WORK";
    OrderStatus["IN_STOCK"] = "IN_STOCK";
    OrderStatus["SITE_VISIT"] = "SITE_VISIT";
    OrderStatus["SITE_VISIT_DONE"] = "SITE_VISIT_DONE";
    OrderStatus["VISITA_REPROGRAMADA"] = "VISITA_REPROGRAMADA";
    OrderStatus["VISITA_CANCELADA"] = "VISITA_CANCELADA";
    OrderStatus["QUOTATION"] = "QUOTATION";
    OrderStatus["BUDGET_GENERATED"] = "BUDGET_GENERATED";
    OrderStatus["BUDGET_REJECTED"] = "BUDGET_REJECTED";
    OrderStatus["SURVEY_DESIGN"] = "SURVEY_DESIGN";
    OrderStatus["APPROVED"] = "APPROVED";
    OrderStatus["OFFICIAL_ORDER"] = "OFFICIAL_ORDER";
    OrderStatus["INSTALACION_OBRA"] = "INSTALACION_OBRA";
    OrderStatus["ARMADO"] = "ARMADO";
})(OrderStatus || (exports.OrderStatus = OrderStatus = {}));
var JobStatus;
(function (JobStatus) {
    JobStatus["QUEUED"] = "QUEUED";
    JobStatus["PRINTING"] = "PRINTING";
    JobStatus["PAUSED"] = "PAUSED";
    JobStatus["FAILED"] = "FAILED";
    JobStatus["DONE"] = "DONE";
    JobStatus["CANCELLED"] = "CANCELLED";
})(JobStatus || (exports.JobStatus = JobStatus = {}));
var MachineStatus;
(function (MachineStatus) {
    MachineStatus["IDLE"] = "IDLE";
    MachineStatus["PRINTING"] = "PRINTING";
    MachineStatus["MAINTENANCE"] = "MAINTENANCE";
    MachineStatus["DOWN"] = "DOWN";
})(MachineStatus || (exports.MachineStatus = MachineStatus = {}));
var Priority;
(function (Priority) {
    Priority["LOW"] = "LOW";
    Priority["NORMAL"] = "NORMAL";
    Priority["HIGH"] = "HIGH";
    Priority["URGENT"] = "URGENT";
})(Priority || (exports.Priority = Priority = {}));
var FileType;
(function (FileType) {
    FileType["STL"] = "STL";
    FileType["THREE_MF"] = "3MF";
    FileType["OBJ"] = "OBJ";
    FileType["IMAGE"] = "IMAGE";
    FileType["OTHER"] = "OTHER";
})(FileType || (exports.FileType = FileType = {}));
var PaymentMethod;
(function (PaymentMethod) {
    PaymentMethod["CASH"] = "CASH";
    PaymentMethod["TRANSFER"] = "TRANSFER";
    PaymentMethod["CARD"] = "CARD";
    PaymentMethod["MP"] = "MP";
})(PaymentMethod || (exports.PaymentMethod = PaymentMethod = {}));
var BusinessStatus;
(function (BusinessStatus) {
    BusinessStatus["DRAFT"] = "DRAFT";
    BusinessStatus["ACTIVE"] = "ACTIVE";
    BusinessStatus["SUSPENDED"] = "SUSPENDED";
    BusinessStatus["ARCHIVED"] = "ARCHIVED";
})(BusinessStatus || (exports.BusinessStatus = BusinessStatus = {}));
var BusinessRole;
(function (BusinessRole) {
    BusinessRole["OWNER"] = "OWNER";
    BusinessRole["BUSINESS_ADMIN"] = "BUSINESS_ADMIN";
    BusinessRole["SALES"] = "SALES";
    BusinessRole["OPERATOR"] = "OPERATOR";
    BusinessRole["VIEWER"] = "VIEWER";
})(BusinessRole || (exports.BusinessRole = BusinessRole = {}));
var SubscriptionStatus;
(function (SubscriptionStatus) {
    SubscriptionStatus["TRIALING"] = "TRIALING";
    SubscriptionStatus["ACTIVE"] = "ACTIVE";
    SubscriptionStatus["PAST_DUE"] = "PAST_DUE";
    SubscriptionStatus["SUSPENDED"] = "SUSPENDED";
    SubscriptionStatus["CANCELED"] = "CANCELED";
    SubscriptionStatus["EXPIRED"] = "EXPIRED";
})(SubscriptionStatus || (exports.SubscriptionStatus = SubscriptionStatus = {}));
var WebhookStatus;
(function (WebhookStatus) {
    WebhookStatus["RECEIVED"] = "RECEIVED";
    WebhookStatus["PROCESSED"] = "PROCESSED";
    WebhookStatus["FAILED"] = "FAILED";
    WebhookStatus["IGNORED"] = "IGNORED";
})(WebhookStatus || (exports.WebhookStatus = WebhookStatus = {}));
var OrderItemStatus;
(function (OrderItemStatus) {
    OrderItemStatus["PENDING"] = "PENDING";
    OrderItemStatus["IN_PROGRESS"] = "IN_PROGRESS";
    OrderItemStatus["READY"] = "READY";
    OrderItemStatus["DONE"] = "DONE";
    OrderItemStatus["FAILED"] = "FAILED";
    OrderItemStatus["CANCELLED"] = "CANCELLED";
})(OrderItemStatus || (exports.OrderItemStatus = OrderItemStatus = {}));
var ProductionJobStatus;
(function (ProductionJobStatus) {
    ProductionJobStatus["QUEUED"] = "QUEUED";
    ProductionJobStatus["IN_PROGRESS"] = "IN_PROGRESS";
    ProductionJobStatus["PAUSED"] = "PAUSED";
    ProductionJobStatus["DONE"] = "DONE";
    ProductionJobStatus["FAILED"] = "FAILED";
    ProductionJobStatus["CANCELLED"] = "CANCELLED";
})(ProductionJobStatus || (exports.ProductionJobStatus = ProductionJobStatus = {}));
var ProductionJobPriority;
(function (ProductionJobPriority) {
    ProductionJobPriority["LOW"] = "LOW";
    ProductionJobPriority["NORMAL"] = "NORMAL";
    ProductionJobPriority["HIGH"] = "HIGH";
    ProductionJobPriority["URGENT"] = "URGENT";
})(ProductionJobPriority || (exports.ProductionJobPriority = ProductionJobPriority = {}));
var MaterialType;
(function (MaterialType) {
    MaterialType["PLA"] = "PLA";
    MaterialType["PETG"] = "PETG";
    MaterialType["ABS"] = "ABS";
    MaterialType["TPU"] = "TPU";
    MaterialType["RESINA"] = "RESINA";
    MaterialType["CA\u00D1O"] = "CA\u00D1O";
    MaterialType["PERFIL"] = "PERFIL";
    MaterialType["CHAPA"] = "CHAPA";
    MaterialType["BARRA"] = "BARRA";
    MaterialType["PLACA"] = "PLACA";
    MaterialType["MADERA"] = "MADERA";
    MaterialType["HERRAJE"] = "HERRAJE";
    MaterialType["INSUMO"] = "INSUMO";
})(MaterialType || (exports.MaterialType = MaterialType = {}));
//# sourceMappingURL=enums.js.map