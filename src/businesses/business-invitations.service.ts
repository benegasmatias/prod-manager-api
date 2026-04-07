import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { BusinessInvitation, InvitationStatus } from './entities/business-invitation.entity';
import { BusinessMembership } from './entities/business-membership.entity';
import { User } from '../users/entities/user.entity';
import { Employee } from '../employees/entities/employee.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BusinessInvitationsService {
    constructor(
        @InjectRepository(BusinessInvitation)
        private invitationRepo: Repository<BusinessInvitation>,
        @InjectRepository(BusinessMembership)
        private membershipRepo: Repository<BusinessMembership>,
        @InjectRepository(User)
        private userRepo: Repository<User>,
        @InjectRepository(Employee)
        private employeeRepo: Repository<Employee>,
        private dataSource: DataSource,
    ) {}

    async checkEmail(businessId: string, email: string) {
        const emailLower = email.toLowerCase();
        
        const user = await this.userRepo.findOne({ 
            where: { email: emailLower }
        });
        
        const membership = await this.membershipRepo.findOne({ 
            where: { businessId, userId: user?.id } 
        });

        const pendingInvite = await this.invitationRepo.findOne({
            where: { businessId, email: emailLower, status: InvitationStatus.PENDING }
        });

        // Parse names for the response shape requested
        const parts = user?.fullName?.split(' ') || [];
        const firstName = parts[0] || user?.email?.split('@')[0] || '';
        const lastName = parts.slice(1).join(' ') || '';

        return {
            email: emailLower,
            userExists: !!user,
            alreadyMember: !!membership,
            pendingInvitation: !!pendingInvite,
            user: user ? {
                id: user.id,
                firstName,
                lastName
            } : null
        };
    }

    async checkStatus(businessId: string, email: string) {
        // Legacy or internal check
        return this.checkEmail(businessId, email);
    }

    async createInvitation(
        businessId: string,
        email: string,
        role: string,
        invitedByUserId: string,
        metadata?: { firstName?: string; lastName?: string; phone?: string; specialty?: string }
    ): Promise<BusinessInvitation> {
        const emailLower = email.toLowerCase();

        const user = await this.userRepo.findOne({ where: { email: emailLower } });
        if (user) {
            const membership = await this.membershipRepo.findOne({ where: { businessId, userId: user.id } });
            if (membership) {
                throw new BadRequestException('Esta persona ya es miembro de este negocio');
            }
        }

        const existing = await this.invitationRepo.findOne({
            where: { businessId, email: emailLower, status: InvitationStatus.PENDING },
        });

        if (existing) {
            existing.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            return this.invitationRepo.save(existing);
        }

        const invitation = this.invitationRepo.create({
            businessId,
            email: emailLower,
            role,
            invitedByUserId,
            firstName: metadata?.firstName,
            lastName: metadata?.lastName,
            phone: metadata?.phone,
            specialty: metadata?.specialty,
            token: uuidv4(),
            status: InvitationStatus.PENDING,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
        });

        return this.invitationRepo.save(invitation);
    }

    async findByToken(token: string): Promise<BusinessInvitation> {
        const invitation = await this.invitationRepo.findOne({
            where: { token },
            relations: ['business', 'invitedByUser'],
        });

        if (!invitation) {
            throw new NotFoundException('Invitación no encontrada');
        }

        return invitation;
    }

    async validateInvitation(token: string, userEmail: string): Promise<BusinessInvitation> {
        const invitation = await this.findByToken(token);

        if (invitation.status !== InvitationStatus.PENDING) {
            throw new BadRequestException('Esta invitación ya no está pendiente');
        }

        if (invitation.expiresAt < new Date()) {
            invitation.status = InvitationStatus.EXPIRED;
            await this.invitationRepo.save(invitation);
            throw new BadRequestException('La invitación ha expirado');
        }

        if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
            throw new BadRequestException('Esta invitación fue enviada a otro correo electrónico');
        }

        return invitation;
    }

    async acceptInvitation(token: string, userId: string, userEmail: string): Promise<BusinessMembership> {
        const invitation = await this.validateInvitation(token, userEmail);

        return await this.dataSource.transaction(async (manager) => {
            // 1. Crear membresía
            const membership = manager.create(BusinessMembership, {
                businessId: invitation.businessId,
                userId,
                role: invitation.role as any,
                invitedByUserId: invitation.invitedByUserId,
                status: 'ACTIVE',
            });

            const savedMembership = await manager.save(BusinessMembership, membership);

            // 2. Crear registro de empleado (operacional) si no existe
            const existingEmployee = await manager.findOne(Employee, { 
                where: { businessId: invitation.businessId, email: invitation.email } 
            });

            if (!existingEmployee) {
                const employee = manager.create(Employee, {
                    businessId: invitation.businessId,
                    firstName: invitation.firstName || userEmail.split('@')[0],
                    lastName: invitation.lastName,
                    email: invitation.email,
                    phone: invitation.phone,
                    specialties: invitation.specialty,
                    role: invitation.role,
                    active: true
                });
                await manager.save(Employee, employee);
            }

            // 3. Marcar invitación como aceptada
            invitation.status = InvitationStatus.ACCEPTED;
            invitation.acceptedAt = new Date();
            invitation.acceptedByUserId = userId;
            await manager.save(BusinessInvitation, invitation);

            return savedMembership;
        });
    }

    async rejectInvitation(token: string, userEmail: string): Promise<void> {
        const invitation = await this.validateInvitation(token, userEmail);
        invitation.status = InvitationStatus.REJECTED;
        await this.invitationRepo.save(invitation);
    }

    async getInvitations(businessId: string): Promise<BusinessInvitation[]> {
        return this.invitationRepo.find({
            where: { businessId, status: InvitationStatus.PENDING },
            order: { createdAt: 'DESC' },
            relations: ['invitedByUser']
        });
    }

    async findMyInvitations(email: string): Promise<BusinessInvitation[]> {
        return this.invitationRepo.find({
            where: { email: email.toLowerCase(), status: InvitationStatus.PENDING },
            order: { createdAt: 'DESC' },
            relations: ['business', 'invitedByUser']
        });
    }
}
