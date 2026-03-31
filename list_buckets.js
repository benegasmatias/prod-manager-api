const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function listBuckets() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error);
    return;
  }
  console.log('Available buckets:', data.map(b => b.name));
}

listBuckets();
