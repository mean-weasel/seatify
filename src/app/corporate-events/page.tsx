import { Metadata } from 'next';
import { CorporateEventsPage } from '@/components/landing-pages';

export const metadata: Metadata = {
  title: 'Corporate Event Seating Planner - Free Business Seating Charts',
  description: 'Free corporate event seating planner. Create professional seating arrangements for conferences, dinners, and meetings. Optimize networking and export to PDF.',
  keywords: ['corporate event seating', 'business dinner seating', 'conference seating chart', 'networking seating', 'corporate planner'],
};

export default function CorporateEventsRoute() {
  return <CorporateEventsPage />;
}
