import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Repository } from 'typeorm';
import { BusinessMembership } from '../entities/business-membership.entity';
export declare class BusinessRoleGuard implements CanActivate {
    private reflector;
    private readonly membershipRepository;
    constructor(reflector: Reflector, membershipRepository: Repository<BusinessMembership>);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
