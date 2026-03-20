const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.jrcdlzqbadyueodqpsii:lb0FL2GbQTgvpEqt@aws-1-us-east-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  let res = await client.query("SELECT count(*) FROM printers;");
  console.log('Printers count:', res.rows[0].count);
  
  // Also rename:
  await client.query("ALTER TABLE printers RENAME TO machines;");
  console.log('Renamed printers to machines');
  
  await client.query("ALTER TABLE production_jobs RENAME COLUMN printer_id TO machine_id;");
  console.log('Renamed printer_id to machine_id in production_jobs');
  
  await client.end();
}
run().catch(console.error);
