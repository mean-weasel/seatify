import { Metadata } from 'next';
import { TermsOfService } from '@/components/TermsOfService';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'Terms of Service for Seatify - Understand the terms and conditions for using our seating chart application.',
};

export default function TermsPage() {
  return <TermsOfService />;
}
