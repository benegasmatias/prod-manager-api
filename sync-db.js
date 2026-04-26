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
    // Entities paths might be different, let's try to just use the entities themselves if we can
    // but here we just want to run synchronization based on the metadata
    // In NestJS it's easier, but here we can try to ALTER TABLE manually or just rely on Nest.
    synchronize: true,
    logging: true,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    entities: [
        path.join(__dirname, 'dist/**/*.entity.js') // This might not work if dist is empty
    ]
});

async function sync() {
    try {
        console.log('Synchronizing...');
        await AppDataSource.initialize();
        console.log('Success!');
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await AppDataSource.destroy();
    }
}

sync();
