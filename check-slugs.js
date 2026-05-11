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

async function checkSlugs() {
    try {
        await AppDataSource.initialize();
        console.log('Connected to DB');
        const businesses = await AppDataSource.query('SELECT id, name, slug, is_enabled FROM businesses');
        console.log('--- Businesses in DB ---');
        businesses.forEach(b => {
            console.log(`ID: ${b.id} | Name: ${b.name} | Slug: ${b.slug} | Enabled: ${b.is_enabled}`);
        });
        console.log('------------------------');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await AppDataSource.destroy();
    }
}

checkSlugs();
