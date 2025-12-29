import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';

interface TransientTopBarProps {
  isVisible: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
}

/**
 * Transient navigation bar that slides down from top.
 * Contains: Back button, event name (editable), settings button.
 */
export function TransientTopBar({
  isVisible,
  onClose,
  onOpenSettings,
}: TransientTopBarProps) {
  const navigate = useNavigate();
  const { event, setEventName } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBack = () => {
    onClose();
    navigate('/events');
  };

  const handleNameClick = () => {
    setIsEditing(true);
  };

  const handleNameBlur = () => {
    setIsEditing(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  return (
    <div className={`transient-top-bar ${isVisible ? 'visible' : ''}`}>
      <button
        className="back-btn"
        onClick={handleBack}
        aria-label="Back to events"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/>
        </svg>
      </button>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={event.name}
          onChange={(e) => setEventName(e.target.value)}
          onBlur={handleNameBlur}
          onKeyDown={handleNameKeyDown}
          className="event-name-input"
        />
      ) : (
        <button
          className="event-name"
          onClick={handleNameClick}
          aria-label="Edit event name"
        >
          {event.name || 'Untitled Event'}
        </button>
      )}

      <button
        className="menu-btn"
        onClick={onOpenSettings}
        aria-label="Open settings"
      >
        <svg viewBox="0 0 24 24" width="20" height="20">
          <path fill="currentColor" d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
        </svg>
      </button>
    </div>
  );
}
