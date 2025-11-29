import { useState } from 'react';
import { useStore } from '../store/useStore';
import type { RelationshipType } from '../types';
import './RelationshipMatrix.css';

const RELATIONSHIP_TYPES: {
  value: RelationshipType | null;
  label: string;
  short: string;
  color: string;
}[] = [
  { value: null, label: 'None', short: '-', color: 'transparent' },
  { value: 'partner', label: 'Partner', short: 'P', color: '#e91e63' },
  { value: 'family', label: 'Family', short: 'F', color: '#9c27b0' },
  { value: 'friend', label: 'Friend', short: '+', color: '#2196f3' },
  { value: 'colleague', label: 'Colleague', short: 'C', color: '#4caf50' },
  { value: 'avoid', label: 'Avoid', short: 'X', color: '#f44336' },
];

const getStrengthForType = (type: RelationshipType): number => {
  switch (type) {
    case 'partner':
      return 5;
    case 'family':
      return 4;
    case 'friend':
      return 3;
    case 'colleague':
      return 2;
    case 'avoid':
      return 5;
    default:
      return 3;
  }
};

export function RelationshipMatrix() {
  const { event, addRelationship, removeRelationship } = useStore();
  const [selectedCell, setSelectedCell] = useState<{ from: string; to: string } | null>(null);
  const [bidirectional, setBidirectional] = useState(true);

  const confirmedGuests = event.guests.filter((g) => g.rsvpStatus !== 'declined');

  const getRelationship = (fromId: string, toId: string) => {
    const guest = event.guests.find((g) => g.id === fromId);
    return guest?.relationships?.find((r) => r.guestId === toId);
  };

  const setRelationship = (fromId: string, toId: string, type: RelationshipType | null) => {
    if (type === null) {
      removeRelationship(fromId, toId);
      if (bidirectional) {
        removeRelationship(toId, fromId);
      }
    } else {
      const strength = getStrengthForType(type);
      addRelationship(fromId, toId, type, strength);
      if (bidirectional) {
        addRelationship(toId, fromId, type, strength);
      }
    }
    setSelectedCell(null);
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const handleCellClick = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setSelectedCell({ from: fromId, to: toId });
  };

  return (
    <div className="relationship-matrix">
      <div className="matrix-controls">
        <label className="bidirectional-toggle">
          <input
            type="checkbox"
            checked={bidirectional}
            onChange={(e) => setBidirectional(e.target.checked)}
          />
          <span>Bidirectional (changes apply both ways)</span>
        </label>
        <div className="legend">
          {RELATIONSHIP_TYPES.filter((t) => t.value).map((type) => (
            <span key={type.value} className="legend-item">
              <span
                className="legend-color"
                style={{ backgroundColor: type.color }}
              >
                {type.short}
              </span>
              {type.label}
            </span>
          ))}
        </div>
      </div>

      <div className="matrix-scroll">
        <div className="matrix-grid">
          {/* Header row */}
          <div className="matrix-header">
            <div className="matrix-corner"></div>
            {confirmedGuests.map((guest) => (
              <div
                key={guest.id}
                className="matrix-col-header"
                title={guest.name}
              >
                {getInitials(guest.name)}
              </div>
            ))}
          </div>

          {/* Data rows */}
          {confirmedGuests.map((rowGuest) => (
            <div key={rowGuest.id} className="matrix-row">
              <div className="matrix-row-header" title={rowGuest.name}>
                {rowGuest.name}
              </div>
              {confirmedGuests.map((colGuest) => {
                const rel = getRelationship(rowGuest.id, colGuest.id);
                const typeInfo = RELATIONSHIP_TYPES.find((t) => t.value === rel?.type);
                const isDisabled = rowGuest.id === colGuest.id;
                const isSelected =
                  selectedCell?.from === rowGuest.id && selectedCell?.to === colGuest.id;

                return (
                  <div
                    key={`${rowGuest.id}-${colGuest.id}`}
                    className={`matrix-cell ${isDisabled ? 'disabled' : ''} ${isSelected ? 'selected' : ''}`}
                    style={{
                      backgroundColor: typeInfo?.color || 'transparent',
                    }}
                    onClick={() => handleCellClick(rowGuest.id, colGuest.id)}
                    title={isDisabled ? '' : `${rowGuest.name} → ${colGuest.name}`}
                  >
                    {isDisabled ? '—' : typeInfo?.short || ''}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Dropdown for selected cell */}
      {selectedCell && (
        <div className="cell-dropdown-overlay" onClick={() => setSelectedCell(null)}>
          <div className="cell-dropdown" onClick={(e) => e.stopPropagation()}>
            <h4>
              {event.guests.find((g) => g.id === selectedCell.from)?.name}
              {bidirectional ? ' ↔ ' : ' → '}
              {event.guests.find((g) => g.id === selectedCell.to)?.name}
            </h4>
            <div className="dropdown-options">
              {RELATIONSHIP_TYPES.map((type) => (
                <button
                  key={type.value || 'none'}
                  className="dropdown-option"
                  style={{ borderLeftColor: type.color }}
                  onClick={() => setRelationship(selectedCell.from, selectedCell.to, type.value)}
                >
                  <span
                    className="option-indicator"
                    style={{ backgroundColor: type.color }}
                  >
                    {type.short}
                  </span>
                  {type.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {confirmedGuests.length === 0 && (
        <div className="matrix-empty">
          <p>No confirmed guests yet.</p>
          <p>Add guests to start managing relationships.</p>
        </div>
      )}
    </div>
  );
}
