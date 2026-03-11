"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaterialType = exports.ProductFileRole = exports.PaymentMethod = exports.FileType = exports.Priority = exports.PrinterStatus = exports.JobStatus = exports.OrderStatus = exports.OrderType = void 0;
var OrderType;
(function (OrderType) {
    OrderType["CUSTOMER"] = "CUSTOMER";
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
var PrinterStatus;
(function (PrinterStatus) {
    PrinterStatus["IDLE"] = "IDLE";
    PrinterStatus["PRINTING"] = "PRINTING";
    PrinterStatus["MAINTENANCE"] = "MAINTENANCE";
    PrinterStatus["DOWN"] = "DOWN";
})(PrinterStatus || (exports.PrinterStatus = PrinterStatus = {}));
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
var ProductFileRole;
(function (ProductFileRole) {
    ProductFileRole["MODEL"] = "MODEL";
    ProductFileRole["PREVIEW"] = "PREVIEW";
    ProductFileRole["INSTRUCTIONS"] = "INSTRUCTIONS";
})(ProductFileRole || (exports.ProductFileRole = ProductFileRole = {}));
var MaterialType;
(function (MaterialType) {
    MaterialType["PLA"] = "PLA";
    MaterialType["PETG"] = "PETG";
    MaterialType["ABS"] = "ABS";
    MaterialType["TPU"] = "TPU";
    MaterialType["RESIN"] = "RESIN";
    MaterialType["LIMPIEZA"] = "LIMPIEZA";
    MaterialType["PERFIL"] = "PERFIL";
    MaterialType["CHAPA"] = "CHAPA";
    MaterialType["MACHO"] = "MACHO";
    MaterialType["HIERRO"] = "HIERRO";
    MaterialType["ACERO"] = "ACERO";
    MaterialType["PLACA"] = "PLACA";
    MaterialType["MADERA"] = "MADERA";
    MaterialType["HERRAJE"] = "HERRAJE";
    MaterialType["INSUMO"] = "INSUMO";
    MaterialType["PRODUCTO"] = "PRODUCTO";
    MaterialType["OTRO"] = "OTRO";
})(MaterialType || (exports.MaterialType = MaterialType = {}));
//# sourceMappingURL=enums.js.map