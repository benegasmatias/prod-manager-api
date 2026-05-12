import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

async function run() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const ds = app.get(DataSource);
    const templates = await ds.query('SELECT key, config FROM business_templates');
    console.log(JSON.stringify(templates, null, 2));
    await app.close();
}
run();
