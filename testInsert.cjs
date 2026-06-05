const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.replace('\r', '').match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const supabaseAnonKey = envVars['VITE_SUPABASE_ANON_KEY'];

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testInsert() {
  console.log("Testing insert on 'users' table...");
  const { data, error } = await supabase.from("users").upsert(
    {
      name: "Test User",
      email: "test@example.com",
      phone: "1234567890",
      platform: "swiggy",
      location: "test",
      vehicle: "bike",
      daily_income: 500,
      premium_status: "pending",
      plan_type: "none",
    },
    { onConflict: "email" }
  );

  if (error) {
    console.error("Insert Error:", error);
  } else {
    console.log("Insert Success Data:", data);
  }
}

testInsert();
