import { Business } from '../../businesses/entities/business.entity';
export declare class Employee {
    id: string;
    businessId: string;
    business: Business;
    firstName: string;
    lastName: string;
    active: boolean;
    phone: string;
    email: string;
    specialties: string;
    role: string;
    createdAt: Date;
    updatedAt: Date;
}
