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
    // Si la ruta comienza con /businesses, es muy probable que 'id' sea el businessId
    // Si no, lo usamos con precaución (mejor ser explícitos en los controladores)
    businessId = request.params.id;
  }

  return businessId || null;
}
