export declare enum OrderType {
    CUSTOMER = "CUSTOMER",
    STOCK = "STOCK"
}
export declare enum OrderStatus {
    PENDING = "PENDING",
    IN_PROGRESS = "IN_PROGRESS",
    DONE = "DONE",
    DRAFT = "DRAFT",
    CONFIRMED = "CONFIRMED",
    READY = "READY",
    DELIVERED = "DELIVERED",
    CANCELLED = "CANCELLED",
    DESIGN = "DESIGN",
    CUTTING = "CUTTING",
    WELDING = "WELDING",
    ASSEMBLY = "ASSEMBLY",
    PAINTING = "PAINTING",
    BARNIZADO = "BARNIZADO",
    POST_PROCESS = "POST_PROCESS",
    FAILED = "FAILED",
    REPRINT_PENDING = "REPRINT_PENDING",
    RE_WORK = "RE_WORK",
    IN_STOCK = "IN_STOCK",
    SITE_VISIT = "SITE_VISIT",
    SITE_VISIT_DONE = "SITE_VISIT_DONE",
    VISITA_REPROGRAMADA = "VISITA_REPROGRAMADA",
    VISITA_CANCELADA = "VISITA_CANCELADA",
    QUOTATION = "QUOTATION",
    BUDGET_GENERATED = "BUDGET_GENERATED",
    BUDGET_REJECTED = "BUDGET_REJECTED",
    SURVEY_DESIGN = "SURVEY_DESIGN",
    APPROVED = "APPROVED",
    OFFICIAL_ORDER = "OFFICIAL_ORDER",
    INSTALACION_OBRA = "INSTALACION_OBRA",
    ARMADO = "ARMADO"
}
export declare enum JobStatus {
    QUEUED = "QUEUED",
    PRINTING = "PRINTING",
    PAUSED = "PAUSED",
    FAILED = "FAILED",
    DONE = "DONE",
    CANCELLED = "CANCELLED"
}
export declare enum PrinterStatus {
    IDLE = "IDLE",
    PRINTING = "PRINTING",
    MAINTENANCE = "MAINTENANCE",
    DOWN = "DOWN"
}
export declare enum Priority {
    LOW = "LOW",
    NORMAL = "NORMAL",
    HIGH = "HIGH",
    URGENT = "URGENT"
}
export declare enum FileType {
    STL = "STL",
    THREE_MF = "3MF",
    OBJ = "OBJ",
    IMAGE = "IMAGE",
    OTHER = "OTHER"
}
export declare enum PaymentMethod {
    CASH = "CASH",
    TRANSFER = "TRANSFER",
    CARD = "CARD",
    MP = "MP"
}
export declare enum ProductFileRole {
    MODEL = "MODEL",
    PREVIEW = "PREVIEW",
    INSTRUCTIONS = "INSTRUCTIONS"
}
export declare enum MaterialType {
    PLA = "PLA",
    PETG = "PETG",
    ABS = "ABS",
    TPU = "TPU",
    RESIN = "RESIN",
    LIMPIEZA = "LIMPIEZA",
    PERFIL = "PERFIL",
    CHAPA = "CHAPA",
    MACHO = "MACHO",
    HIERRO = "HIERRO",
    ACERO = "ACERO",
    PLACA = "PLACA",
    MADERA = "MADERA",
    HERRAJE = "HERRAJE",
    INSUMO = "INSUMO",
    PRODUCTO = "PRODUCTO",
    OTRO = "OTRO"
}
