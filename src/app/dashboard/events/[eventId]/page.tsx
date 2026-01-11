import { redirect } from 'next/navigation';

interface EventPageProps {
  params: Promise<{ eventId: string }>;
}

export default async function EventPage({ params }: EventPageProps) {
  const { eventId } = await params;
  // Redirect to canvas view by default
  redirect(`/dashboard/events/${eventId}/canvas`);
}
