import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBusinesses() {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, name, slug, is_enabled, status');

  if (error) {
    console.error('Error fetching businesses:', error);
    return;
  }

  console.log('--- Businesses in DB ---');
  data.forEach(b => {
    console.log(`ID: ${b.id} | Name: ${b.name} | Slug: ${b.slug} | Enabled: ${b.is_enabled} | Status: ${b.status}`);
  });
  console.log('------------------------');
}

checkBusinesses();
