const { DataSource } = require('typeorm');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env.development') });

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_SUPABASE_HOST || 'aws-1-us-east-2.pooler.supabase.com',
    port: parseInt(process.env.DB_SUPABASE_PORT || '5432'),
    username: process.env.DB_SUPABASE_USERNAME,
    password: process.env.DB_SUPABASE_PASSWORD,
    database: process.env.DB_SUPABASE_NAME,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function inspect() {
    try {
        await AppDataSource.initialize();
        console.log('Connected!');
        const queryRunner = AppDataSource.createQueryRunner();
        const table = await queryRunner.getTable('businesses');
        console.log('Columns:', table.columns.map(c => ({ name: c.name, type: c.type, isNullable: c.isNullable })));
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await AppDataSource.destroy();
    }
}

inspect();
