export enum OrderType {
    CUSTOMER = 'CUSTOMER',
    STOCK = 'STOCK',
}

export enum OrderStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE',
    DRAFT = 'DRAFT',
    CONFIRMED = 'CONFIRMED',
    READY = 'READY',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    // Granular stages for multi-industry
    DESIGN = 'DESIGN',
    CUTTING = 'CUTTING',
    WELDING = 'WELDING',
    ASSEMBLY = 'ASSEMBLY',
    PAINTING = 'PAINTING',
    BARNIZADO = 'BARNIZADO',
    POST_PROCESS = 'POST_PROCESS',
    FAILED = 'FAILED',
    REPRINT_PENDING = 'REPRINT_PENDING',
    RE_WORK = 'RE_WORK',
    IN_STOCK = 'IN_STOCK',
    // Metalwork workflow
    SITE_VISIT = 'SITE_VISIT',
    SITE_VISIT_DONE = 'SITE_VISIT_DONE',
    VISITA_REPROGRAMADA = 'VISITA_REPROGRAMADA',
    VISITA_CANCELADA = 'VISITA_CANCELADA',
    QUOTATION = 'QUOTATION',
    BUDGET_GENERATED = 'BUDGET_GENERATED',
    BUDGET_REJECTED = 'BUDGET_REJECTED',
    SURVEY_DESIGN = 'SURVEY_DESIGN',
    APPROVED = 'APPROVED',
    OFFICIAL_ORDER = 'OFFICIAL_ORDER',
    INSTALACION_OBRA = 'INSTALACION_OBRA',
    ARMADO = 'ARMADO',
}

export enum JobStatus {
    QUEUED = 'QUEUED',
    PRINTING = 'PRINTING',
    PAUSED = 'PAUSED',
    FAILED = 'FAILED',
    DONE = 'DONE',
    CANCELLED = 'CANCELLED',
}

export enum MachineStatus {
    IDLE = 'IDLE',
    PRINTING = 'PRINTING',
    MAINTENANCE = 'MAINTENANCE',
    DOWN = 'DOWN',
}

export enum Priority {
    LOW = 'LOW',
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

export enum FileType {
    STL = 'STL',
    THREE_MF = '3MF',
    OBJ = 'OBJ',
    IMAGE = 'IMAGE',
    OTHER = 'OTHER',
}

export enum PaymentMethod {
    CASH = 'CASH',
    TRANSFER = 'TRANSFER',
    CARD = 'CARD',
    MP = 'MP',
}

export enum ProductFileRole {
    MODEL = 'MODEL',
    PREVIEW = 'PREVIEW',
    INSTRUCTIONS = 'INSTRUCTIONS',
}

export enum MaterialType {
    // 3D Printing
    PLA = 'PLA',
    PETG = 'PETG',
    ABS = 'ABS',
    TPU = 'TPU',
    RESIN = 'RESIN',
    LIMPIEZA = 'LIMPIEZA',

    // Metalwork / Construction
    PERFIL = 'PERFIL',
    CHAPA = 'CHAPA',
    MACHO = 'MACHO', // Machimbre / Revestimientos
    HIERRO = 'HIERRO',
    ACERO = 'ACERO',

    // Carpentry
    PLACA = 'PLACA',
    MADERA = 'MADERA',

    // Common / General
    HERRAJE = 'HERRAJE',
    INSUMO = 'INSUMO',
    PRODUCTO = 'PRODUCTO',
    OTRO = 'OTRO'
}
