import { useNavigate, useParams } from '@/lib/router-compat';
import { useStore } from '../store/useStore';
import './ViewToggle.css';

interface ViewToggleProps {
  showRelationships?: boolean;
  onToggleRelationships?: () => void;
}

export function ViewToggle({ showRelationships, onToggleRelationships }: ViewToggleProps) {
  const navigate = useNavigate();
  const { eventId } = useParams<{ eventId?: string }>();
  const { activeView, currentEventId } = useStore();

  // Use eventId from URL or fall back to store
  const effectiveEventId = eventId || currentEventId;

  const handleViewChange = (view: 'dashboard' | 'canvas' | 'guests') => {
    console.log('[ViewToggle] handleViewChange called:', { view, eventId, currentEventId, effectiveEventId });
    if (effectiveEventId) {
      const targetPath = `/dashboard/events/${effectiveEventId}/${view}`;
      console.log('[ViewToggle] Navigating to:', targetPath);
      navigate(targetPath);
    } else {
      console.log('[ViewToggle] effectiveEventId is falsy, not navigating');
    }
  };

  return (
    <div className="view-toggle-container">
      <div className="view-toggle-switch">
        <button
          className={`toggle-option ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => handleViewChange('dashboard')}
          title="Dashboard"
        >
          <span className="toggle-icon">📊</span>
          <span className="toggle-text">Dashboard</span>
        </button>
        <button
          className={`toggle-option ${activeView === 'canvas' ? 'active' : ''}`}
          onClick={() => handleViewChange('canvas')}
          title="Canvas"
        >
          <span className="toggle-icon">🎨</span>
          <span className="toggle-text">Canvas</span>
        </button>
        <button
          className={`toggle-option ${activeView === 'guests' ? 'active' : ''}`}
          onClick={() => handleViewChange('guests')}
          title="Guest List"
        >
          <span className="toggle-icon">👥</span>
          <span className="toggle-text">Guests</span>
        </button>
      </div>
      {onToggleRelationships && (
        <button
          className={`toggle-option relationships ${showRelationships ? 'active' : ''}`}
          onClick={onToggleRelationships}
        >
          Relationships
        </button>
      )}
    </div>
  );
}
