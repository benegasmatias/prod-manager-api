"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilterOrderDto = exports.UpdateOrderDto = exports.CreateOrderDto = exports.CreateOrderItemDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const enums_1 = require("../../common/enums");
class CreateOrderItemDto {
    productId;
    quantity;
    unitPrice;
}
exports.CreateOrderItemDto = CreateOrderItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateOrderItemDto.prototype, "productId", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateOrderItemDto.prototype, "quantity", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Number)
], CreateOrderItemDto.prototype, "unitPrice", void 0);
class CreateOrderDto {
    customerId;
    dueDate;
    items;
}
exports.CreateOrderDto = CreateOrderDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateOrderDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], CreateOrderDto.prototype, "dueDate", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CreateOrderItemDto),
    __metadata("design:type", Array)
], CreateOrderDto.prototype, "items", void 0);
class UpdateOrderDto {
    status;
    priority;
    dueDate;
}
exports.UpdateOrderDto = UpdateOrderDto;
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.OrderStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.Priority),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], UpdateOrderDto.prototype, "priority", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], UpdateOrderDto.prototype, "dueDate", void 0);
class FilterOrderDto {
    status;
    fromDueDate;
    toDueDate;
    customerId;
    q;
    page;
    limit;
}
exports.FilterOrderDto = FilterOrderDto;
__decorate([
    (0, class_validator_1.IsEnum)(enums_1.OrderStatus),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterOrderDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], FilterOrderDto.prototype, "fromDueDate", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Date)
], FilterOrderDto.prototype, "toDueDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterOrderDto.prototype, "customerId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], FilterOrderDto.prototype, "q", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], FilterOrderDto.prototype, "page", void 0);
__decorate([
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], FilterOrderDto.prototype, "limit", void 0);
//# sourceMappingURL=order.dto.js.map