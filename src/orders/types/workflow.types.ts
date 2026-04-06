export interface ProductionStageTemplate {
    title: string;
    rank: number;
}

export interface WorkflowConfig {
    stages: ProductionStageTemplate[];
}
