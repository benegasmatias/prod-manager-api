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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const user_entity_1 = require("./entities/user.entity");
const businesses_service_1 = require("../businesses/businesses.service");
let UsersService = class UsersService {
    constructor(userRepository, businessesService) {
        this.userRepository = userRepository;
        this.businessesService = businessesService;
    }
    async findOne(id) {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${id} not found`);
        }
        return user;
    }
    async findOrCreate(id, email, fullName) {
        let user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            user = this.userRepository.create({ id, email, fullName });
            await this.userRepository.save(user);
        }
        else if (fullName && !user.fullName) {
            user.fullName = fullName;
            await this.userRepository.save(user);
        }
        return user;
    }
    async update(id, updateUserDto) {
        const user = await this.findOne(id);
        Object.assign(user, updateUserDto);
        return this.userRepository.save(user);
    }
    async setDefaultBusiness(userId, businessId) {
        console.log(`[UsersService] Setting default business ${businessId} for user ${userId}`);
        try {
            const hasAccess = await this.businessesService.checkAccess(userId, businessId);
            if (!hasAccess) {
                console.warn(`[UsersService] User ${userId} does not have access to business ${businessId}`);
                throw new common_1.ForbiddenException(`User does not have access to business ${businessId}`);
            }
            await this.userRepository.update(userId, { defaultBusinessId: businessId });
            const updatedUser = await this.findOne(userId);
            console.log(`[UsersService] Successfully updated default business for user ${userId}`);
            return updatedUser;
        }
        catch (error) {
            console.error(`[UsersService] Error setting default business:`, error.message, error.stack);
            throw error;
        }
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        businesses_service_1.BusinessesService])
], UsersService);
//# sourceMappingURL=users.service.js.map