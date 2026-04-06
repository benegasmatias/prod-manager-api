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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const files_service_1 = require("./files.service");
const supabase_auth_guard_1 = require("../users/guards/supabase-auth.guard");
let FilesController = class FilesController {
    constructor(filesService) {
        this.filesService = filesService;
    }
    async upload(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        return this.filesService.uploadFile(file);
    }
    async delete(path) {
        if (!path) {
            throw new common_1.BadRequestException('Path is required');
        }
        return this.filesService.deleteFile(path);
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "upload", null);
__decorate([
    (0, common_1.Delete)('delete'),
    __param(0, (0, common_1.Body)('path')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "delete", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)('files'),
    (0, common_1.UseGuards)(supabase_auth_guard_1.SupabaseAuthGuard),
    __metadata("design:paramtypes", [files_service_1.FilesService])
], FilesController);
//# sourceMappingURL=files.controller.js.map