import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { BusinessRole } from '../enums';

@Injectable()
export class FinancialPrivacyInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const role = request.businessRole;

    // Solo anonimizamos para OPERATOR y VIEWER
    const shouldHide = role === BusinessRole.OPERATOR || role === BusinessRole.VIEWER;

    return next.handle().pipe(
      map(data => {
        if (!shouldHide || !data) return data;
        return this.sanitize(data);
      }),
    );
  }

  private sanitize(data: any): any {
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeItem(item));
    }
    return this.sanitizeItem(data);
  }

  private sanitizeItem(item: any): any {
    if (typeof item !== 'object' || item === null) return item;

    // Campos sensibles en Order / Dashboard
    const sensitiveFields = ['totalAmount', 'paidAmount', 'balance', 'totalSales', 'pendingBalance', 'budgetTotal'];
    
    sensitiveFields.forEach(field => {
      if (field in item) {
        item[field] = null;
      }
    });

    // Sanitizar ítems si existen (OrderItems)
    if (item.items && Array.isArray(item.items)) {
      item.items = item.items.map(subItem => this.sanitizeOrderItem(subItem));
    }

    return item;
  }

  private sanitizeOrderItem(orderItem: any): any {
    if (typeof orderItem !== 'object' || orderItem === null) return orderItem;

    // Campos sensibles en OrderItem
    const sensitiveFields = ['unitPrice', 'lineTotal', 'costPerUnit', 'price'];

    sensitiveFields.forEach(field => {
      if (field in orderItem) {
        orderItem[field] = null;
      }
    });

    return orderItem;
  }
}
