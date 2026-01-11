'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface Event {
  id: string;
  name: string;
  event_type: string;
  date: string | null;
  created_at: string;
  tables: { count: number }[];
  guests: { count: number }[];
}

interface EventListClientProps {
  initialEvents: Event[];
}

export function EventListClient({ initialEvents }: EventListClientProps) {
  const [events, setEvents] = useState(initialEvents);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newEventName, setNewEventName] = useState('');
  const [newEventType, setNewEventType] = useState('wedding');
  const [creating, setCreating] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) return;

    setCreating(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCreating(false);
      return;
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        name: newEventName.trim(),
        event_type: newEventType,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating event:', error);
      setCreating(false);
      return;
    }

    // Navigate to the new event
    router.push(`/dashboard/events/${data.id}/canvas`);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No date set';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="events-page">
      <div className="events-header">
        <h1>My Events</h1>
        <button
          className="create-event-button"
          onClick={() => setShowCreateModal(true)}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3V13M3 8H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New Event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="empty-state">
          <h3>No events yet</h3>
          <p>Create your first event to start planning your seating arrangement.</p>
          <button
            className="create-event-button"
            onClick={() => setShowCreateModal(true)}
          >
            Create Your First Event
          </button>
        </div>
      ) : (
        <div className="events-grid">
          {events.map((event) => (
            <Link
              key={event.id}
              href={`/dashboard/events/${event.id}/canvas`}
              className="event-card"
            >
              <span className="event-type">{event.event_type}</span>
              <h3>{event.name}</h3>
              <p className="event-date">{formatDate(event.date)}</p>
              <div className="event-stats">
                <span>{event.tables?.[0]?.count || 0} tables</span>
                <span>{event.guests?.[0]?.count || 0} guests</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Event Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Create New Event</h2>
            <form onSubmit={handleCreateEvent}>
              <div className="form-group">
                <label htmlFor="eventName">Event Name</label>
                <input
                  id="eventName"
                  type="text"
                  placeholder="e.g., Smith-Johnson Wedding"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="eventType">Event Type</label>
                <select
                  id="eventType"
                  value={newEventType}
                  onChange={(e) => setNewEventType(e.target.value)}
                >
                  <option value="wedding">Wedding</option>
                  <option value="corporate">Corporate Event</option>
                  <option value="gala">Gala</option>
                  <option value="party">Party</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creating || !newEventName.trim()}
                >
                  {creating ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
