'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import './LandingPage.css';
import { EmailCaptureModal } from './EmailCaptureModal';
import { Footer } from './Footer';
import { MobileSettingsHeader } from './MobileSettingsHeader';
import { trackCTAClick, trackAppEntryConversion, trackFunnelStep } from '../utils/analytics';
import { captureUtmParams } from '../utils/utm';
import { shouldShowEmailCapture } from '../utils/emailCaptureManager';
import type { TourId } from '../data/tourRegistry';

const faqItems = [
  {
    question: 'Is my data secure?',
    answer: 'Yes! All your event data is stored securely in the cloud. Your guest lists, seating arrangements, and relationship data are protected with enterprise-grade security.',
  },
  {
    question: 'Do I need to create an account?',
    answer: 'Creating a free account lets you save your work, access it from any device, and share seating charts with others. Sign up takes just 30 seconds!',
  },
  {
    question: 'Can I use this on my phone?',
    answer: 'Absolutely! Seatify is fully responsive and works great on phones, tablets, and desktops. Drag-and-drop works with touch gestures on mobile devices.',
  },
  {
    question: 'How does the seating optimizer work?',
    answer: 'Our optimizer uses a smart algorithm that considers guest relationships. It keeps couples and partners together, respects "keep apart" constraints, and distributes groups evenly across tables to create balanced, harmonious seating.',
  },
  {
    question: 'Is Seatify really free?',
    answer: 'Yes! The core seating chart tools are completely free to use. Create unlimited events and guests with your free account.',
  },
];

export function LandingPageClient() {
  const router = useRouter();
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  // Check if user has already subscribed (don't show button if so)
  const canShowEmailButton = typeof window !== 'undefined' && (
    shouldShowEmailCapture('guestMilestone') ||
    shouldShowEmailCapture('optimizerSuccess') ||
    shouldShowEmailCapture('exportAttempt')
  );

  // Capture UTM parameters and track landing view on page load
  useEffect(() => {
    captureUtmParams();
    trackFunnelStep('landing_view');
  }, []);

  const handleEnterApp = () => {
    trackCTAClick('hero');
    trackAppEntryConversion();
    trackFunnelStep('cta_click');
    trackFunnelStep('app_entry');
    router.push('/dashboard');
  };

  // Handle "See how it works" clicks - navigates to app with pending tour
  const handleFeatureTourClick = (tourId: TourId) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('pendingTour', tourId);
    }
    trackCTAClick(`feature_tour_${tourId}`);
    trackAppEntryConversion();
    trackFunnelStep('cta_click');
    trackFunnelStep('app_entry');
    router.push('/dashboard');
  };

  // Secondary CTA handler
  const handleSecondaryCTA = () => {
    trackCTAClick('secondary');
    trackAppEntryConversion();
    trackFunnelStep('cta_click');
    trackFunnelStep('app_entry');
    router.push('/dashboard');
  };

  // Toggle FAQ item
  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="landing-page">
      {/* Mobile Settings Header - only visible on mobile */}
      <div className="mobile-settings-container">
        <MobileSettingsHeader
          onSubscribe={() => setShowEmailCapture(true)}
          canShowEmailButton={canShowEmailButton}
        />
      </div>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <h1>Smart Seating Arrangements Made Easy</h1>
          <p className="hero-subtitle">
            Create beautiful seating charts for weddings, corporate events, and parties.
            Drag-and-drop interface, smart optimization, and instant exports.
          </p>
          <div className="hero-ctas">
            <button className="cta-primary" onClick={handleEnterApp}>
              Start Planning Free
            </button>
            <Link href="/login" className="cta-secondary">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <h2>Everything You Need</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🪑</div>
            <h3>Drag & Drop</h3>
            <p>Intuitive interface for arranging tables and guests. Works on desktop and mobile.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🧠</div>
            <h3>Smart Optimizer</h3>
            <p>AI-powered seating that keeps couples together and avoids conflicts.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📤</div>
            <h3>Easy Export</h3>
            <p>Download as PDF, print place cards, or share a link with your venue.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Works Everywhere</h3>
            <p>Access your seating charts from any device. Your data syncs automatically.</p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2>Frequently Asked Questions</h2>
        <div className="faq-list">
          {faqItems.map((item, index) => (
            <div key={index} className={`faq-item ${expandedFaq === index ? 'expanded' : ''}`}>
              <button className="faq-question" onClick={() => toggleFaq(index)}>
                {item.question}
                <span className="faq-icon">{expandedFaq === index ? '−' : '+'}</span>
              </button>
              {expandedFaq === index && (
                <div className="faq-answer">{item.answer}</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <h2>Ready to Plan Your Perfect Seating?</h2>
        <button className="cta-primary" onClick={handleEnterApp}>
          Get Started Free
        </button>
      </section>

      <Footer />

      {/* Email Capture Modal */}
      {showEmailCapture && (
        <EmailCaptureModal
          onClose={() => setShowEmailCapture(false)}
          source="landing"
        />
      )}
    </div>
  );
}
