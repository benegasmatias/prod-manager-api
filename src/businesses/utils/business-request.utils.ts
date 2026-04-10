import { Request } from 'express';

/**
 * Resuelve el businessId de una petición HTTP de forma jerárquica.
 * Prioridad: URL Params > Query Params > Body
 */
export function getBusinessIdFromRequest(request: any): string | null {
  // 1. Prioridad absoluta: Identificadores explícitos
  let businessId = request.params?.businessId || request.query?.businessId || request.body?.businessId;

  // 2. Fallback: Solo usar 'id' de params si no se encontró un businessId específico
  // Esto es común en rutas de /businesses/:id
  if (!businessId && request.params?.id) {
    // Solo asumimos que 'id' es businessId si la ruta es del dominio de negocios
    // Esto evita que en /orders/:id el ID del pedido se tome como ID de negocio
    const isBusinessRoute = request.baseUrl?.includes('/businesses') || request.url?.includes('/businesses');
    if (isBusinessRoute) {
      businessId = request.params.id;
    }
  }

  return businessId || null;
}
