
import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function cleanup() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        // Deactivate old inconsistent plans
        await client.query("UPDATE subscription_plans SET active = false WHERE name = 'Taller Free' AND category = 'METALURGICA'");
        console.log('Cleanup completed: Taller Free deactivated for METALURGICA');
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
cleanup();
