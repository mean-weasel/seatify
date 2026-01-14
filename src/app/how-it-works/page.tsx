import { Metadata } from 'next';
import { HowItWorksPage } from '@/components/landing-pages';

export const metadata: Metadata = {
  title: 'How Seatify Works - Easy Seating Chart Creation',
  description: 'Learn how to create perfect seating charts with Seatify. Step-by-step guide to drag-and-drop seating, smart optimization, and PDF export.',
  keywords: ['how to use seatify', 'seating chart tutorial', 'seating optimization', 'event planning guide'],
};

export default function HowItWorksRoute() {
  return <HowItWorksPage />;
}
