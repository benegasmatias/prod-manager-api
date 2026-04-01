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
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../common/supabase/supabase.service");
let FilesService = class FilesService {
    constructor(supabaseService) {
        this.supabaseService = supabaseService;
    }
    async uploadFile(file, path = 'stls') {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        const client = this.supabaseService.getClient();
        const fileName = `${Date.now()}-${file.originalname}`;
        const filePath = `${path}/${fileName}`;
        const { data, error } = await client.storage
            .from('prodmanager-files')
            .upload(filePath, file.buffer, {
            contentType: file.mimetype,
            upsert: false,
        });
        if (error) {
            throw new common_1.BadRequestException(`Upload error: ${error.message}`);
        }
        const { data: publicUrlData } = client.storage
            .from('prodmanager-files')
            .getPublicUrl(filePath);
        return {
            url: publicUrlData.publicUrl,
            path: filePath,
            fileName: file.originalname,
            size: file.size,
            mimeType: file.mimetype,
        };
    }
    async deleteFile(filePath) {
        const client = this.supabaseService.getClient();
        const { error } = await client.storage
            .from('prodmanager-files')
            .remove([filePath]);
        if (error) {
            throw new common_1.BadRequestException(`Delete error: ${error.message}`);
        }
        return { success: true };
    }
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], FilesService);
//# sourceMappingURL=files.service.js.map