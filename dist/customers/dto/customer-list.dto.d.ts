export declare class CustomerListItemDto {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    notes?: string;
    createdAt: string;
    totalOrders: number;
}
export declare class CustomerListResponseDto {
    items: CustomerListItemDto[];
    total: number;
    page: number;
    limit: number;
}
