import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { BusinessesService } from '../businesses.service';
export declare class BusinessStatusGuard implements CanActivate {
    private readonly reflector;
    private readonly businessesService;
    constructor(reflector: Reflector, businessesService: BusinessesService);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private getErrorMessage;
}
