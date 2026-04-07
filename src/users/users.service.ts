import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { BusinessesService } from '../businesses/businesses.service';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private readonly userRepository: Repository<User>,
        private readonly businessesService: BusinessesService,
    ) { }

    async findOne(id: string): Promise<User> {
        const user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
        }
        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userRepository.findOne({ where: { email } });
    }

    async findOrCreate(id: string, email: string, fullName?: string): Promise<User> {
        let user = await this.userRepository.findOne({ where: { id } });
        if (!user) {
            user = this.userRepository.create({ id, email, fullName });
            await this.userRepository.save(user);
        } else if (fullName && !user.fullName) {
            // Si el usuario existe pero no tiene nombre (por registros viejos), lo actualizamos
            user.fullName = fullName;
            await this.userRepository.save(user);
        }
        return user;
    }

    async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
        const user = await this.findOne(id);
        Object.assign(user, updateUserDto);
        return this.userRepository.save(user);
    }

    async setDefaultBusiness(userId: string, businessId: string): Promise<User> {
        console.log(`[UsersService] Setting default business ${businessId} for user ${userId}`);
        try {
            const hasAccess = await this.businessesService.checkAccess(userId, businessId);
            if (!hasAccess) {
                console.warn(`[UsersService] User ${userId} does not have access to business ${businessId}`);
                throw new ForbiddenException(`El usuario no tiene acceso al negocio ${businessId}`);
            }

            // Usar update parcial para evitar problemas con la instancia completa
            await this.userRepository.update(userId, { defaultBusinessId: businessId });

            const updatedUser = await this.findOne(userId);
            console.log(`[UsersService] Successfully updated default business for user ${userId}`);
            return updatedUser;
        } catch (error) {
            console.error(`[UsersService] Error setting default business:`, error.message, error.stack);
            throw error;
        }
    }
}
