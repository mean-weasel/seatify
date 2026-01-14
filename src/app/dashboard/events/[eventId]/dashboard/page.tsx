import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { loadEvent } from '@/actions/loadEvent';
import { DashboardPageClient } from './DashboardPageClient';

interface DashboardPageProps {
  params: Promise<{ eventId: string }>;
}

export async function generateMetadata({ params }: DashboardPageProps) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from('events')
    .select('name')
    .eq('id', eventId)
    .single();

  return {
    title: event?.name ? `${event.name} - Dashboard` : 'Event Dashboard',
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { eventId } = await params;

  // Use loadEvent action which properly handles all data including guest profiles
  const result = await loadEvent(eventId);

  if (result.error || !result.data) {
    redirect('/dashboard');
  }

  return <DashboardPageClient event={result.data} />;
}
