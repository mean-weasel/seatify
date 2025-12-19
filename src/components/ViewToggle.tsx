import { useStore } from '../store/useStore';
import './ViewToggle.css';

interface ViewToggleProps {
  showRelationships?: boolean;
  onToggleRelationships?: () => void;
}

export function ViewToggle({ showRelationships, onToggleRelationships }: ViewToggleProps) {
  const { activeView, setActiveView } = useStore();

  return (
    <div className="view-toggle-container">
      <div className="view-toggle-switch">
        <button
          className={`toggle-option ${activeView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveView('dashboard')}
          title="Dashboard"
        >
          <span className="toggle-icon">📊</span>
          <span className="toggle-text">Dashboard</span>
        </button>
        <button
          className={`toggle-option ${activeView === 'canvas' ? 'active' : ''}`}
          onClick={() => setActiveView('canvas')}
          title="Canvas"
        >
          <span className="toggle-icon">🗺️</span>
          <span className="toggle-text">Canvas</span>
        </button>
        <button
          className={`toggle-option ${activeView === 'guests' ? 'active' : ''}`}
          onClick={() => setActiveView('guests')}
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
          title="Relationships"
        >
          <span className="toggle-icon">🔗</span>
          <span className="toggle-text">Relationships</span>
        </button>
      )}
    </div>
  );
}
