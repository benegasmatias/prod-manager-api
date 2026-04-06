import { BusinessesService } from './businesses.service';
import { CreateBusinessFromTemplateDto } from './dto/create-business-from-template.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
export declare class BusinessesController {
    private readonly businessesService;
    constructor(businessesService: BusinessesService);
    findAll(req: any, enabled?: string, acceptingOrders?: string, status?: string): Promise<import("./entities/business.entity").Business[]>;
    findOne(req: any, id: string): Promise<import("./entities/business.entity").Business>;
    getSummary(req: any, id: string): Promise<import("./dto/dashboard-summary.dto").DashboardSummaryDto>;
    getConfig(req: any, id: string): Promise<any>;
    testReload(): Promise<{
        message: string;
        time: string;
    }>;
    getTemplates(req: any): Promise<import("./dto/business-template.dto").BusinessTemplateDto[]>;
    getPlanUsage(id: string): Promise<any>;
    updateStatusAdmin(id: string, body: {
        status: string;
        reasonCode?: string;
        reasonText?: string;
    }): Promise<any>;
    updateEnabledAdmin(id: string, body: {
        isEnabled: boolean;
        reasonCode?: string;
        reasonText?: string;
    }): Promise<any>;
    getAuditTrace(id: string): Promise<any>;
    create(req: any, createDto: CreateBusinessFromTemplateDto): Promise<any>;
    update(req: any, id: string, updateDto: UpdateBusinessDto): Promise<import("./entities/business.entity").Business>;
    updateOnboarding(req: any, id: string, step: string): Promise<any>;
    activate(req: any, id: string): Promise<any>;
}
