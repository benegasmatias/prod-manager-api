import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';

@Injectable()
export class AuditService {
    constructor(
        @InjectRepository(AuditLog)
        private readonly auditRepository: Repository<AuditLog>,
    ) { }

    async log(
        action: AuditAction, 
        entityType: string, 
        entityId: string, 
        businessId?: string, 
        actorUserId?: string, 
        metadata: any = {}
    ): Promise<AuditLog> {
        const log = this.auditRepository.create({
            action,
            entityType,
            entityId,
            businessId,
            actorUserId,
            metadata: {
                ...metadata,
                _recordedAt: new Date().toISOString()
            }
        });
        return this.auditRepository.save(log);
    }

    async findByBusiness(businessId: string): Promise<AuditLog[]> {
        return this.auditRepository.find({
            where: { businessId },
            order: { createdAt: 'DESC' },
            take: 100 // MVP limit
        });
    }
}
