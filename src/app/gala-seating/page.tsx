import { Metadata } from 'next';
import { GalaSeatingPage } from '@/components/landing-pages';

export const metadata: Metadata = {
  title: 'Gala & Fundraiser Seating Chart - Free Event Seating Planner',
  description: 'Free gala and fundraiser seating chart maker. Create elegant seating arrangements for charity events, galas, and formal dinners. VIP placement and sponsor tables made easy.',
  keywords: ['gala seating chart', 'fundraiser seating', 'charity event planner', 'formal dinner seating', 'VIP seating'],
};

export default function GalaSeatingRoute() {
  return <GalaSeatingPage />;
}
