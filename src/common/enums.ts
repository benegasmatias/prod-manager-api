export enum OrderType {
    CLIENT = 'CLIENT',
    STOCK = 'STOCK',
    CUSTOM = 'CUSTOM'
}

export enum OrderStatus {
    DRAFT = 'DRAFT',
    PENDING = 'PENDING',
    CONFIRMED = 'CONFIRMED',
    IN_PROGRESS = 'IN_PROGRESS',
    READY = 'READY',
    DELIVERED = 'DELIVERED',
    CANCELLED = 'CANCELLED',
    // Compatibility statuses
    DONE = 'DONE',
    IN_STOCK = 'IN_STOCK',
    FAILED = 'FAILED',
    DESIGN = 'DESIGN',
    // Industrial & Multi-industry statuses
    QUOTATION = 'QUOTATION',
    BUDGET_GENERATED = 'BUDGET_GENERATED',
    BUDGET_REJECTED = 'BUDGET_REJECTED',
    RE_WORK = 'RE_WORK',
    REPRINT_PENDING = 'REPRINT_PENDING',
    SITE_VISIT = 'SITE_VISIT',
    SITE_VISIT_DONE = 'SITE_VISIT_DONE',
    VISITA_REPROGRAMADA = 'VISITA_REPROGRAMADA',
    VISITA_CANCELADA = 'VISITA_CANCELADA',
    APPROVED = 'APPROVED',
    OFFICIAL_ORDER = 'OFFICIAL_ORDER',
    CUTTING = 'CUTTING',
    WELDING = 'WELDING',
    ASSEMBLY = 'ASSEMBLY',
    PAINTING = 'PAINTING',
    BARNIZADO = 'BARNIZADO',
    POST_PROCESS = 'POST_PROCESS',
    SURVEY_DESIGN = 'SURVEY_DESIGN',
    INSTALACION_OBRA = 'INSTALACION_OBRA',
    READY_FOR_DELIVERY = 'READY_FOR_DELIVERY'
}


export enum MachineStatus {
    IDLE = 'IDLE',
    PRINTING = 'PRINTING',
    WORKING = 'WORKING',
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

export enum BusinessStatus {
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    ARCHIVED = 'ARCHIVED',
    DRAFT = 'DRAFT',
}

export enum UserStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    BLOCKED = 'BLOCKED'
}

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    USER = 'USER'
}

export enum BusinessRole {
    OWNER = 'OWNER',
    ADMIN = 'ADMIN', // Keeping for legacy/internal use
    BUSINESS_ADMIN = 'BUSINESS_ADMIN',
    SALES = 'SALES',
    OPERATOR = 'OPERATOR',
    VIEWER = 'VIEWER'
}

export enum SubscriptionStatus {
    TRIALING = 'TRIALING',
    ACTIVE = 'ACTIVE',
    PAST_DUE = 'PAST_DUE',
    SUSPENDED = 'SUSPENDED',
    CANCELED = 'CANCELED',
    EXPIRED = 'EXPIRED',
}

export enum WebhookStatus {
    RECEIVED = 'RECEIVED',
    PROCESSED = 'PROCESSED',
    FAILED = 'FAILED',
    IGNORED = 'IGNORED',
}

export enum OrderItemStatus {
    PENDING = 'PENDING',
    IN_PROGRESS = 'IN_PROGRESS',
    READY = 'READY',
    DONE = 'DONE', // Entregado final
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
    IN_STOCK = 'IN_STOCK',
    DESIGN = 'DESIGN',
    // Industrial & Multi-industry statuses
    QUOTATION = 'QUOTATION',
    BUDGET_GENERATED = 'BUDGET_GENERATED',
    BUDGET_REJECTED = 'BUDGET_REJECTED',
    RE_WORK = 'RE_WORK',
    REPRINT_PENDING = 'REPRINT_PENDING',
    SITE_VISIT = 'SITE_VISIT',
    SITE_VISIT_DONE = 'SITE_VISIT_DONE',
    VISITA_REPROGRAMADA = 'VISITA_REPROGRAMADA',
    VISITA_CANCELADA = 'VISITA_CANCELADA',
    APPROVED = 'APPROVED',
    OFFICIAL_ORDER = 'OFFICIAL_ORDER',
    CUTTING = 'CUTTING',
    WELDING = 'WELDING',
    ASSEMBLY = 'ASSEMBLY',
    PAINTING = 'PAINTING',
    BARNIZADO = 'BARNIZADO',
    POST_PROCESS = 'POST_PROCESS',
    SURVEY_DESIGN = 'SURVEY_DESIGN',
    INSTALACION_OBRA = 'INSTALACION_OBRA',
    READY_FOR_DELIVERY = 'READY_FOR_DELIVERY'
}

export enum ProductionJobStatus {
    QUEUED = 'QUEUED',
    IN_PROGRESS = 'IN_PROGRESS',
    PAUSED = 'PAUSED',
    DONE = 'DONE',
    FAILED = 'FAILED',
    CANCELLED = 'CANCELLED',
}

export enum ProductionJobPriority {
    LOW = 'LOW',
    NORMAL = 'NORMAL',
    HIGH = 'HIGH',
    URGENT = 'URGENT',
}

export enum MaterialType {
    PLA = 'PLA',
    PETG = 'PETG',
    ABS = 'ABS',
    TPU = 'TPU',
    RESINA = 'RESINA',
    CAÑO = 'CAÑO',
    PERFIL = 'PERFIL',
    CHAPA = 'CHAPA',
    BARRA = 'BARRA',
    PLACA = 'PLACA',
    MADERA = 'MADERA',
    HERRAJE = 'HERRAJE',
    INSUMO = 'INSUMO'
}

export enum ProductFileRole {
    THUMBNAIL = 'THUMBNAIL',
    GALLERY = 'GALLERY',
    MODEL = 'MODEL', // Added
    SOURCE = 'SOURCE',
    GCODE = 'GCODE',
    OTHER = 'OTHER'
}
