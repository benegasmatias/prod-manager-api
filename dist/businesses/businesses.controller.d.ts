import { BusinessesService } from './businesses.service';
import { CreateBusinessFromTemplateDto } from './dto/create-business-from-template.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
export declare class BusinessesController {
    private readonly businessesService;
    constructor(businessesService: BusinessesService);
    findAll(req: any): Promise<import("./entities/business.entity").Business[]>;
    findOne(req: any, id: string): Promise<import("./entities/business.entity").Business>;
    getSummary(req: any, id: string): Promise<import("./dto/dashboard-summary.dto").DashboardSummaryDto>;
    testReload(): Promise<{
        message: string;
        time: string;
    }>;
    create(req: any, createDto: CreateBusinessFromTemplateDto): Promise<any>;
    update(req: any, id: string, updateDto: UpdateBusinessDto): Promise<import("./entities/business.entity").Business>;
}
