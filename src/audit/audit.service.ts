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
        action: AuditAction | string, 
        entityType: string, 
        entityId: string, 
        businessId?: string, 
        actorUserId?: string, 
        metadata: any = {},
        context?: { ip?: string, userAgent?: string }
    ): Promise<AuditLog> {
        const log = this.auditRepository.create({
            action,
            entityType,
            entityId,
            businessId,
            actorUserId,
            ipAddress: context?.ip,
            userAgent: context?.userAgent,
            metadata: {
                ...metadata,
                _recordedAt: new Date().toISOString()
            }
        });
        return this.auditRepository.save(log);
    }

    /**
     * Helper to extract IP and UA from Request in a single place
     */
    extractContext(req: any) {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        return {
            ip: Array.isArray(ip) ? ip[0] : ip,
            userAgent
        };
    }

    async findByBusiness(businessId: string): Promise<AuditLog[]> {
        return this.auditRepository.find({
            where: { businessId },
            order: { createdAt: 'DESC' },
            take: 100 // MVP limit
        });
    }
}
