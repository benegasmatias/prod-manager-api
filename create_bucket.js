const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function createBucket() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase.storage.createBucket('prodmanager-files', {
    public: true,
    fileSizeLimit: 52428800, // 50MB
    allowedMimeTypes: ['*'],
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log('Bucket already exists.');
    } else {
      console.error('Error creating bucket:', error);
    }
    return;
  }
  console.log('Bucket created successfully:', data.name);
}

createBucket();
