/**
 * Server-side Supabase Admin Provisioning Script
 *
 * Provisions the initial Unique Restaurant admin account securely via the
 * Supabase Admin API without ever exposing credentials in frontend code.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... ADMIN_EMAIL=admin@uniquerestaurant.ng ADMIN_INITIAL_PASSWORD=... node supabase/setup-admin.mjs
 */
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL || 'admin@uniquerestaurant.ng';
const initialPassword = process.env.ADMIN_INITIAL_PASSWORD;

if (!supabaseUrl || !serviceRoleKey || !initialPassword) {
  console.error(
    'Missing required environment variables: SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, and ADMIN_INITIAL_PASSWORD.'
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function run() {
  const { data: listData, error: listErr } = await supabase.auth.admin.listUsers();
  if (listErr) throw listErr;

  const existing = listData.users.find((u) => u.email?.toLowerCase() === adminEmail.toLowerCase());
  let userId;

  if (existing) {
    userId = existing.id;
    console.log(`Admin user already exists (${adminEmail}). Ensuring profile role is admin.`);
  } else {
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: initialPassword,
      email_confirm: true,
      user_metadata: { must_change_password: true },
    });
    if (createErr) throw createErr;
    userId = created.user.id;
    console.log(`Created admin user ${adminEmail} with must_change_password=true.`);
  }

  const { error: profileErr } = await supabase.from('profiles').upsert({
    id: userId,
    email: adminEmail,
    role: 'admin',
    must_change_password: true,
  });

  if (profileErr) throw profileErr;
  console.log('Admin profile provisioned successfully.');
}

run().catch((err) => {
  console.error('Admin provisioning failed:', err);
  process.exit(1);
});
