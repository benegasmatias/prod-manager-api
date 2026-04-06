import { Repository } from 'typeorm';
import { AuditLog, AuditAction } from './entities/audit-log.entity';
export declare class AuditService {
    private readonly auditRepository;
    constructor(auditRepository: Repository<AuditLog>);
    log(action: AuditAction, entityType: string, entityId: string, businessId?: string, actorUserId?: string, metadata?: any): Promise<AuditLog>;
    findByBusiness(businessId: string): Promise<AuditLog[]>;
}
