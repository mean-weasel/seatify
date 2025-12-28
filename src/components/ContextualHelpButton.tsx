import { useStore } from '../store/useStore';
import { TOUR_REGISTRY, type TourId } from '../data/tourRegistry';
import './ContextualHelpButton.css';

interface ContextualHelpButtonProps {
  tourId: TourId;
  className?: string;
  size?: 'small' | 'medium';
  label?: string;
}

/**
 * A small contextual help button that triggers a specific feature tour.
 * Place near relevant features to provide on-demand learning.
 */
export function ContextualHelpButton({
  tourId,
  className = '',
  size = 'small',
  label,
}: ContextualHelpButtonProps) {
  const { setActiveTour, isTourComplete, setActiveView } = useStore();

  const tour = TOUR_REGISTRY[tourId];
  if (!tour) return null;

  const isCompleted = isTourComplete(tourId);

  const handleClick = () => {
    // Navigate to the tour's starting view if needed
    if (tour.startingView && tour.startingView !== 'event-list') {
      setActiveView(tour.startingView);
    }
    setActiveTour(tourId);

    // Dispatch a custom event that EventLayout can listen for
    window.dispatchEvent(new CustomEvent('startTour', { detail: { tourId } }));
  };

  return (
    <button
      className={`contextual-help-btn contextual-help-btn--${size} ${isCompleted ? 'completed' : ''} ${className}`}
      onClick={handleClick}
      title={label || `Learn: ${tour.title}`}
      aria-label={label || `Learn about ${tour.title}`}
    >
      <span className="contextual-help-icon">?</span>
      {label && <span className="contextual-help-label">{label}</span>}
    </button>
  );
}
