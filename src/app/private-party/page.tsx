import { Metadata } from 'next';
import { PrivatePartyPage } from '@/components/landing-pages';

export const metadata: Metadata = {
  title: 'Party Seating Chart Maker - Free Birthday & Event Seating',
  description: 'Free party seating chart maker. Create fun seating arrangements for birthdays, anniversaries, and celebrations. Keep friends together and manage guest dynamics.',
  keywords: ['party seating chart', 'birthday seating', 'celebration seating', 'event planner', 'dinner party seating'],
};

export default function PrivatePartyRoute() {
  return <PrivatePartyPage />;
}
