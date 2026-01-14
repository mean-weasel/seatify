import { Metadata } from 'next';
import { QRTableInfoPageClient } from './QRTableInfoPageClient';

interface TableInfoPageProps {
  params: Promise<{ encodedData: string }>;
}

export const metadata: Metadata = {
  title: 'Table Information - Seatify',
  description: 'View your table assignment and seating details.',
};

export default async function TableInfoPage({ params }: TableInfoPageProps) {
  const { encodedData } = await params;
  return <QRTableInfoPageClient encodedData={encodedData} />;
}
