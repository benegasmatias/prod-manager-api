import { CanActivate, ExecutionContext } from '@nestjs/common';
import { BusinessesService } from '../../businesses/businesses.service';
export declare class BusinessAccessGuard implements CanActivate {
    private readonly businessesService;
    constructor(businessesService: BusinessesService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
