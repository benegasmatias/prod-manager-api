import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { AdminService } from '../../admin/admin.service';
import { DataSource } from 'typeorm';
import { BusinessTemplate } from '../../businesses/entities/business-template.entity';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const adminService = app.get(AdminService);
    const dataSource = app.get(DataSource);
    const templateRepo = dataSource.getRepository(BusinessTemplate);

    console.log('--- MIGRACIÓN DE CONFIGURACIONES DINÁMICAS (FASE 3B) ---');

    const configsByRubro: Record<string, any> = {
        'IMPRESION_3D': {
            sidebarItems: ['/dashboard', '/presupuestos', '/pedidos', '/stock', '/clientes', '/personal', '/maquinas', '/materiales', '/reportes', '/ajustes'],
            labels: {
                produccion: 'Producción',
                items: 'Modelos a Imprimir',
                maquinas: 'Impresoras',
                materiales: 'Filamentos',
                unidadName: 'Nombre de Impresora',
                unidadModel: 'Modelo / Marca',
            },
            icons: { pedidos: 'Box', produccion: 'Cpu', maquinas: 'Printer', materiales: 'Layers' },
            stats: [
                { key: 'totalSales', label: 'Ventas Totales', icon: 'TrendingUp', format: 'currency' },
                { key: 'pendingBalance', label: 'Saldo a Cobrar', icon: 'Wallet', format: 'currency' },
                { key: 'productionOrders', label: 'Producción en Curso', icon: 'Printer', format: 'number' },
                { key: 'activePrinters', label: 'Impresoras Activas', icon: 'Zap', format: 'number' },
            ],
            productionStages: [
                { key: 'QUOTATION', label: 'Presupuesto', color: 'bg-indigo-500' },
                { key: 'BUDGET_GENERATED', label: 'Presupuesto Enviado', color: 'bg-amber-500' },
                { key: 'BUDGET_REJECTED', label: 'Presupuesto Rechazado', color: 'bg-red-400' },
                { key: 'PENDING', label: 'Pendiente', color: 'bg-zinc-100' },
                { key: 'DESIGN', label: 'En Diseño', color: 'bg-indigo-500' },
                { key: 'IN_PROGRESS', label: 'En Proceso', color: 'bg-blue-500' },
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
                types: [{ key: 'PLA', label: 'PLA' }, { key: 'PETG', label: 'PETG' }, { key: 'ABS', label: 'ABS' }, { key: 'TPU', label: 'TPU' }, { key: 'RESIN', label: 'RESINA' }, { key: 'LIMPIEZA', label: 'FILAMENTO LIMPIEZA' }],
                units: [{ key: 'g', label: 'Gramos (g)' }, { key: 'kg', label: 'Kilos (kg)' }],
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
            features: { hasNozzle: true, hasMaxFilaments: true, hasVisits: false, hasQuotes: true, hasMaterials: true, hasVehicles: false },
            machineStatusLabels: { WORKING: 'Imprimiendo', MAINTENANCE: 'Mantenimiento / Calibración', IDLE: 'Lista para Imprimir' },
            staffPlaceholder: 'Ej: Operario de Impresión, Modelador, Post-procesado...',
        },
        'METALURGICA': {
            sidebarItems: ['/dashboard', '/visitas', '/presupuestos', '/pedidos', '/stock', '/clientes', '/personal', '/materiales', '/maquinas', '/reportes', '/ajustes'],
            labels: {
                produccion: 'Monitor de Taller',
                items: 'Planos y Estructuras',
                maquinas: 'Puestos de Trabajo',
                materiales: 'Materiales',
                unidadName: 'Nombre del Puesto / Operario',
                unidadModel: 'Especialidad / Equipo',
            },
            icons: { visitas: 'Calendar', presupuestos: 'Zap', pedidos: 'FileText', produccion: 'Cog', maquinas: 'Wrench', materiales: 'Grid' },
            stats: [
                { key: 'totalSales', label: 'Ventas Totales', icon: 'TrendingUp', format: 'currency' },
                { key: 'pendingBalance', label: 'Saldo a Cobrar', icon: 'Wallet', format: 'currency' },
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
                types: [{ key: 'PERFIL', label: 'PERFIL / CAÑO' }, { key: 'CHAPA', label: 'CHAPA' }, { key: 'MACHO', label: 'MACHIMBRE' }, { key: 'HERRAJE', label: 'HERRAJE / ACCESORIO' }, { key: 'INSUMO', label: 'INSUMO (DISCO/ELECTRODO)' }, { key: 'OTRO', label: 'OTRO' }],
                units: [{ key: 'm', label: 'Metros (m)' }, { key: 'uds', label: 'Unidades (uds)' }, { key: 'kg', label: 'Kilos (kg)' }, { key: 'barras', label: 'Barras (6m)' }, { key: 'placas', label: 'Placas/Chapas' }],
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
            ],
            features: { hasNozzle: false, hasMaxFilaments: false, hasVisits: true, hasQuotes: true, hasMaterials: true, hasVehicles: false },
            machineStatusLabels: { WORKING: 'En Producción', MAINTENANCE: 'Fuera de Servicio / Reparación', IDLE: 'Disponible / Espera' },
            staffPlaceholder: 'Ej: Soldador, Pintor, Armado, Plegador...',
        },
        'MECHANIC_WORKSHOP': {
            sidebarItems: ['/dashboard', '/pedidos', '/vehiculos', '/clientes', '/produccion', '/stock', '/personal', '/reportes', '/ajustes'],
            labels: {
                produccion: 'Rampas de Trabajo',
                items: 'Tareas / Reparaciones',
                maquinas: 'Rampas',
                pedidos: 'Servicios',
                materiales: 'Repuestos / Insumos',
                unidadName: 'Nombre de la Rampa',
                unidadModel: 'Capacidad / Tipo',
                mostrarStock: 'false',
                accionNuevoPedido: 'Nuevo Servicio',
            },
            icons: { pedidos: 'Wrench', produccion: 'Hammer', maquinas: 'Wrench', materiales: 'Package' },
            stats: [
                { key: 'totalSales', label: 'Ventas Totales', icon: 'TrendingUp', format: 'currency' },
                { key: 'pendingBalance', label: 'Saldo a Cobrar', icon: 'Wallet', format: 'currency' },
                { key: 'activeOrders', label: 'Vehículos en Taller', icon: 'Hammer', format: 'number' },
                { key: 'productionOrders', label: 'Tareas Pendientes', icon: 'Clock', format: 'number' },
            ],
            productionStages: [
                { key: 'PENDING', label: 'Recepción / Espera', color: 'bg-zinc-100' },
                { key: 'DIAGNOSTICO', label: 'Diagnóstico', color: 'bg-blue-400' },
                { key: 'ESPERANDO_REPUESTOS', label: 'Esperando Repuestos', color: 'bg-amber-500' },
                { key: 'IN_PROGRESS', label: 'En Rampa / Reparando', color: 'bg-blue-600' },
                { key: 'READY', label: 'Listo para Entrega', color: 'bg-emerald-500' },
                { key: 'DONE', label: 'Finalizado', color: 'bg-emerald-600' },
                { key: 'DELIVERED', label: 'Entregado', color: 'bg-zinc-100' },
            ],
            materialConfig: {
                namePlaceholder: 'Ej: Filtro de aceite / Pastillas freno',
                brandPlaceholder: 'Ej: Mahle / Brembo',
                defaultUnit: 'uds',
                defaultType: 'REPUESTO',
                types: [{ key: 'REPUESTO', label: 'REPUESTO' }, { key: 'LUBRICANTE', label: 'LUBRICANTE / FLUIDO' }, { key: 'INSUMO', label: 'INSUMO TALLER' }, { key: 'OTRO', label: 'OTRO' }],
                units: [{ key: 'uds', label: 'Unidades (uds)' }, { key: 'l', label: 'Litros (l)' }, { key: 'ml', label: 'Mililitros (ml)' }],
            },
            itemFields: [
                { key: 'nombreProducto', label: 'Trabajo / Servicio', tipo: 'select', required: true, options: ['Service General', 'Cambio de Aceite y Filtros', 'Frenos (Pastillas/Discos)', 'Carburación / Inyección', 'Transmisión', 'Suspensión', 'Electricidad', 'Gomería', 'Motor', 'Lavado', 'Diagnóstico Computarizado', 'Otro'], placeholder: 'Seleccionar trabajo...' },
                { key: 'materiales_utilizados', label: 'Repuestos / Insumos', tipo: 'key-value-list', section: 'RECURSOS' },
                { key: 'reference_image', label: 'Foto del Estado / Recepción', tipo: 'url', section: 'GENERAL', placeholder: 'Evidencia Fotográfica' },
                { key: 'descripcion', label: 'Observaciones de Diagnóstico', tipo: 'textarea', section: 'GENERAL', placeholder: 'Detallar fallas encontradas...' },
            ],
            features: { hasNozzle: false, hasMaxFilaments: false, hasVisits: false, hasQuotes: true, hasMaterials: true, hasVehicles: true },
            machineStatusLabels: { WORKING: 'Ocupada', MAINTENANCE: 'Fuera de Servicio', IDLE: 'Disponible' },
            staffPlaceholder: 'Ej: Mecánico, Ayudante, Recepcionista...',
        },
        'KIOSCO': {
            sidebarItems: ['/kiosco/dashboard', '/kiosco/venta', '/kiosco/caja', '/kiosco/productos', '/kiosco/compras', '/kiosco/proveedores', '/reportes', '/ajustes'],
            labels: {
                produccion: 'Ventas de Hoy',
                items: 'Ventas',
                maquinas: 'Cajas Registradoras',
                materiales: 'Proveedores',
                unidadName: 'Nombre de la Caja',
                unidadModel: 'Ubicación / Sector',
            },
            icons: { produccion: 'TrendingUp', maquinas: 'Wallet', materiales: 'Truck' },
            stats: [
                { key: 'totalSales', label: 'Ventas Totales', icon: 'TrendingUp', format: 'currency' },
                { key: 'activeSales', label: 'Ventas de Hoy', icon: 'ShoppingCart', format: 'number' },
                { key: 'lowStock', label: 'Alertas de Stock', icon: 'AlertTriangle', format: 'number' },
            ],
            productionStages: [
                { key: 'PENDING', label: 'Pendiente Pago', color: 'bg-zinc-100' },
                { key: 'DONE', label: 'Vendido/Cerrado', color: 'bg-emerald-500' },
                { key: 'CANCELLED', label: 'Anulado', color: 'bg-red-500' }
            ],
            materialConfig: {
                namePlaceholder: 'Ej: Coca Cola 500ml',
                brandPlaceholder: 'Ej: Coca Cola Company',
                defaultUnit: 'uds',
                defaultType: 'PRODUCTO',
                types: [{ key: 'PRODUCTO', label: 'Producto' }],
                units: [{ key: 'uds', label: 'Unidad' }],
            },
            itemFields: [],
            features: { hasNozzle: false, hasMaxFilaments: false, hasVisits: false, hasQuotes: false, hasMaterials: false, hasVehicles: false },
            machineStatusLabels: { WORKING: 'Abierta', MAINTENANCE: 'Cerrada / Arqueo', IDLE: 'Lista' },
            staffPlaceholder: 'Ej: Vendedor, Cajero...',
        },
        'CARPINTERIA': {
            sidebarItems: ['/dashboard', '/pedidos', '/stock', '/clientes', '/personal', '/reportes', '/ajustes'],
            labels: {
                produccion: 'Estado de Armado',
                items: 'Muebles y Componentes',
                maquinas: 'Bancos / Operarios',
                materiales: 'Maderas',
                unidadName: 'Nombre del Banco / Operario',
                unidadModel: 'Especialidad / Herramientas',
            },
            icons: { pedidos: 'ClipboardList', produccion: 'Hammer', maquinas: 'Wrench', materiales: 'Trees' },
            stats: [
                { key: 'totalSales', label: 'Ventas Totales', icon: 'TrendingUp', format: 'currency' },
                { key: 'pendingBalance', label: 'Saldo a Cobrar', icon: 'Wallet', format: 'currency' },
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
                types: [{ key: 'PLACA', label: 'PLACA / TABLERO' }, { key: 'MADERA', label: 'MADERA MACIZA / LISTÓN' }, { key: 'HERRAJE', label: 'HERRAJE / TIRADOR' }, { key: 'INSUMO', label: 'INSUMO (COLA/LIJA)' }, { key: 'OTRO', label: 'OTRO' }],
                units: [{ key: 'uds', label: 'Unidades (uds)' }, { key: 'm', label: 'Metros (m)' }, { key: 'm2', label: 'M2 (Superficie)' }],
            },
            itemFields: [
                { key: 'nombreProducto', label: 'Mueble / Producto', tipo: 'text', section: 'INFORMACIÓN DEL TRABAJO', required: true, placeholder: 'Ej. Mesa ratona' },
                { key: 'madera', label: 'Tipo de Madera', tipo: 'text', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej. Pino, Roble' },
                { key: 'medidas', label: 'Dimensiones Finales', tipo: 'text', section: 'INFORMACIÓN DEL TRABAJO', placeholder: 'Ej. 120 x 80 x 45 cm' },
                { key: 'herrajes', label: 'Detalle de Herrajes', tipo: 'textarea', section: 'ESPECIFICACIONES TÉCNICAS' },
            ],
            features: { hasNozzle: false, hasMaxFilaments: false, hasVisits: false, hasQuotes: false, hasMaterials: true, hasVehicles: false },
            machineStatusLabels: { WORKING: 'En Armado', MAINTENANCE: 'Fuera de Servicio', IDLE: 'Banco Libre' },
            staffPlaceholder: 'Ej: Carpintero, Lijador, Lustrador, Diseñador...',
        }
    };

    for (const [key, config] of Object.entries(configsByRubro)) {
        const template = await templateRepo.findOneBy({ key: key as any });
        if (template) {
            console.log(`Actualizando template: ${key}`);
            // Merge profundo seguro (mantenemos campos existentes si no están en la nueva config)
            template.config = {
                ...(template.config || {}),
                ...config,
                labels: { ...(template.config?.labels || {}), ...config.labels },
                features: { ...(template.config?.features || {}), ...config.features }
            };
            await templateRepo.save(template);
        } else {
            console.log(`Creando nuevo template: ${key}`);
            const newTemplate = templateRepo.create({
                key: key as any,
                name: key.replace('_', ' '),
                description: `Configuración dinámica para ${key}`,
                isEnabled: true,
                config
            });
            await templateRepo.save(newTemplate);
        }
    }

    console.log('--- MIGRACIÓN COMPLETADA ---');
    await app.close();
}

bootstrap().catch(err => {
    console.error('Error en migración:', err);
    process.exit(1);
});
