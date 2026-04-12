const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://postgres.jrcdlzqbadyueodqpsii:lb0FL2GbQTgvpEqt@aws-1-us-east-2.pooler.supabase.com:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT n.nspname as schema, t.typname as type, array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE t.typname = 'machines_status_enum'
    GROUP BY n.nspname, t.typname;
  `);
  console.log('Enum values:', JSON.stringify(res.rows, null, 2));
  await client.end();
}
run().catch(console.error);
