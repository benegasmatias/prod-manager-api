import { Injectable, BadRequestException } from '@nestjs/common';
import { SupabaseService } from '../common/supabase/supabase.service';

@Injectable()
export class FilesService {
  constructor(private readonly supabaseService: SupabaseService) {}

  async uploadFile(file: any, path: string = 'stls'): Promise<{ url: string; fileName: string; size: number; mimeType: string }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const client = this.supabaseService.getClient();
    const fileName = `${Date.now()}-${file.originalname}`;
    const filePath = `${path}/${fileName}`;

    const { data, error } = await client.storage
      .from('prodmanager-files') // Make sure this bucket exists
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      throw new BadRequestException(`Upload error: ${error.message}`);
    }

    const { data: publicUrlData } = client.storage
      .from('prodmanager-files')
      .getPublicUrl(filePath);

    return {
      url: publicUrlData.publicUrl,
      fileName: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}
