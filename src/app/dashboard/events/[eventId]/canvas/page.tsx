import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { CanvasPageClient } from './CanvasPageClient';

interface CanvasPageProps {
  params: Promise<{ eventId: string }>;
}

export async function generateMetadata({ params }: CanvasPageProps) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from('events')
    .select('name')
    .eq('id', eventId)
    .single();

  return {
    title: event?.name ? `${event.name} - Canvas` : 'Seating Canvas',
  };
}

export default async function CanvasPage({ params }: CanvasPageProps) {
  const { eventId } = await params;
  const supabase = await createClient();

  // Fetch full event data
  const { data: event, error } = await supabase
    .from('events')
    .select(`
      *,
      tables (*),
      guests (*),
      constraints (*),
      venue_elements (*)
    `)
    .eq('id', eventId)
    .single();

  if (error || !event) {
    redirect('/dashboard');
  }

  // Also fetch relationships separately (can't be nested in guests query)
  const { data: relationships } = await supabase
    .from('guest_relationships')
    .select('*')
    .eq('event_id', eventId);

  return (
    <CanvasPageClient
      event={event}
      relationships={relationships || []}
    />
  );
}
