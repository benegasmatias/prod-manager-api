import { Request } from 'express';

/**
 * Resuelve el businessId de una petición HTTP de forma jerárquica.
 * Prioridad: URL Params > Query Params > Body
 */
export function getBusinessIdFromRequest(request: any): string | null {
  // 1. Intentar obtener de params (ej: /businesses/:id o /orders/:businessId)
  let businessId = request.params?.id || request.params?.businessId;

  // 2. Intentar obtener de query (ej: ?businessId=...)
  if (!businessId) {
    businessId = request.query?.businessId;
  }

  // 3. Intentar obtener de body (ej: { "businessId": "..." })
  if (!businessId) {
    businessId = request.body?.businessId;
  }

  return businessId || null;
}
