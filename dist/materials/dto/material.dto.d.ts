export declare class CreateMaterialDto {
    name: string;
    type: string;
    brand?: string;
    color?: string;
    costPerKg?: number;
    businessId: string;
    totalWeightGrams?: number;
    remainingWeightGrams?: number;
    unit?: string;
    bedTemperature?: number;
    nozzleTemperature?: number;
}
export declare class UpdateMaterialDto {
    name?: string;
    type?: string;
    brand?: string;
    color?: string;
    costPerKg?: number;
    active?: boolean;
    totalWeightGrams?: number;
    remainingWeightGrams?: number;
    unit?: string;
    bedTemperature?: number;
    nozzleTemperature?: number;
}
