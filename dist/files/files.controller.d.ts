import { FilesService } from './files.service';
export declare class FilesController {
    private readonly filesService;
    constructor(filesService: FilesService);
    upload(file: any): Promise<{
        url: string;
        fileName: string;
        size: number;
        mimeType: string;
    }>;
}
