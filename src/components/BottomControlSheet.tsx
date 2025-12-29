import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useMobileMenu } from '../contexts/MobileMenuContext';

interface BottomControlSheetProps {
  isVisible: boolean;
  onClose: () => void;
  showRelationships: boolean;
  onToggleRelationships: () => void;
  onShowImport: () => void;
}

/**
 * Bottom control sheet that slides up from bottom.
 * Contains all canvas tools and settings organized in sections.
 */
export function BottomControlSheet({
  isVisible,
  onClose,
  showRelationships,
  onToggleRelationships,
  onShowImport,
}: BottomControlSheetProps) {
  const navigate = useNavigate();
  const {
    event,
    canvas,
    canvasPrefs,
    setZoom,
    recenterCanvas,
    toggleGrid,
    toggleSnapToGrid,
    toggleAlignmentGuides,
    theme,
    cycleTheme,
    activeView,
    setActiveView,
  } = useStore();

  const { onShowHelp, onStartTour } = useMobileMenu();

  if (!isVisible) return null;

  const handleViewChange = (view: 'canvas' | 'guests' | 'dashboard') => {
    setActiveView(view);
    navigate(`/events/${event.id}/${view}`);
    onClose();
  };

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      default: return '⚙️';
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      default: return 'System';
    }
  };

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="bottom-control-sheet">
        <div className="sheet-handle" />

        {/* Zoom Controls */}
        <div className="sheet-section">
          <h4>Zoom</h4>
          <div className="sheet-zoom-controls">
            <button
              className="zoom-btn"
              onClick={() => setZoom(Math.max(0.25, canvas.zoom - 0.25))}
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="zoom-value">{Math.round(canvas.zoom * 100)}%</span>
            <button
              className="zoom-btn"
              onClick={() => setZoom(Math.min(2, canvas.zoom + 0.25))}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              className="zoom-btn reset"
              onClick={() => recenterCanvas(window.innerWidth, window.innerHeight)}
              aria-label="Reset view"
            >
              ⌖
            </button>
          </div>
        </div>

        {/* Views */}
        <div className="sheet-section">
          <h4>Views</h4>
          <div className="sheet-buttons">
            <button
              className={`sheet-btn ${activeView === 'canvas' ? 'active' : ''}`}
              onClick={() => handleViewChange('canvas')}
            >
              <span className="icon">🎨</span>
              Canvas
            </button>
            <button
              className={`sheet-btn ${activeView === 'guests' ? 'active' : ''}`}
              onClick={() => handleViewChange('guests')}
            >
              <span className="icon">👥</span>
              Guests
            </button>
            <button
              className={`sheet-btn ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => handleViewChange('dashboard')}
            >
              <span className="icon">📊</span>
              Stats
            </button>
            <button
              className="sheet-btn"
              onClick={() => {
                onShowImport();
                onClose();
              }}
            >
              <span className="icon">📥</span>
              Import
            </button>
          </div>
        </div>

        {/* Canvas Tools */}
        <div className="sheet-section">
          <h4>Canvas Tools</h4>
          <div className="sheet-buttons">
            <button
              className={`sheet-btn ${canvasPrefs.showGrid ? 'active' : ''}`}
              onClick={toggleGrid}
            >
              <span className="icon">🔲</span>
              Grid
            </button>
            <button
              className={`sheet-btn ${canvasPrefs.snapToGrid ? 'active' : ''}`}
              onClick={toggleSnapToGrid}
            >
              <span className="icon">🧲</span>
              Snap
            </button>
            <button
              className={`sheet-btn ${canvasPrefs.showAlignmentGuides ? 'active' : ''}`}
              onClick={toggleAlignmentGuides}
            >
              <span className="icon">📐</span>
              Guides
            </button>
            <button
              className={`sheet-btn ${showRelationships ? 'active' : ''}`}
              onClick={() => {
                onToggleRelationships();
                onClose();
              }}
            >
              <span className="icon">🔗</span>
              Relations
            </button>
          </div>
        </div>

        {/* Settings */}
        <div className="sheet-section">
          <h4>Settings</h4>
          <div className="sheet-buttons">
            <button
              className="sheet-btn"
              onClick={cycleTheme}
            >
              <span className="icon">{getThemeIcon()}</span>
              {getThemeLabel()}
            </button>
            {onShowHelp && (
              <button
                className="sheet-btn"
                onClick={() => {
                  onShowHelp();
                  onClose();
                }}
              >
                <span className="icon">⌨️</span>
                Shortcuts
              </button>
            )}
            {onStartTour && (
              <button
                className="sheet-btn"
                onClick={() => {
                  onStartTour('quick-start');
                  onClose();
                }}
              >
                <span className="icon">🎓</span>
                Tour
              </button>
            )}
            <button
              className="sheet-btn"
              onClick={() => {
                navigate('/events');
                onClose();
              }}
            >
              <span className="icon">📋</span>
              Events
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
