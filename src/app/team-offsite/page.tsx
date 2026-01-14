import { Metadata } from 'next';
import { TeamOffsitePage } from '@/components/landing-pages';

export const metadata: Metadata = {
  title: 'Team Offsite Seating Planner - Free Meeting & Retreat Seating',
  description: 'Free team offsite seating planner. Create strategic seating arrangements for team meetings, retreats, and workshops. Mix departments and optimize collaboration.',
  keywords: ['team offsite seating', 'retreat seating chart', 'workshop seating', 'team building seating', 'meeting planner'],
};

export default function TeamOffsiteRoute() {
  return <TeamOffsitePage />;
}
