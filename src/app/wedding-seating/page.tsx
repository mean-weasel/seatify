import { Metadata } from 'next';
import { WeddingSeatingPage } from '@/components/landing-pages';

export const metadata: Metadata = {
  title: 'Wedding Seating Chart Maker - Free Reception Seating Planner',
  description: 'Free wedding seating chart maker. Create beautiful seating arrangements for your reception. Keep couples together, manage family dynamics, and export to PDF. No signup required.',
  keywords: ['wedding seating chart', 'reception seating', 'wedding planner', 'seating arrangement', 'free wedding tool'],
};

export default function WeddingSeatingRoute() {
  return <WeddingSeatingPage />;
}
