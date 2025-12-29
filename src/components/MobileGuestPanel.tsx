import { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useStore } from '../store/useStore';
import { getFullName, getInitials } from '../types';
import type { Guest } from '../types';
import './MobileGuestPanel.css';

const EDGE_ZONE = 30; // pixels from right edge to trigger
const OPEN_THRESHOLD = 80; // horizontal swipe distance to open
const CLOSE_THRESHOLD = 60; // swipe distance to close

interface MobileGuestPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export function MobileGuestPanel({ isOpen, onOpen, onClose }: MobileGuestPanelProps) {
  const { event, selectGuest, setEditingGuest, canvas, panToPosition } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unassigned' | 'assigned'>('all');
  const panelRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; inEdgeZone: boolean } | null>(null);

  // Filter guests based on search and filter
  const filteredGuests = event.guests.filter(guest => {
    const fullName = getFullName(guest).toLowerCase();
    const matchesSearch = fullName.includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filter === 'unassigned') return !guest.tableId;
    if (filter === 'assigned') return !!guest.tableId;
    return true;
  });

  // Group guests by assignment status
  const unassignedGuests = filteredGuests.filter(g => !g.tableId);
  const assignedGuests = filteredGuests.filter(g => g.tableId);

  // Handle edge swipe detection
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      const windowWidth = window.innerWidth;
      const inEdgeZone = touch.clientX >= windowWidth - EDGE_ZONE;

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        inEdgeZone,
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.touches[0];
      const deltaX = touchStartRef.current.x - touch.clientX;
      const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

      // Only trigger if horizontal swipe and started in edge zone
      if (touchStartRef.current.inEdgeZone && deltaX > OPEN_THRESHOLD && deltaY < 50) {
        onOpen();
        touchStartRef.current = null;
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
    };

    // Only listen for edge swipes when panel is closed
    if (!isOpen) {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, onOpen]);

  // Handle panel close swipe
  const handlePanelTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      inEdgeZone: false,
    };
  }, []);

  const handlePanelTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;

    // Swipe right to close
    if (deltaX > CLOSE_THRESHOLD) {
      onClose();
      touchStartRef.current = null;
    }
  }, [onClose]);

  // Find table name for assigned guest
  const getTableName = (guest: Guest) => {
    if (!guest.tableId) return null;
    const table = event.tables.find(t => t.id === guest.tableId);
    return table?.name || 'Table';
  };

  // Handle guest tap - navigate to them on canvas
  const handleGuestTap = (guest: Guest) => {
    selectGuest(guest.id);

    // If guest is on a table, pan to the table
    if (guest.tableId) {
      const table = event.tables.find(t => t.id === guest.tableId);
      if (table) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        panToPosition(table.x, table.y, viewportWidth, viewportHeight);
      }
    } else if (guest.canvasX !== undefined && guest.canvasY !== undefined) {
      // Pan to unassigned guest on canvas
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      panToPosition(guest.canvasX, guest.canvasY, viewportWidth, viewportHeight);
    }

    onClose();
  };

  // Handle guest edit
  const handleGuestEdit = (guest: Guest, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGuest(guest.id);
    onClose();
  };

  const panelContent = (
    <>
      {/* Backdrop */}
      <div
        className={`mobile-guest-panel-backdrop ${isOpen ? 'visible' : ''}`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        className={`mobile-guest-panel ${isOpen ? 'open' : ''}`}
        onTouchStart={handlePanelTouchStart}
        onTouchMove={handlePanelTouchMove}
      >
        {/* Swipe handle */}
        <div className="panel-handle">
          <div className="handle-bar" />
        </div>

        {/* Header */}
        <div className="panel-header">
          <h2>Guests</h2>
          <span className="guest-count-badge">{event.guests.length}</span>
          <button className="panel-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" width="24" height="24">
              <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="panel-search">
          <svg viewBox="0 0 24 24" width="18" height="18" className="search-icon">
            <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
          </svg>
          <input
            type="text"
            placeholder="Search guests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear" onClick={() => setSearchQuery('')}>
              ×
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="panel-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All ({event.guests.length})
          </button>
          <button
            className={`filter-btn ${filter === 'unassigned' ? 'active' : ''}`}
            onClick={() => setFilter('unassigned')}
          >
            Unassigned ({event.guests.filter(g => !g.tableId).length})
          </button>
          <button
            className={`filter-btn ${filter === 'assigned' ? 'active' : ''}`}
            onClick={() => setFilter('assigned')}
          >
            Seated ({event.guests.filter(g => g.tableId).length})
          </button>
        </div>

        {/* Guest list */}
        <div className="panel-guest-list">
          {filteredGuests.length === 0 ? (
            <div className="panel-empty">
              {searchQuery ? `No guests match "${searchQuery}"` : 'No guests yet'}
            </div>
          ) : (
            <>
              {/* Unassigned section */}
              {filter !== 'assigned' && unassignedGuests.length > 0 && (
                <div className="guest-section">
                  {filter === 'all' && <div className="section-label">Unassigned</div>}
                  {unassignedGuests.map(guest => (
                    <div
                      key={guest.id}
                      className={`panel-guest-item ${canvas.selectedGuestIds.includes(guest.id) ? 'selected' : ''}`}
                      onClick={() => handleGuestTap(guest)}
                    >
                      <div
                        className="guest-avatar"
                        style={{
                          backgroundColor: guest.group ? `var(--group-${guest.group})` : 'var(--color-text-secondary)'
                        }}
                      >
                        {getInitials(guest)}
                      </div>
                      <div className="guest-info">
                        <span className="guest-name">{getFullName(guest)}</span>
                        {guest.group && <span className="guest-group">{guest.group}</span>}
                      </div>
                      <button
                        className="guest-edit-btn"
                        onClick={(e) => handleGuestEdit(guest, e)}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16">
                          <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Assigned section */}
              {filter !== 'unassigned' && assignedGuests.length > 0 && (
                <div className="guest-section">
                  {filter === 'all' && <div className="section-label">Seated</div>}
                  {assignedGuests.map(guest => (
                    <div
                      key={guest.id}
                      className={`panel-guest-item ${canvas.selectedGuestIds.includes(guest.id) ? 'selected' : ''}`}
                      onClick={() => handleGuestTap(guest)}
                    >
                      <div
                        className="guest-avatar"
                        style={{
                          backgroundColor: guest.group ? `var(--group-${guest.group})` : 'var(--color-text-secondary)'
                        }}
                      >
                        {getInitials(guest)}
                      </div>
                      <div className="guest-info">
                        <span className="guest-name">{getFullName(guest)}</span>
                        <span className="guest-table">{getTableName(guest)}</span>
                      </div>
                      <button
                        className="guest-edit-btn"
                        onClick={(e) => handleGuestEdit(guest, e)}
                      >
                        <svg viewBox="0 0 24 24" width="16" height="16">
                          <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );

  return createPortal(panelContent, document.body);
}
