import { AppDataSource } from './src/db/data-source';
import { BusinessTemplate } from './src/businesses/entities/business-template.entity';

async function check() {
    await AppDataSource.initialize();
    const repo = AppDataSource.getRepository(BusinessTemplate);
    const templates = await repo.find();
    console.log('TEMPLATES IN DB with isEnabled:', templates.map(t => ({ key: t.key, isEnabled: t.isEnabled })));
    process.exit(0);
}

check();
