const { Client } = require('pg');

async function run() {
  const client = new Client({
    connectionString: "postgresql://postgres.jrcdlzqbadyueodqpsii:lb0FL2GbQTgvpEqt@aws-1-us-east-2.pooler.supabase.com:6543/postgres",
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to DB');
    const res = await client.query("SELECT id, name, cost_per_kg, remaining_weight_grams, total_weight_grams FROM materials");
    console.log('Materials:', JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}

run();
