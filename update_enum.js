const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.jrcdlzqbadyueodqpsii:lb0FL2GbQTgvpEqt@aws-1-us-east-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  try {
    await client.query("ALTER TYPE machines_status_enum ADD VALUE IF NOT EXISTS 'PRINTING';");
    console.log('✅ Added PRINTING to machines_status_enum');
  } catch (err) {
    console.error('❌ Error updating enum:', err.message);
  }
  await client.end();
}
run();
