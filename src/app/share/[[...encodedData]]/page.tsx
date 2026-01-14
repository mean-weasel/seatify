import { Metadata } from 'next';
import { ShareableViewPageClient } from './ShareableViewPageClient';

interface ShareableViewPageProps {
  params: Promise<{ encodedData?: string[] }>;
}

export const metadata: Metadata = {
  title: 'Shared Seating Chart - Seatify',
  description: 'View a shared seating chart. Import and view seating arrangements for your event.',
};

export default async function ShareableViewPage({ params }: ShareableViewPageProps) {
  const { encodedData } = await params;
  // Join the array back into a string if it exists (catch-all gives array)
  const encodedString = encodedData?.join('/') || '';
  return <ShareableViewPageClient encodedData={encodedString} />;
}
