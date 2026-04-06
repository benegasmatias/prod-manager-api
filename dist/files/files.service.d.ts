import { SupabaseService } from '../common/supabase/supabase.service';
export declare class FilesService {
    private readonly supabaseService;
    constructor(supabaseService: SupabaseService);
    uploadFile(file: any, path?: string): Promise<{
        url: string;
        path: string;
        fileName: string;
        size: number;
        mimeType: string;
    }>;
    deleteFile(filePath: string): Promise<{
        success: boolean;
    }>;
}
