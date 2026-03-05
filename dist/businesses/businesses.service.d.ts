import { Repository } from 'typeorm';
import { Business } from './entities/business.entity';
import { BusinessTemplateDto } from './dto/business-template.dto';
import { BusinessMembership } from './entities/business-membership.entity';
import { User } from '../users/entities/user.entity';
import { BusinessTemplate } from './entities/business-template.entity';
import { DataSource } from 'typeorm';
import { CreateBusinessFromTemplateDto } from './dto/create-business-from-template.dto';
import { Order } from '../orders/entities/order.entity';
import { Customer } from '../customers/entities/customer.entity';
import { DashboardSummaryDto } from './dto/dashboard-summary.dto';
import { UpdateBusinessDto } from './dto/update-business.dto';
export declare class BusinessesService {
    private readonly businessRepository;
    private readonly membershipRepository;
    private readonly userRepository;
    private readonly templateRepository;
    private readonly orderRepository;
    private readonly customerRepository;
    private readonly dataSource;
    constructor(businessRepository: Repository<Business>, membershipRepository: Repository<BusinessMembership>, userRepository: Repository<User>, templateRepository: Repository<BusinessTemplate>, orderRepository: Repository<Order>, customerRepository: Repository<Customer>, dataSource: DataSource);
    getTemplates(): Promise<BusinessTemplateDto[]>;
    createFromTemplate(userId: string, createDto: CreateBusinessFromTemplateDto): Promise<any>;
    checkAccess(userId: string, businessId: string): Promise<boolean>;
    findUserBusinesses(userId: string): Promise<Business[]>;
    getDashboardSummary(userId: string, businessId: string): Promise<DashboardSummaryDto>;
    findOne(userId: string, id: string): Promise<Business>;
    update(userId: string, id: string, updateDto: UpdateBusinessDto): Promise<Business>;
}
