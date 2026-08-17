import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StorageClient } from '@supabase/storage-js';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: StorageClient | null = null;

  constructor(private readonly config: ConfigService) {}

  private getClient(): StorageClient {
    if (this.client) return this.client;

    const url = this.config.get<string>('SUPABASE_URL');
    const serviceKey = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !serviceKey) {
      throw new InternalServerErrorException(
        'Upload de imagem indisponível: configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.',
      );
    }
    this.client = new StorageClient(`${url}/storage/v1`, {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
    });
    return this.client;
  }

  async uploadSalonLogo(salonId: string, file: Express.Multer.File): Promise<string> {
    const bucket = this.config.get<string>('SUPABASE_LOGO_BUCKET') ?? 'logos';
    const ext = file.originalname.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${salonId}/logo-${Date.now()}.${ext}`;

    const client = this.getClient();
    const { error } = await client.from(bucket).upload(path, file.buffer, {
      contentType: file.mimetype,
      upsert: true,
    });
    if (error) {
      this.logger.error(`Falha ao enviar logo para o bucket "${bucket}": ${error.message}`);
      throw new InternalServerErrorException('Falha ao enviar a imagem.');
    }

    const { data } = client.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  }
}
