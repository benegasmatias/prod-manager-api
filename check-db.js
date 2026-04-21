const { DataSource } = require('typeorm');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env.development') });

const AppDataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_SUPABASE_HOST,
    port: parseInt(process.env.DB_SUPABASE_PORT || '5432'),
    username: process.env.DB_SUPABASE_USERNAME,
    password: process.env.DB_SUPABASE_PASSWORD,
    database: process.env.DB_SUPABASE_NAME,
    synchronize: false,
    logging: false,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

async function checkPlans() {
    try {
        await AppDataSource.initialize();
        console.log('Connected to DB');
        await AppDataSource.query('ALTER TABLE subscription_plans ADD COLUMN IF NOT EXISTS category VARCHAR(255)');
        console.log('Column added (if not existed)');
        const plans = await AppDataSource.query('SELECT id, name, category FROM subscription_plans');
        console.log('Plans:', plans);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await AppDataSource.destroy();
    }
}

checkPlans();
