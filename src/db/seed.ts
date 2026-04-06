import { AppDataSource } from './data-source';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { User } from '../users/entities/user.entity';
import { OrderStatus } from '../common/enums';
import { Business } from '../businesses/entities/business.entity';
import { BusinessMembership } from '../businesses/entities/business-membership.entity';
import { UserRole } from '../common/enums';
import { Machine } from '../machines/entities/machine.entity';
import { MachineStatus } from '../common/enums';
import { GlobalRoleConfig } from '../admin/entities/global-role-config.entity';
import { OrderSiteInfo } from '../orders/entities/order-site-info.entity';
import { BusinessTemplate } from '../businesses/entities/business-template.entity';

async function seed() {
    try {
        await AppDataSource.initialize();
        console.log('🌱 Data Source has been initialized for seeding!');

        const orderRepo = AppDataSource.getRepository(Order);
        const itemRepo = AppDataSource.getRepository(OrderItem);
        const businessRepo = AppDataSource.getRepository(Business);
        const roleConfigRepo = AppDataSource.getRepository(GlobalRoleConfig);
        const templateRepo = AppDataSource.getRepository(BusinessTemplate);

        // 0. Global Roles
        const baseRoles = [
            {
                role: 'SUPER_ADMIN',
                description: 'Acceso total al ecosistema',
                capabilities: { 'all_access': true }
            },
            {
                role: 'ADMIN',
                description: 'Administrador operativo del panel general',
                capabilities: { 'manage_businesses': true, 'manage_users': true, 'view_audit': true }
            }
        ];

        for (const r of baseRoles) {
            const exists = await roleConfigRepo.findOneBy({ role: r.role });
            if (!exists) {
                await roleConfigRepo.save(roleConfigRepo.create(r));
                console.log(`✅ Rol configurado: ${r.role}`);
            }
        }

        // 1. Templates de Negocio (SaaS Config)
        const templateConfigs = [
            {
                key: 'IMPRESION_3D',
                name: 'Impresión 3D',
                description: 'Gestión de granjas de impresión, filamentos y servicios de diseño STL.',
                imageKey: '3d-printing-template',
                config: {
                    sidebarItems: ['/dashboard', '/pedidos', '/stock', '/clientes', '/personal', '/maquinas', '/materiales', '/reportes', '/ajustes'],
                    labels: { produccion: 'Producción', items: 'Modelos a Imprimir', maquinas: 'Impresoras', materiales: 'Filamentos', unidadName: 'Nombre de Impresora', unidadModel: 'Modelo / Marca' },
                    icons: { pedidos: 'Box', produccion: 'Cpu', maquinas: 'Printer', materiales: 'Layers' },
                    stats: [
                        { key: 'totalSales', label: 'Ventas Totales', icon: 'TrendingUp', format: 'currency' },
                        { key: 'pendingBalance', label: 'Saldo a Cobrar', icon: 'Wallet', format: 'currency' },
                        { key: 'productionOrders', label: 'Producción en Curso', icon: 'Printer', format: 'number' },
                        { key: 'activePrinters', label: 'Impresoras Activas', icon: 'Zap', format: 'number' }
                    ],
                    productionStages: [
                        { key: 'PENDING', label: 'Pendiente', color: 'bg-zinc-100' },
                        { key: 'DESIGN', label: 'En Diseño', color: 'bg-indigo-500' },
                        { key: 'IN_PROGRESS', label: 'Imprimiendo', color: 'bg-blue-500' },
                        { key: 'FAILED', label: 'Fallo de Impresión', color: 'bg-red-500' },
                        { key: 'REPRINT_PENDING', label: 'Pendiente Reimpresión', color: 'bg-orange-400' },
                        { key: 'POST_PROCESS', label: 'Post-Proceso', color: 'bg-amber-500' },
                        { key: 'DONE', label: 'Terminado', color: 'bg-emerald-500' },
                        { key: 'DELIVERED', label: 'Entregado', color: 'bg-zinc-100' },
                        { key: 'IN_STOCK', label: 'Ingresado a Stock', color: 'bg-purple-500' }
                    ],
                    materialConfig: {
                        namePlaceholder: 'Ej: PLA Negro Pro / PETG Gris',
                        brandPlaceholder: 'Ej: Grilon3 / Printalot',
                        defaultUnit: 'g',
                        defaultType: 'PLA',
                        types: [{ key: 'PLA', label: 'PLA' }, { key: 'PETG', label: 'PETG' }, { key: 'ABS', label: 'ABS' }, { key: 'TPU', label: 'TPU' }, { key: 'RESIN', label: 'RESINA' }, { key: 'LIMPIEZA', label: 'FILAMENTO LIMPIEZA' }],
                        units: [{ key: 'g', label: 'Gramos (g)' }, { key: 'kg', label: 'Kilos (kg)' }]
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
                        { key: 'duracion_estimada_minutos', label: 'Duración (MIN)', tipo: 'number', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej. 120' }
                    ],
                    features: { hasNozzle: true, hasMaxFilaments: true, hasVisits: false, hasQuotes: false, hasMaterials: true },
                    machineStatusLabels: { WORKING: 'Imprimiendo', MAINTENANCE: 'Mantenimiento / Calibración', IDLE: 'Lista para Imprimir' }
                }
            },
            {
                key: 'METALURGICA',
                name: 'Herrería y Metalúrgica',
                description: 'Estructuras metálicas, visitas a obra y presupuestos detallados.',
                imageKey: 'metalwork-template',
                config: {
                    sidebarItems: ['/dashboard', '/visitas', '/presupuestos', '/pedidos', '/stock', '/clientes', '/personal', '/materiales', '/maquinas', '/reportes', '/ajustes'],
                    labels: { produccion: 'Monitor de Taller', items: 'Planos y Estructuras', maquinas: 'Puestos de Trabajo', materiales: 'Materiales', unidadName: 'Nombre del Puesto / Operario', unidadModel: 'Especialidad / Equipo' },
                    icons: { visitas: 'Calendar', presupuestos: 'Zap', pedidos: 'FileText', produccion: 'Cog', maquinas: 'Wrench', materiales: 'Grid' },
                    stats: [
                        { key: 'totalSales', label: 'Ventas Totales', icon: 'TrendingUp', format: 'currency' },
                        { key: 'pendingBalance', label: 'Saldo a Cobrar', icon: 'Wallet', format: 'currency' },
                        { key: 'productionOrders', label: 'Fabricación en Curso', icon: 'Cog', format: 'number' },
                        { key: 'activeOrders', label: 'Proyectos Activos', icon: 'HardHat', format: 'number' }
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
                        { key: 'DELIVERED', label: 'Entregado (Cerrado)', color: 'bg-zinc-100' }
                    ],
                    materialConfig: {
                        namePlaceholder: 'Ej: Caño 40x40 / Chapa N18 / Electrodo 6013',
                        brandPlaceholder: 'Ej: Acer Bragado / Acindar / Sin Marca',
                        defaultUnit: 'm',
                        defaultType: 'PERFIL',
                        types: [{ key: 'PERFIL', label: 'PERFIL / CAÑO' }, { key: 'CHAPA', label: 'CHAPA' }, { key: 'MACHO', label: 'MACHIMBRE' }, { key: 'HERRAJE', label: 'HERRAJE / ACCESORIO' }, { key: 'INSUMO', label: 'INSUMO (DISCO/ELECTRODO)' }, { key: 'OTRO', label: 'OTRO' }],
                        units: [{ key: 'm', label: 'Metros (m)' }, { key: 'uds', label: 'Unidades (uds)' }, { key: 'kg', label: 'Kilos (kg)' }, { key: 'barras', label: 'Barras (6m)' }, { key: 'placas', label: 'Placas/Chapas' }]
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
                        { key: 'refuerzos_estructurales', label: 'Refuerzos Estructurales', tipo: 'boolean', section: 'OPCIONALES' }
                    ],
                    features: { hasNozzle: false, hasMaxFilaments: false, hasVisits: true, hasQuotes: true, hasMaterials: true },
                    machineStatusLabels: { WORKING: 'En Producción', MAINTENANCE: 'Fuera de Servicio / Reparación', IDLE: 'Disponible / Espera' }
                }
            },
            {
                key: 'CARPINTERIA',
                name: 'Carpintería',
                description: 'Amoblamientos a medida, corte de placas y armado en taller.',
                imageKey: 'carpentry-template',
                config: {
                    sidebarItems: ['/dashboard', '/pedidos', '/stock', '/clientes', '/personal', '/produccion', '/reportes', '/ajustes'],
                    labels: { produccion: 'Estado de Armado', items: 'Muebles y Componentes', maquinas: 'Bancos / Operarios', materiales: 'Maderas', unidadName: 'Nombre del Banco / Operario', unidadModel: 'Especialidad / Herramientas' },
                    icons: { pedidos: 'ClipboardList', produccion: 'Hammer', maquinas: 'Wrench', materiales: 'Trees' },
                    stats: [
                        { key: 'totalSales', label: 'Ventas Totales', icon: 'TrendingUp', format: 'currency' },
                        { key: 'pendingBalance', label: 'Saldo a Cobrar', icon: 'Wallet', format: 'currency' },
                        { key: 'productionOrders', label: 'Muebles en Armado', icon: 'Hammer', format: 'number' },
                        { key: 'activeOrders', label: 'Pedidos Pendientes', icon: 'ShoppingCart', format: 'number' }
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
                        { key: 'IN_STOCK', label: 'Ingresado a Stock', color: 'bg-purple-500' }
                    ],
                    materialConfig: {
                        namePlaceholder: 'Ej: Placa Melamina 18mm / Cola Vinílica',
                        brandPlaceholder: 'Ej: Faplac / Egger / Sin Marca',
                        defaultUnit: 'uds',
                        defaultType: 'PLACA',
                        types: [{ key: 'PLACA', label: 'PLACA / TABLERO' }, { key: 'MADERA', label: 'MADERA MACIZA / LISTÓN' }, { key: 'HERRAJE', label: 'HERRAJE / TIRADOR' }, { key: 'INSUMO', label: 'INSUMO (COLA/LIJA)' }, { key: 'OTRO', label: 'OTRO' }],
                        units: [{ key: 'uds', label: 'Unidades (uds)' }, { key: 'm', label: 'Metros (m)' }, { key: 'm2', label: 'M2 (Superficie)' }]
                    },
                    itemFields: [
                        { key: 'nombreProducto', label: 'Mueble / Producto', tipo: 'text', section: 'INFORMACIÓN DEL TRABAJO', required: true, placeholder: 'Ej. Mesa ratona' },
                        { key: 'madera', label: 'Tipo de Madera', tipo: 'text', section: 'ESPECIFICACIONES TÉCNICAS', placeholder: 'Ej. Pino, Roble' },
                        { key: 'medidas', label: 'Dimensiones Finales', tipo: 'text', section: 'INFORMACIÓN DEL TRABAJO', placeholder: 'Ej. 120 x 80 x 45 cm' },
                        { key: 'herrajes', label: 'Detalle de Herrajes', tipo: 'textarea', section: 'ESPECIFICACIONES TÉCNICAS' }
                    ],
                    features: { hasNozzle: false, hasMaxFilaments: false, hasVisits: false, hasQuotes: false, hasMaterials: true },
                    machineStatusLabels: { WORKING: 'En Armado', MAINTENANCE: 'Fuera de Servicio', IDLE: 'Banco Libre' }
                }
            }
        ];

        for (const t of templateConfigs) {
            let temp = await templateRepo.findOneBy({ key: t.key });
            if (!temp) {
                temp = templateRepo.create(t);
                console.log(`✅ Template SaaS creado: ${t.key}`);
            } else {
                temp.config = t.config; // Actualizamos config en el seed
                console.log(`🔄 Template SaaS actualizado: ${t.key}`);
            }
            await templateRepo.save(temp);
        }


        // 2. Negocios Base (Ajustados a los nuevos keys de rubro)
        const baseBusinesses = [
            { name: 'Taller Impresión 3D Alfa', category: 'IMPRESION_3D' },
            { name: 'Servicios Metalúrgicos', category: 'METALURGICA' },
            { name: 'Carpintería Moderna', category: 'CARPINTERIA' },
        ];

        const createdBusinesses = [];
        for (const base of baseBusinesses) {
            let biz = await businessRepo.findOne({
                where: { name: base.name, category: base.category }
            });
            if (!biz) {
                biz = businessRepo.create({
                    name: base.name,
                    category: base.category,
                });
                biz = await businessRepo.save(biz);
                console.log(`✅ Negocio base creado: ${base.name} [${base.category}]`);
            }
            createdBusinesses.push(biz);
        }

        const biz3D = createdBusinesses.find(b => b.category === 'IMPRESION_3D');
        const bizMetal = createdBusinesses.find(b => b.category === 'METALURGICA');

        // 2. Pedido 3D
        const dueSoon = new Date();
        dueSoon.setDate(dueSoon.getDate() + 1);

        const order3D = orderRepo.create({
            businessId: biz3D.id,
            clientName: 'Cliente 3D (Matias)',
            dueDate: dueSoon,
            priority: 10,
            status: OrderStatus.IN_PROGRESS,
        });
        const savedOrder3D = await orderRepo.save(order3D);

        await itemRepo.save([
            itemRepo.create({
                orderId: savedOrder3D.id,
                name: 'Soporte Laptop Gamer',
                estimatedMinutes: 360,
                weightGrams: 240,
                price: 15.5,
                qty: 2,
                doneQty: 1,
            })
        ]);
        console.log('✅ Pedido 3D creado.');

        // 3. Pedido Metalúrgica (Con SiteInfo)
        const dueFar = new Date();
        dueFar.setDate(dueFar.getDate() + 10);

        const orderMetal = orderRepo.create({
            businessId: bizMetal.id,
            clientName: 'Instalación Rejas (Gomez)',
            dueDate: dueFar,
            priority: 5,
            status: OrderStatus.PENDING,
            siteInfo: {
                address: 'Av. Corrientes 1234, CABA',
                visitDate: '2026-04-15',
                visitTime: '10:00 AM',
                visitObservations: 'Traer escalera de 4 metros.'
            } as OrderSiteInfo
        });
        await orderRepo.save(orderMetal);
        console.log('✅ Pedido Metalúrgica creado con SiteInfo.');

        // 4. Máquinas
        const printerRepo = AppDataSource.getRepository(Machine);
        const baseMachines = [
            { name: 'Ender 3 S1 #1', model: 'Creality Ender 3 S1', nozzle: '0.4mm', status: MachineStatus.IDLE, businessId: biz3D.id },
            { name: 'Prusa MK3S+ #1', model: 'Prusa i3 MK3S+', nozzle: '0.6mm', status: MachineStatus.PRINTING, businessId: biz3D.id },
        ];

        for (const p of baseMachines) {
            const exists = await printerRepo.findOne({ where: { name: p.name, businessId: p.businessId } });
            if (!exists) {
                await printerRepo.save(printerRepo.create(p));
                console.log(`✅ Máquina creada: ${p.name}`);
            }
        }

        console.log('🚀 Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during seeding:', error);
        process.exit(1);
    }
}

seed();
