import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

interface EventLayoutProps {
  children: React.ReactNode;
  params: Promise<{ eventId: string }>;
}

export default async function EventLayout({
  children,
  params,
}: EventLayoutProps) {
  const { eventId } = await params;
  const supabase = await createClient();

  // Verify the event exists and belongs to the user
  const { data: event, error } = await supabase
    .from('events')
    .select('id, name')
    .eq('id', eventId)
    .single();

  if (error || !event) {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
