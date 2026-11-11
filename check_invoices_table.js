import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wgxxitydatuoyjnxuvqw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndneHhpdHlkYXR1b3lqbnh1dnF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0Mzc0NDEsImV4cCI6MjEwNzAxMzQ0MX0.fGbnNvfFNOpbVUb1KzaxUF_2PBarovyX3pU58HVEoA0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testTable() {
  const { data, error } = await supabase.from('invoices').select('*').limit(1);
  if (error) {
    console.error('INVOICE_TABLE_CHECK_FAILED:', error.message);
    process.exit(1);
  } else {
    console.log('INVOICE_TABLE_LIVE_CONFIRMED: Table exists and is queryable!');
    process.exit(0);
  }
}

testTable();
