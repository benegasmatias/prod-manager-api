import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Pedido, PedidosResponse, PedidoSummary, Employee } from '@shared/models';
import { API_ENDPOINTS } from '@shared/config/api-endpoints.config';

export interface ListingParams {
  businessId: string;
  status?: string;
  statuses?: string;
  excludeStatuses?: string;
  type?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  startDate?: string | Date;
  endDate?: string | Date;
  responsableId?: string;
  urgency?: string;
  alertFilter?: string;
}

export interface ReportFailureData {
  businessId?: string;
  itemId?: string;
  reason: string;
  action?: 'REDO' | 'DISCARD' | 'KEEP';
  targetStatus?: string;
  wastedGrams?: number;
  materialWastes?: { materialId: string, grams: number }[];
  moveToReprint?: boolean;
  metadata?: any;
}

@Injectable({
  providedIn: 'root'
})
export class PedidosApiService {
  private http = inject(HttpClient);

  /**
   * Obtiene el listado de pedidos para un negocio con filtros opcionales.
   */
  async getListing(params: ListingParams, context?: any): Promise<PedidosResponse> {
    let httpParams = new HttpParams()
      .set('businessId', params.businessId)
      .set('page', (params.page || 1).toString())
      .set('pageSize', (params.pageSize || 50).toString());

    if (params.status) httpParams = httpParams.set('status', params.status);
    if (params.statuses) httpParams = httpParams.set('statuses', params.statuses);
    if (params.excludeStatuses) httpParams = httpParams.set('excludeStatuses', params.excludeStatuses);
    if (params.type) httpParams = httpParams.set('type', params.type);
    if (params.search) httpParams = httpParams.set('search', params.search);
    if (params.startDate) httpParams = httpParams.set('startDate', params.startDate.toString());
    if (params.endDate) httpParams = httpParams.set('endDate', params.endDate.toString());
    if (params.responsableId) httpParams = httpParams.set('responsableId', params.responsableId);
    if (params.urgency) httpParams = httpParams.set('urgency', params.urgency);
    if (params.alertFilter) httpParams = httpParams.set('alertFilter', params.alertFilter);

    return firstValueFrom(this.http.get<PedidosResponse>(API_ENDPOINTS.ORDERS.LISTING, { params: httpParams, context }));
  }

  /**
   * Obtiene el resumen de pedidos (totales, saldos, etc) para el dashboard.
   */
  async getSummary(businessId: string, context?: any): Promise<PedidoSummary> {
    const params = new HttpParams().set('businessId', businessId);
    return firstValueFrom(this.http.get<PedidoSummary>(API_ENDPOINTS.ORDERS.SUMMARY, { params, context }));
  }

  async getEmployees(businessId: string, activeOnly = true, context?: any): Promise<Employee[]> {
    const params = new HttpParams()
      .set('businessId', businessId)
      .set('active', activeOnly.toString());

    return firstValueFrom(this.http.get<Employee[]>(API_ENDPOINTS.EMPLOYEES.LIST, { params, context }));
  }

  /**
   * Obtiene un pedido por su ID.
   */
  async findOne(id: string, context?: any): Promise<Pedido> {
    return firstValueFrom(this.http.get<Pedido>(API_ENDPOINTS.ORDERS.ONE(id), { context }));
  }

  /**
   * Crea un nuevo pedido.
   */
  async create(data: Partial<Pedido>): Promise<Pedido> {
    return firstValueFrom(this.http.post<Pedido>(API_ENDPOINTS.ORDERS.ROOT, data));
  }

  /**
   * Actualiza un pedido existente.
   */
  async update(id: string, data: Partial<Pedido>): Promise<Pedido> {
    return firstValueFrom(this.http.patch<Pedido>(API_ENDPOINTS.ORDERS.ONE(id), data));
  }

  /**
   * Elimina un pedido permanentemente.
   */
  async delete(id: string, businessId?: string): Promise<void> {
    let url = API_ENDPOINTS.ORDERS.ONE(id);
    if (businessId) {
      url += `?businessId=${businessId}`;
    }
    return firstValueFrom(this.http.delete<void>(url));
  }

  /**
   * Registra un pago para un pedido.
   */
  async addPayment(orderId: string, payment: { businessId?: string; amount: number; method: string; note?: string }): Promise<Pedido> {
    const { businessId, ...data } = payment;
    let url = API_ENDPOINTS.ORDERS.PAYMENTS(orderId);
    if (businessId) url += `?businessId=${businessId}`;
    return firstValueFrom(this.http.post<Pedido>(url, data));
  }

  async removePayment(orderId: string, paymentId: string, businessId?: string): Promise<void> {
    let url = `${API_ENDPOINTS.ORDERS.PAYMENTS(orderId)}/${paymentId}`;
    if (businessId) url += `?businessId=${businessId}`;
    return firstValueFrom(this.http.delete<void>(url));
  }

  /**
   * Reporta un fallo en un pedido (específicamente Impresión 3D o general).
   */
  async reportFailure(orderId: string, data: ReportFailureData): Promise<Pedido> {
    const { businessId, ...body } = data;
    const payload = {
      ...body,
      wastedGrams: body.wastedGrams || 0,
      moveToReprint: body.moveToReprint || (body.action === 'REDO' && body.targetStatus === 'REPRINT_PENDING')
    };
    
    let url = API_ENDPOINTS.ORDERS.REPORT_FAILURE(orderId);
    if (businessId) url += `?businessId=${businessId}`;
    
    return firstValueFrom(this.http.post<Pedido>(url, payload));
  }

  private workloadCache = new Map<string, any[]>();

  /**
   * Obtiene la carga de trabajo (cantidad de pedidos) por día.
   * Incluye caché en memoria para evitar llamadas redundantes.
   */
  async getWorkload(businessId: string, startDate?: string, endDate?: string): Promise<any[]> {
    const cacheKey = `${businessId}_${startDate}_${endDate}`;
    if (this.workloadCache.has(cacheKey)) {
      return this.workloadCache.get(cacheKey)!;
    }

    let url = `${API_ENDPOINTS.ORDERS.ROOT}/workload?businessId=${businessId}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;

    const data = await firstValueFrom(this.http.get<any[]>(url));
    this.workloadCache.set(cacheKey, data);

    // Auto-limpiar caché después de 5 minutos
    setTimeout(() => this.workloadCache.delete(cacheKey), 5 * 60 * 1000);

    return data;
  }

  async updateItemStatus(orderId: string, itemId: string, status: string, businessId: string, force: boolean = false): Promise<any> {
    return firstValueFrom(this.http.patch(`${API_ENDPOINTS.ORDERS.ROOT}/${orderId}/items/${itemId}/status`, { status, businessId, force }));
  }
}
