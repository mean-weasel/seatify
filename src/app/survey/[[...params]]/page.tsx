import { Metadata } from 'next';
import { GuestSurveyPageClient } from './GuestSurveyPageClient';

interface SurveyPageProps {
  params: Promise<{ params?: string[] }>;
}

export const metadata: Metadata = {
  title: 'Guest Survey - Seatify',
  description: 'Help us create the perfect seating arrangement by completing this survey.',
};

export default async function SurveyPage({ params }: SurveyPageProps) {
  const { params: urlParams } = await params;
  // Join the array back into a string if it exists (catch-all gives array)
  const encodedData = urlParams?.join('/') || '';
  return <GuestSurveyPageClient encodedData={encodedData} />;
}
