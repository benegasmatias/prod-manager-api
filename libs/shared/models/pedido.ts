export type OrderStatus =
  | 'PENDING' | 'WAITING_MATERIALS' | 'IN_PRODUCTION' | 'WAITING_PRINTER' | 'READY_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
  | 'DESIGN' | 'FAILED' | 'REPRINT_PENDING' | 'POST_PROCESS' | 'DONE' | 'IN_STOCK' | 'DRAFT'
  | 'SITE_VISIT' | 'SITE_VISIT_DONE' | 'VISITA_REPROGRAMADA' | 'VISITA_CANCELADA' | 'QUOTATION' | 'BUDGET_GENERATED' | 'BUDGET_REJECTED' | 'SURVEY_DESIGN' | 'APPROVED' | 'OFFICIAL_ORDER' | 'CUTTING' | 'WELDING' | 'ASSEMBLY' | 'PAINTING' | 'INSTALACION_OBRA'
  | 'ARMADO' | 'BARNIZADO' | 'RE_WORK' | 'READY';

import { Employee } from './employee';
import { ProductionJob } from './production-job';

export enum OrderItemStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  READY = 'READY',
  DONE = 'DONE',
  IN_STOCK = 'IN_STOCK',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

export type { Employee };

export const ORDER_STATUS = {
  PENDING: 'PENDING',
  WAITING_MATERIALS: 'WAITING_MATERIALS',
  IN_PRODUCTION: 'IN_PRODUCTION',
  WAITING_PRINTER: 'WAITING_PRINTER',
  READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
} as const;

export type Priority = 'EXTREMA' | 'ALTA' | 'NORMAL' | 'BAJA' | 'EN TIEMPO' | 'VENCIDO' | 'LISTO' | 'PRÓXIMO';

export const ORDER_PRIORITY = {
  EXTREMA: 'EXTREMA',
  ALTA: 'ALTA',
  NORMAL: 'NORMAL',
  BAJA: 'BAJA',
  EN_TIEMPO: 'EN TIEMPO',
  VENCIDO: 'VENCIDO',
  LISTO: 'LISTO',
  PROXIMO: 'PRÓXIMO'
} as const;

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface Payment {
  id: string;
  paidAt: string;
  amount: number;
  method: string;
  reference?: string;
  note?: string;
}

export interface ItemPedido {
  id: string;
  name: string;
  nombreProducto?: string; // Legacy compatibility
  description?: string;
  descripcion?: string; // Legacy compatibility
  qty: number;
  cantidad?: number; // Legacy compatibility
  doneQty: number;
  quantityProduced?: number; // Legacy compatibility
  price: number;
  unitPrice?: number;
  precioUnitario?: number; // Legacy compatibility
  senia: number;
  stlUrl?: string;
  link?: string; // External reference link
  url_stl?: string; // 3D specific legacy
  weightGrams?: number;
  estimatedMinutes?: number;
  deposit?: number;
  referenceImages?: any[];
  metadata?: Record<string, any>;
  // Metalurgica site visit fields
  fecha_visita?: string;
  hora_visita?: string;
  direccion_obra?: string;
  observaciones_visita?: string;

  // Phase 6.1: Industrial Data
  status: OrderItemStatus;
  job?: ProductionJob;
  productionJob?: ProductionJob;
}

export interface Pedido {
  id: string;
  businessId: string;
  code: string;
  type: 'CLIENT' | 'STOCK';
  clienteId: string;
  customerId?: string;
  clientName: string;
  clientPhone?: string;
  fechaCreacion: string;
  dueDate: string;
  fechaActualizacion: string;
  status: OrderStatus;
  notes?: string;
  items: ItemPedido[];
  total: number;
  totalPrice: number | string;
  profit?: number;
  totalSenias: number | string;
  totalPayments: number | string;
  saldo: number;
  paid?: number;
  urgencia: Priority;
  responsableId?: string;
  operatorId?: string;
  responsableGeneralId?: string;
  costoEstimado?: number;
  responsableGeneral?: Employee;
  payments: Payment[];
  jobs?: ProductionJob[];
  totalUnits?: number;
  files?: any[]; // For backwards compatibility or simplified access
  // History & Metadata
  statusHistory?: StatusHistoryEntry[];
  metadata?: Record<string, any>;

  // Visit fields at order level
  fecha_visita?: string;
  hora_visita?: string;
  direccion_obra?: string;
  observaciones_visita?: string;

  // Mobile Redesign Props
  productionProgress?: number;
  isFacturado?: boolean;
  priority?: number;
}

export interface StatusHistoryEntry {
  id: string;
  orderId: string;
  fromStatus: string;
  toStatus: string;
  changedAt: string;
  createdAt?: string; // fallback
  note?: string;
  notes?: string;   // fallback
  performedBy?: {
      id: string;
      fullName: string;
  };
  employee?: Employee; // fallback
}

export type PedidoSortKey = 'code' | 'fechaCreacion' | 'dueDate' | 'fechaActualizacion' | 'saldo' | 'total' | string;
export type PedidoSortDir = 'asc' | 'desc';

export interface PedidosResponse {
  data: Pedido[];
  total?: number;
  page?: number;
  pageSize?: number;
}

export interface PedidoSummary {
  totalVolume: number;
  pendingBalance: number;
  activeCount: number;
}

export type PedidoType = 'CLIENT' | 'STOCK';
