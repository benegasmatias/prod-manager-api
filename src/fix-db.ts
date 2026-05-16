
import { DataSource } from 'typeorm';

async function bootstrap() {
  const ds = new DataSource({
    type: 'postgres',
    url: 'postgresql://postgres.jrcdlzqbadyueodqpsii:lb0FL2GbQTgvpEqt@aws-1-us-east-2.pooler.supabase.com:5432/postgres',
    synchronize: false,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await ds.initialize();
    console.log('🔍 Verificando estructura de la tabla...');
    await ds.query("ALTER TABLE retail_products ADD COLUMN IF NOT EXISTS category VARCHAR DEFAULT 'Otros'");
    console.log('✅ Columna category asegurada en retail_products.');
  } catch (error) {
    console.error('❌ Error sincronizando DB:', error.message);
  } finally {
    await ds.destroy();
  }
}

bootstrap();
