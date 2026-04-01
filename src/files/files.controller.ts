import { Controller, Post, Delete, Body, UseInterceptors, UploadedFile, UseGuards, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FilesService } from './files.service';
import { SupabaseAuthGuard } from '../users/guards/supabase-auth.guard';

@Controller('files')
@UseGuards(SupabaseAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(@UploadedFile() file: any) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    return this.filesService.uploadFile(file);
  }

  @Delete('delete')
  async delete(@Body('path') path: string) {
    if (!path) {
      throw new BadRequestException('Path is required');
    }
    return this.filesService.deleteFile(path);
  }
}
