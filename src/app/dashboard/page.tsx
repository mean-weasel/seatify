import { createClient } from '@/lib/supabase/server';
import { EventListClient } from '@/components/EventListClient';

export const metadata = {
  title: 'My Events',
};

export default async function DashboardPage() {
  const supabase = await createClient();

  // Fetch user's events
  const { data: events, error } = await supabase
    .from('events')
    .select(`
      id,
      name,
      event_type,
      date,
      created_at,
      tables (count),
      guests (count)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching events:', error);
  }

  return <EventListClient initialEvents={events || []} />;
}
