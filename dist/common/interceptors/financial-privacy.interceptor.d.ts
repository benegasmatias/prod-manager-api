import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
export declare class FinancialPrivacyInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any>;
    private sanitize;
    private sanitizeItem;
    private sanitizeOrderItem;
}
