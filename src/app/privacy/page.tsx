import { Metadata } from 'next';
import { PrivacyPolicy } from '@/components/PrivacyPolicy';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for Seatify - Learn how we protect your data and respect your privacy.',
};

export default function PrivacyPage() {
  return <PrivacyPolicy />;
}
