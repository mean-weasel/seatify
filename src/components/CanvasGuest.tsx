import { useDraggable } from '@dnd-kit/core';
import type { Guest } from '../types';
import './CanvasGuest.css';

interface CanvasGuestProps {
  guest: Guest;
  isSelected: boolean;
  isNearTable?: boolean;
  onSelect: () => void;
}

export function CanvasGuest({ guest, isSelected, isNearTable, onSelect }: CanvasGuestProps) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: guest.id,
    data: { type: 'canvas-guest', guest },
  });

  const initials = guest.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const getStatusColor = () => {
    switch (guest.rsvpStatus) {
      case 'confirmed':
        return 'var(--color-success)';
      case 'declined':
        return 'var(--color-error)';
      default:
        return 'var(--color-warning)';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`canvas-guest ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isNearTable ? 'near-table' : ''}`}
      style={{
        left: guest.canvasX,
        top: guest.canvasY,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      {...attributes}
      {...listeners}
    >
      <div className="canvas-guest-circle">
        <span className="initials">{initials}</span>
      </div>
      <span className="status-dot" style={{ backgroundColor: getStatusColor() }} />
      <div className="canvas-guest-label">{guest.name}</div>
    </div>
  );
}
