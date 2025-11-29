import { useDraggable } from '@dnd-kit/core';
import type { Guest } from '../types';
import './GuestChip.css';

// Generate consistent color from string (group name)
const GROUP_COLORS = [
  '#7dd3fc', // sky
  '#86efac', // green
  '#fcd34d', // amber
  '#f9a8d4', // pink
  '#a5b4fc', // indigo
  '#fca5a5', // red
  '#fdba74', // orange
  '#c4b5fd', // violet
  '#5eead4', // teal
  '#fde68a', // yellow
  '#f0abfc', // fuchsia
  '#93c5fd', // blue
  '#a3e635', // lime
  '#fb923c', // orange-dark
  '#a78bfa', // purple
  '#f472b6', // pink-dark
  '#22d3ee', // cyan
  '#34d399', // emerald
  '#facc15', // yellow-dark
  '#f87171', // red-light
];

export function getGroupColor(group: string | undefined): string | null {
  if (!group) return null;
  // Simple hash function to get consistent color
  let hash = 0;
  for (let i = 0; i < group.length; i++) {
    hash = group.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GROUP_COLORS[Math.abs(hash) % GROUP_COLORS.length];
}

interface GuestChipProps {
  guest: Guest;
  compact?: boolean;
  isDragging?: boolean;
  onClick?: () => void;
}

export function GuestChip({ guest, compact, isDragging, onClick }: GuestChipProps) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: guest.id,
    data: { type: 'guest', guest },
  });

  const style = transform
    ? {
        transform: `translate(${transform.x}px, ${transform.y}px)`,
      }
    : undefined;

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

  const groupColor = getGroupColor(guest.group);

  if (compact) {
    return (
      <div
        ref={setNodeRef}
        className={`guest-chip compact ${isDragging ? 'dragging' : ''}`}
        style={{
          ...style,
          ...(groupColor ? { borderColor: groupColor } : {}),
        }}
        title={`${guest.name}${guest.company ? ` - ${guest.company}` : ''}${guest.group ? ` (${guest.group})` : ''}`}
        onClick={onClick}
        {...attributes}
        {...listeners}
      >
        <span className="initials">{initials}</span>
        <span
          className="status-dot"
          style={{ backgroundColor: getStatusColor() }}
        />
        {groupColor && <span className="group-indicator" style={{ backgroundColor: groupColor }} />}
      </div>
    );
  }

  return (
    <div
      ref={setNodeRef}
      className={`guest-chip ${isDragging ? 'dragging' : ''} ${guest.tableId ? 'assigned' : ''} ${groupColor ? 'has-group' : ''}`}
      style={{
        ...style,
        ...(groupColor ? { '--group-color': groupColor } as React.CSSProperties : {}),
      }}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <div className="guest-avatar" style={{ backgroundColor: getStatusColor() }}>
        {initials}
      </div>
      <div className="guest-info">
        <span className="guest-name">{guest.name}</span>
        {guest.company && <span className="guest-company">{guest.company}</span>}
        {guest.group && (
          <span className="guest-group" style={{ backgroundColor: groupColor || undefined }}>
            {guest.group}
          </span>
        )}
      </div>
      {guest.tableId && (
        <span className="assigned-badge" title="Assigned to table">✓</span>
      )}
    </div>
  );
}
