import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function upgradeToProByEmail(email) {
  // Find user by email in profiles
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('email', email)
    .single();

  if (profileError || !profile) {
    console.error('User not found:', profileError);
    return;
  }

  console.log('Found user:', profile.id, profile.email);

  // Update or insert subscription
  const { data, error } = await supabase
    .from('subscriptions')
    .upsert({
      user_id: profile.id,
      plan: 'pro',
      status: 'active',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(), // 1 year
    }, {
      onConflict: 'user_id'
    })
    .select();

  if (error) {
    console.error('Error upgrading:', error);
    return;
  }

  // Also update profile plan for quick lookups
  await supabase
    .from('profiles')
    .update({ plan: 'pro' })
    .eq('id', profile.id);

  console.log('Successfully upgraded to Pro:', data);
}

const email = process.argv[2] || 'neonwatty@gmail.com';
upgradeToProByEmail(email);
