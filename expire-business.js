const { Client } = require('pg');

const client = new Client({
  connectionString: "postgresql://postgres.jrcdlzqbadyueodqpsii:lb0FL2GbQTgvpEqt@aws-1-us-east-2.pooler.supabase.com:5432/postgres",
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    await client.connect();
    const businessId = 'a106f2ae-ff5d-4df4-a844-9ed775afaa78';
    
    // Set to ACTIVE but with expired date
    const query = `
      UPDATE businesses 
      SET 
        status = 'ACTIVE', 
        subscription_expires_at = '2024-01-01 00:00:00',
        trial_expires_at = '2024-01-01 00:00:00'
      WHERE id = $1
    `;
    
    const res = await client.query(query, [businessId]);
    console.log('Update successful:', res.rowCount, 'row(s) affected');
    
    // Also update business_subscriptions if it exists
    const subQuery = `
      UPDATE business_subscriptions
      SET status = 'EXPIRED', current_period_end = '2024-01-01 00:00:00'
      WHERE business_id = $1
    `;
    await client.query(subQuery, [businessId]);
    console.log('Subscription update attempt completed');

  } catch (err) {
    console.error('Error executing query', err.stack);
  } finally {
    await client.end();
  }
}

run();
