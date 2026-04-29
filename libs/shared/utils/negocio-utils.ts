import { Rubro, NegocioConfig, StatMetric } from '../models/negocio';

export function getNegocioConfig(rubro: Rubro): NegocioConfig {
  const commonStats: StatMetric[] = [
    { key: 'totalSales', label: 'Ventas Totales', icon: 'TrendingUp', format: 'currency' },
    { key: 'pendingBalance', label: 'Saldo a Cobrar', icon: 'Wallet', format: 'currency' },
  ];

  switch (rubro) {
    case 'IMPRESION_3D':
      return {
        sidebarItems: ['/dashboard', '/pedidos', '/produccion', '/stock', '/clientes', '/personal', '/maquinas', '/materiales', '/reportes', '/ajustes'],
        labels: {
          produccion: 'Producción',
          items: 'Modelos a Imprimir',
          maquinas: 'Impresoras',
          materiales: 'Filamentos',
          unidadName: 'Nombre de Impresora',
          unidadModel: 'Modelo / Marca',
        },
        icons: {
          pedidos: 'Box',
          produccion: 'Cpu',
          maquinas: 'Printer',
          materiales: 'Layers',
        },
        stats: [
          ...commonStats,
          { key: 'productionOrders', label: 'Producción en Curso', icon: 'Printer', format: 'number' },
          { key: 'activePrinters', label: 'Impresoras Activas', icon: 'Zap', format: 'number' },
        ],
        productionStages: [
          { key: 'PENDING', label: 'Pendiente', color: 'bg-zinc-100' },
          { key: 'DESIGN', label: 'En Diseño', color: 'bg-indigo-500' },
          { key: 'IN_PROGRESS', label: 'Imprimiendo', color: 'bg-blue-500' },
          { key: 'READY', label: 'Listo', color: 'bg-emerald-500' },
          { key: 'FAILED', label: 'Fallo de Impresión', color: 'bg-red-500' },
          { key: 'REPRINT_PENDING', label: 'Pendiente Reimpresión', color: 'bg-orange-400' },
          { key: 'POST_PROCESS', label: 'Post-Proceso', color: 'bg-amber-500' },
          { key: 'DONE', label: 'Terminado', color: 'bg-emerald-500' },
          { key: 'DELIVERED', label: 'Entregado', color: 'bg-zinc-100' },
          { key: 'IN_STOCK', label: 'Ingresado a Stock', color: 'bg-purple-500' },
        ],
        materialConfig: {
          namePlaceholder: 'Ej: PLA Negro Pro / PETG Gris',
          brandPlaceholder: 'Ej: Grilon3 / Printalot',
          defaultUnit: 'g',
          defaultType: 'PLA',
          types: [
            { key: 'PLA', label: 'PLA' },
            { key: 'PETG', label: 'PETG' },
            { key: 'ABS', label: 'ABS' },
            { key: 'TPU', label: 'TPU' },
            { key: 'RESIN', label: 'RESINA' },
            { key: 'LIMPIEZA', label: 'FILAMENTO LIMPIEZA' },
          ],
          units: [
            { key: 'g', label: 'Gramos (g)' },
            { key: 'kg', label: 'Kilos (kg)' },
          ],
        },
        itemFields: [
          { key: 'nombreProducto', label: 'Nombre del Modelo / Trabajo', tipo: 'text', section: 'INFORMACIÓN DEL TRABAJO', required: true, placeholder: 'Ej. Llavero de pared' },
          { key: 'tipo_filamento', label: 'Tipo de Filamento (General)', tipo: 'select', section: 'INFORMACIÓN DEL TRABAJO', options: ['PLA', 'PETG', 'ABS', 'TPU', 'RESIN', 'NYLON', 'FLEX'], required: false },
          { key: 'seDiseñaSTL', label: '¿Se diseña el STL?', tipo: 'boolean', section: 'INFORMACIÓN DEL TRABAJO' },
          { key: 'precioDiseno', label: 'Costo de diseño ($)', tipo: 'money', section: 'INFORMACIÓN DEL TRABAJO', placeholder: 'Ej. 2500' },
          { key: 'url_stl', label: 'URL STL', tipo: 'url', section: 'INFORMACIÓN DEL TRABAJO', placeholder: 'https://...' },
          { key: 'reference_image', label: 'Imagen de Referencia', tipo: 'url', section: 'INFORMACIÓN DEL TRABAJO' },
          { key: 'cantidad', label: 'Cantidad', tipo: 'number', section: 'INFORMACIÓN DEL TRABAJO', required: true, placeholder: '1' },
          { key: 'peso_gramos', label: 'Peso estimado (G)', tipo: 'number', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej. 150' },
          { key: 'duracion_estimada_minutos', label: 'Duración (MIN)', tipo: 'number', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej. 120' },
        ],
        staffPlaceholder: 'Ej: Operario de Impresión, Modelador, Post-procesado...',
        features: {
          hasNozzle: true,
          hasMaxFilaments: true,
          hasVisits: false,
          hasQuotes: false,
          hasMaterials: true,
        },
        machineStatusLabels: {
          WORKING: 'Imprimiendo',
          MAINTENANCE: 'Mantenimiento / Calibración',
          IDLE: 'Lista para Imprimir'
        }
      };

    case 'METALURGICA':
      return {
        sidebarItems: ['/dashboard', '/visitas', '/presupuestos', '/pedidos', '/produccion', '/stock', '/clientes', '/personal', '/materiales', '/maquinas', '/reportes', '/ajustes'],
        labels: {
          produccion: 'Monitor de Taller',
          items: 'Planos y Estructuras',
          maquinas: 'Puestos de Trabajo',
          materiales: 'Materiales',
          unidadName: 'Nombre del Puesto / Operario',
          unidadModel: 'Especialidad / Equipo',
        },
        icons: {
          visitas: 'Calendar',
          presupuestos: 'Zap',
          pedidos: 'FileText',
          produccion: 'Cog',
          maquinas: 'Wrench',
          materiales: 'Grid',
        },
        stats: [
          ...commonStats,
          { key: 'productionOrders', label: 'Fabricación en Curso', icon: 'Cog', format: 'number' },
          { key: 'activeOrders', label: 'Proyectos Activos', icon: 'HardHat', format: 'number' },
        ],
        productionStages: [
          { key: 'SITE_VISIT', label: 'Visita Técnica', color: 'bg-indigo-500' },
          { key: 'SITE_VISIT_DONE', label: 'Visita Realizada', color: 'bg-emerald-500' },
          { key: 'VISITA_REPROGRAMADA', label: 'Visita Reprogramada', color: 'bg-orange-400' },
          { key: 'VISITA_CANCELADA', label: 'Visita Cancelada', color: 'bg-red-400' },
          { key: 'QUOTATION', label: 'Presupuesto Pendiente', color: 'bg-blue-500' },
          { key: 'BUDGET_GENERATED', label: 'Presupuesto Enviado', color: 'bg-amber-500' },
          { key: 'BUDGET_REJECTED', label: 'Presupuesto Rechazado', color: 'bg-zinc-400' },
          { key: 'SURVEY_DESIGN', label: 'Relevamiento / Diseño', color: 'bg-blue-400' },
          { key: 'APPROVED', label: 'Presupuesto Confirmado', color: 'bg-primary' },
          { key: 'OFFICIAL_ORDER', label: 'En Taller / Cola', color: 'bg-zinc-100' },
          { key: 'CUTTING', label: 'Corte', color: 'bg-orange-500' },
          { key: 'WELDING', label: 'Soldadura', color: 'bg-blue-600' },
          { key: 'ASSEMBLY', label: 'Armado', color: 'bg-amber-600' },
          { key: 'PAINTING', label: 'Pintura', color: 'bg-purple-500' },
          { key: 'INSTALACION_OBRA', label: 'Instalación en Obra', color: 'bg-indigo-600' },
          { key: 'FAILED', label: 'Fallo / Error', color: 'bg-red-500' },
          { key: 'DONE', label: 'Listo p/ Entrega', color: 'bg-emerald-500' },
          { key: 'DELIVERED', label: 'Entregado (Cerrado)', color: 'bg-zinc-100' },
        ],
        materialConfig: {
          namePlaceholder: 'Ej: Caño 40x40 / Chapa N18 / Electrodo 6013',
          brandPlaceholder: 'Ej: Acer Bragado / Acindar / Sin Marca',
          defaultUnit: 'm',
          defaultType: 'PERFIL',
          types: [
            { key: 'PERFIL', label: 'PERFIL / CAÑO' },
            { key: 'CHAPA', label: 'CHAPA' },
            { key: 'MACHO', label: 'MACHIMBRE' },
            { key: 'HERRAJE', label: 'HERRAJE / ACCESORIO' },
            { key: 'INSUMO', label: 'INSUMO (DISCO/ELECTRODO)' },
            { key: 'OTRO', label: 'OTRO' },
          ],
          units: [
            { key: 'm', label: 'Metros (m)' },
            { key: 'uds', label: 'Unidades (uds)' },
            { key: 'kg', label: 'Kilos (kg)' },
            { key: 'barras', label: 'Barras (6m)' },
            { key: 'placas', label: 'Placas/Chapas' },
          ],
        },
        itemFields: [
          { key: 'tipo_trabajo', label: 'Tipo de Trabajo', tipo: 'select', section: 'INFORMACIÓN DEL TRABAJO', options: ['Portón', 'Reja', 'Escalera', 'Estructura', 'Puerta', ' Paño Fijo', 'Otro'], required: true },
          { key: 'nombreProducto', label: 'Descripción / Nombre', tipo: 'text', section: 'INFORMACIÓN DEL TRABAJO', required: true, placeholder: 'Ej: Portón principal frente' },
          { key: 'medidas', label: 'Medidas (Ancho x Alto)', tipo: 'text', section: 'INFORMACIÓN DEL TRABAJO', placeholder: 'Ej: 3.50 x 2.10 m' },
          { key: 'cantidad', label: 'Cantidad', tipo: 'number', section: 'INFORMACIÓN DEL TRABAJO', required: true, placeholder: '1' },

          { key: 'material_estructura', label: 'Material Estructura', tipo: 'text', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej: Tubo 40x40' },
          { key: 'revestimiento', label: 'Revestimiento (Machimbre/Chapa)', tipo: 'text', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej: Machimbre de Pino / Chapa N°18' },
          { key: 'terminacion', label: 'Terminación / Proceso', tipo: 'text', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej: Pintura epoxi al horno' },
          { key: 'color', label: 'Color Final', tipo: 'text', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej: Negro microtexturado' },

          { key: 'incluye_motor', label: 'Incluye Motor', tipo: 'boolean', section: 'OPCIONALES' },
          { key: 'instalacion', label: 'Requiere Instalación', tipo: 'boolean', section: 'OPCIONALES' },
          { key: 'incluye_guias', label: 'Incluye Guías/Rieles', tipo: 'boolean', section: 'OPCIONALES' },
          { key: 'cerradura_seguridad', label: 'Cerradura de Seguridad', tipo: 'boolean', section: 'OPCIONALES' },
          { key: 'refuerzos_estructurales', label: 'Refuerzos Estructurales', tipo: 'boolean', section: 'OPCIONALES' },
        ],
        staffPlaceholder: 'Ej: Soldador, Pintor, Armado, Plegador...',
        features: {
          hasNozzle: false,
          hasMaxFilaments: false,
          hasVisits: true,
          hasQuotes: true,
          hasMaterials: true,
        },
        machineStatusLabels: {
          WORKING: 'En Producción',
          MAINTENANCE: 'Fuera de Servicio / Reparación',
          IDLE: 'Disponible / Espera'
        }
      };

    case 'CARPINTERIA':
      return {
        sidebarItems: ['/dashboard', '/pedidos', '/stock', '/clientes', '/personal', '/produccion', '/reportes', '/ajustes'],
        labels: {
          produccion: 'Estado de Armado',
          items: 'Muebles y Componentes',
          maquinas: 'Bancos / Operarios',
          materiales: 'Maderas',
          unidadName: 'Nombre del Banco / Operario',
          unidadModel: 'Especialidad / Herramientas',
        },
        icons: {
          pedidos: 'ClipboardList',
          produccion: 'Hammer',
          maquinas: 'Wrench',
          materiales: 'Trees',
        },
        stats: [
          ...commonStats,
          { key: 'productionOrders', label: 'Muebles en Armado', icon: 'Hammer', format: 'number' },
          { key: 'activeOrders', label: 'Pedidos Pendientes', icon: 'ShoppingCart', format: 'number' },
        ],
        productionStages: [
          { key: 'PENDING', label: 'Planificación', color: 'bg-zinc-100' },
          { key: 'CUTTING', label: 'Corte de Placas', color: 'bg-orange-400' },
          { key: 'ARMADO', label: 'En Armado', color: 'bg-blue-500' },
          { key: 'BARNIZADO', label: 'Lustre / Barniz', color: 'bg-amber-600' },
          { key: 'FAILED', label: 'Rehacer / Error', color: 'bg-red-500' },
          { key: 'RE_WORK', label: 'En Ajuste / Reparación', color: 'bg-orange-400' },
          { key: 'DONE', label: 'Terminado', color: 'bg-emerald-500' },
          { key: 'DELIVERED', label: 'Entregado', color: 'bg-zinc-100' },
          { key: 'IN_STOCK', label: 'Ingresado a Stock', color: 'bg-purple-500' },
        ],
        materialConfig: {
          namePlaceholder: 'Ej: Placa Melamina 18mm / Cola Vinílica',
          brandPlaceholder: 'Ej: Faplac / Egger / Sin Marca',
          defaultUnit: 'uds',
          defaultType: 'PLACA',
          types: [
            { key: 'PLACA', label: 'PLACA / TABLERO' },
            { key: 'MADERA', label: 'MADERA MACIZA / LISTÓN' },
            { key: 'HERRAJE', label: 'HERRAJE / TIRADOR' },
            { key: 'INSUMO', label: 'INSUMO (COLA/LIJA)' },
            { key: 'OTRO', label: 'OTRO' },
          ],
          units: [
            { key: 'uds', label: 'Unidades (uds)' },
            { key: 'm', label: 'Metros (m)' },
            { key: 'm2', label: 'M2 (Superficie)' },
          ],
        },
        itemFields: [
          { key: 'nombreProducto', label: 'Mueble / Producto', tipo: 'text', section: 'INFORMACIÓN DEL TRABAJO', required: true, placeholder: 'Ej. Mesa ratona' },
          { key: 'madera', label: 'Tipo de Madera', tipo: 'text', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej. Pino, Roble' },
          { key: 'medidas', label: 'Dimensiones Finales', tipo: 'text', section: 'INFORMACIÓN DEL TRABAJO', placeholder: 'Ej. 120 x 80 x 45 cm' },
          { key: 'herrajes', label: 'Detalle de Herrajes', tipo: 'textarea', section: 'ESPECIFICACIONES TÉCNICAS' },
        ],
        staffPlaceholder: 'Ej: Carpintero, Lijador, Lustrador, Diseñador...',
        features: {
          hasNozzle: false,
          hasMaxFilaments: false,
          hasVisits: false,
          hasQuotes: false,
          hasMaterials: true,
        },
        machineStatusLabels: {
          WORKING: 'En Armado',
          MAINTENANCE: 'Fuera de Servicio',
          IDLE: 'Banco Libre'
        }
      };

    case 'KIOSCO':
      return {
        sidebarItems: ['/kiosco/dashboard', '/kiosco/venta', '/kiosco/caja', '/kiosco/productos', '/kiosco/compras', '/kiosco/proveedores', '/reportes', '/ajustes'],
        labels: {
          produccion: 'Ventas de Hoy',
          items: 'Ventas',
          maquinas: 'Cajas Registradoras',
          materiales: 'Proveedores',
          unidadName: 'Nombre de la Caja',
          unidadModel: 'Ubicación / Sector',
          staffPlaceholder: 'Vendedor, Cajero, Repositor...',
        },
        icons: {
          produccion: 'TrendingUp',
          maquinas: 'Wallet',
          materiales: 'Truck',
        },
        stats: [
          ...commonStats,
          { key: 'activeSales', label: 'Ventas de Hoy', icon: 'ShoppingCart', format: 'number' },
          { key: 'lowStock', label: 'Alertas de Stock', icon: 'AlertTriangle', format: 'number' },
        ],
        productionStages: [], // Not used in retail
        materialConfig: {
          namePlaceholder: 'Ej: Coca Cola 500ml',
          brandPlaceholder: 'Ej: Coca Cola Company',
          defaultUnit: 'uds',
          defaultType: 'PRODUCTO',
          types: [{ key: 'PRODUCTO', label: 'Producto' }],
          units: [{ key: 'uds', label: 'Unidad' }],
        },
        itemFields: [],
        staffPlaceholder: 'Ej: Vendedor, Cajero...',
        features: {
          hasNozzle: false,
          hasMaxFilaments: false,
          hasVisits: false,
          hasQuotes: false,
          hasMaterials: false,
        }
      };

    case 'GENERICO':
    default:
      return {
        sidebarItems: ['/dashboard', '/pedidos', '/stock', '/clientes', '/personal', '/produccion', '/reportes', '/ajustes'],
        labels: {
          produccion: 'Producción',
          items: 'Ítems de Pedido',
          maquinas: 'Unidades de Trabajo',
          materiales: 'Materiales',
          unidadName: 'Nombre de la Unidad',
          unidadModel: 'Tipo / Categoría',
        },
        icons: {
          pedidos: 'ShoppingCart',
          produccion: 'Cpu',
          maquinas: 'Wrench',
          materiales: 'Package',
        },
        stats: [
          ...commonStats,
          { key: 'activeOrders', label: 'Pedidos Activos', icon: 'ShoppingCart', format: 'number' },
          { key: 'productionOrders', label: 'En Fila de Trabajo', icon: 'Clock', format: 'number' },
        ],
        productionStages: [
          { key: 'PENDING', label: 'Pendiente', color: 'bg-zinc-100' },
          { key: 'IN_PROGRESS', label: 'En Proceso', color: 'bg-blue-500' },
          { key: 'FAILED', label: 'Fallo / Error', color: 'bg-red-500' },
          { key: 'RE_WORK', label: 'En Reparación', color: 'bg-orange-400' },
          { key: 'DONE', label: 'Terminado', color: 'bg-emerald-500' },
          { key: 'DELIVERED', label: 'Entregado', color: 'bg-zinc-100' },
          { key: 'IN_STOCK', label: 'Ingresado a Stock', color: 'bg-purple-500' },
        ],
        materialConfig: {
          namePlaceholder: 'Ej: Insumo General / Producto',
          brandPlaceholder: 'Ej: Marca / Proveedor',
          defaultUnit: 'uds',
          defaultType: 'INSUMO',
          types: [
            { key: 'INSUMO', label: 'INSUMO / MATERIAL' },
            { key: 'PRODUCTO', label: 'PRODUCTO / REVENTA' },
            { key: 'OTRO', label: 'OTRO' },
          ],
          units: [
            { key: 'uds', label: 'Unidades (uds)' },
            { key: 'kg', label: 'Kilos (kg)' },
            { key: 'l', label: 'Litros (l)' },
          ],
        },
        itemFields: [
          { key: 'nombreProducto', label: 'Producto/Servicio', tipo: 'text', section: 'INFORMACIÓN DEL TRABAJO', required: true, placeholder: 'Ej. Servicio de pintura' },
          { key: 'descripcion', label: 'Descripción Extendida', tipo: 'textarea', section: 'INFORMACIÓN DEL TRABAJO' },
        ],
        staffPlaceholder: 'Ej: Operario, Vendedor, Administrativo...',
        features: {
          hasNozzle: false,
          hasMaxFilaments: false,
          hasVisits: false,
          hasQuotes: false,
          hasMaterials: true,
        },
        machineStatusLabels: {
          WORKING: 'En Uso',
          MAINTENANCE: 'No Disponible',
          IDLE: 'Disponible'
        }
      };
  }
}

export function getStatusLabel(status: string, rubro?: Rubro, orderType?: 'CLIENT' | 'STOCK'): string {
  // Overrides for Stock context
  if (orderType === 'STOCK') {
    const stockLabels: Record<string, string> = {
      'DONE': 'Producido / Listo',
      'DELIVERED': 'Ingresado a Stock',
      'IN_STOCK': 'Disponible / Inventario',
      'READY_FOR_DELIVERY': 'Pendiente Ingreso',
      'SURVEY_DESIGN': 'Diseño Técnico'
    };
    if (stockLabels[status]) return stockLabels[status];
  }

  const config = getNegocioConfig(rubro || 'GENERICO');
  const stage = config.productionStages.find((s) => s.key === status);
  if (stage) return stage.label;

  const fallbacks: Record<string, string> = {
    PENDING: 'Pendiente',
    IN_PROGRESS: 'En Proceso',
    DONE: 'Terminado',
    DELIVERED: 'Entregado',
    CANCELLED: 'Anulado',
    READY: 'Listo',
    FAILED: 'Fallido',
    IN_STOCK: 'En Stock',
    DRAFT: 'Borrador',
  };

  return fallbacks[status] || status;
}

export function getStatusStyles(status: string, rubro?: Rubro): string {
  const config = getNegocioConfig(rubro || 'GENERICO');
  const stage = config.productionStages.find((s) => s.key === status);

  let color = stage?.color;
  
  if (!color) {
    const fallbacks: Record<string, string> = {
      READY: 'bg-emerald-500',
      DONE: 'bg-emerald-500',
      IN_PROGRESS: 'bg-blue-500',
      PENDING: 'bg-zinc-100',
      CANCELLED: 'bg-red-500',
      FAILED: 'bg-red-500',
      DRAFT: 'bg-zinc-100'
    };
    color = fallbacks[status] || 'bg-zinc-100';
  }

  const parts = color.split('-');
  const baseColor = parts.length > 1 ? parts[1] : 'zinc';

  const colorMap: Record<string, string> = {
    primary: 'bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-foreground dark:border-primary/30',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-400 dark:border-indigo-900/50',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900/50',
    amber: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900/50',
    rose: 'bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/50',
    blue: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900/50',
    purple: 'bg-purple-50 text-purple-600 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900/50',
    red: 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900/50',
    orange: 'bg-orange-50 text-orange-600 border-orange-200 dark:bg-orange-950/30 dark:text-orange-400 dark:border-orange-900/50',
    zinc: 'bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:border-zinc-800',
  };

  return colorMap[baseColor] || colorMap['zinc'];
}

export function mapCategoryToRubro(category: string): Rubro {
  const normalized = (category || '').toUpperCase().trim();

  if (normalized === 'IMPRESION_3D' || normalized === 'IMPRESIONES_3D') {
    return 'IMPRESION_3D';
  }

  const map: Record<string, Rubro> = {
    'METALURGICA': 'METALURGICA',
    'CARPINTERIA': 'CARPINTERIA',
    'KIOSCO': 'KIOSCO',
    'RETAIL': 'KIOSCO',
    'GENERICO': 'GENERICO'
  };

  return map[normalized] as Rubro || 'GENERICO';
}

export function getStatusColorBase(status: string, rubro?: Rubro): string {
  const config = getNegocioConfig(rubro || 'GENERICO');
  const stage = config.productionStages.find((s) => s.key === status);

  if (stage?.color) return stage.color;

  const fallbacks: Record<string, string> = {
    PENDING: 'bg-zinc-100',
    IN_PROGRESS: 'bg-blue-500',
    DONE: 'bg-emerald-500',
    DELIVERED: 'bg-zinc-100',
    CANCELLED: 'bg-red-500',
    READY: 'bg-emerald-500',
    FAILED: 'bg-red-500',
    IN_STOCK: 'bg-purple-500',
  };

  return fallbacks[status] || 'bg-zinc-100';
}
