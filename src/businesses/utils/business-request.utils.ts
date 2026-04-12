import { Request } from 'express';

/**
 * Resuelve el businessId de una petición HTTP de forma jerárquica.
 * Prioridad: URL Params > Query Params > Body
 */
export function getBusinessIdFromRequest(request: any): string | null {
  // 1. Prioridad absoluta: Identificadores explícitos por nombre
  let businessId = request.params?.businessId || request.query?.businessId || request.body?.businessId;

  // 2. Fallback: Solo usar 'id' de params si estamos en una ruta de negocios
  // Esto evita confundir ':id' de un pedido con ':id' de un negocio.
  if (!businessId && request.params?.id) {
    const url = request.url || '';
    if (url.includes('/businesses')) {
      businessId = request.params.id;
    }
  }

  return businessId || null;
}
