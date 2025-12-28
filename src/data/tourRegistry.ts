import type { OnboardingStep } from './onboardingSteps';
import {
  QUICK_START_STEPS,
  CANVAS_TOUR_STEPS,
  RELATIONSHIPS_TOUR_STEPS,
  OPTIMIZATION_TOUR_STEPS,
  EXPORT_SHARE_TOUR_STEPS,
  QR_TOUR_STEPS,
} from './onboardingSteps';

export type TourId =
  | 'quick-start'
  | 'canvas-floor-plan'
  | 'relationships'
  | 'optimization'
  | 'export-share'
  | 'qr-codes';

export interface TourDefinition {
  id: TourId;
  title: string;
  description: string;
  icon: string;
  estimatedTime: string;
  startingView: 'event-list' | 'dashboard' | 'canvas' | 'guests';
  requiresDemoData: boolean;
  steps: OnboardingStep[];
  category: 'getting-started' | 'features';
}

export const TOUR_REGISTRY: Record<TourId, TourDefinition> = {
  'quick-start': {
    id: 'quick-start',
    title: 'Quick Start',
    description: 'Learn the basics of creating seating arrangements',
    icon: '🚀',
    estimatedTime: '2 min',
    startingView: 'canvas',
    requiresDemoData: true,
    steps: QUICK_START_STEPS,
    category: 'getting-started',
  },
  'canvas-floor-plan': {
    id: 'canvas-floor-plan',
    title: 'Canvas & Floor Plans',
    description: 'Master the grid, tables, and venue elements',
    icon: '📐',
    estimatedTime: '2 min',
    startingView: 'canvas',
    requiresDemoData: false,
    steps: CANVAS_TOUR_STEPS,
    category: 'features',
  },
  'relationships': {
    id: 'relationships',
    title: 'Guest Relationships',
    description: 'Set up partners, families, and seating conflicts',
    icon: '👥',
    estimatedTime: '2 min',
    startingView: 'guests',
    requiresDemoData: true,
    steps: RELATIONSHIPS_TOUR_STEPS,
    category: 'features',
  },
  'optimization': {
    id: 'optimization',
    title: 'Smart Optimization',
    description: 'Let AI arrange your seating automatically',
    icon: '✨',
    estimatedTime: '1 min',
    startingView: 'canvas',
    requiresDemoData: true,
    steps: OPTIMIZATION_TOUR_STEPS,
    category: 'features',
  },
  'export-share': {
    id: 'export-share',
    title: 'Export & Share',
    description: 'Create PDFs, share links, and export data',
    icon: '📤',
    estimatedTime: '2 min',
    startingView: 'dashboard',
    requiresDemoData: false,
    steps: EXPORT_SHARE_TOUR_STEPS,
    category: 'features',
  },
  'qr-codes': {
    id: 'qr-codes',
    title: 'QR Codes',
    description: 'Generate scannable table cards for guests',
    icon: '📱',
    estimatedTime: '1 min',
    startingView: 'dashboard',
    requiresDemoData: false,
    steps: QR_TOUR_STEPS,
    category: 'features',
  },
};

// Helper to get tours by category
export function getToursByCategory(category: 'getting-started' | 'features'): TourDefinition[] {
  return Object.values(TOUR_REGISTRY).filter(tour => tour.category === category);
}

// Get all tour IDs
export function getAllTourIds(): TourId[] {
  return Object.keys(TOUR_REGISTRY) as TourId[];
}
