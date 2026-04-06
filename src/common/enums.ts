export enum OrderType {
    CLIENT = 'CLIENT',
    CUSTOMER = 'CLIENT', // Alias for legacy/migration
    STOCK = 'STOCK'
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

export enum BusinessStatus {
    DRAFT = 'DRAFT',
    ACTIVE = 'ACTIVE',
    SUSPENDED = 'SUSPENDED',
    ARCHIVED = 'ARCHIVED',
}

export enum BusinessRole {
    OWNER = 'OWNER',
    BUSINESS_ADMIN = 'BUSINESS_ADMIN',
    SALES = 'SALES',
    OPERATOR = 'OPERATOR',
    VIEWER = 'VIEWER',
}

export enum UserRole {
    OWNER = 'OWNER',
    BUSINESS_ADMIN = 'BUSINESS_ADMIN',
    SALES = 'SALES',
    OPERATOR = 'OPERATOR',
    VIEWER = 'VIEWER',
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
}

export enum ProductionJobStatus {
    QUEUED = 'QUEUED',
    IN_PROGRESS = 'IN_PROGRESS',
    PRINTING = 'IN_PROGRESS', // Alias for legacy 3D printing
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
