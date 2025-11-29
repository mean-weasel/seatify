import { useState } from 'react';
import './DashboardMockup.css';

// Mock data for the dashboard
const mockStats = {
  totalGuests: 48,
  totalTables: 6,
  confirmedGuests: 38,
  pendingGuests: 8,
  declinedGuests: 2,
  assignedGuests: 32,
};

const mockActivities = [
  { id: '1', type: 'guest_added', message: 'Guest "Sarah Johnson" was added', time: '2 min ago' },
  { id: '2', type: 'table_added', message: 'Table 6 was created', time: '15 min ago' },
  { id: '3', type: 'optimization', message: 'Optimization completed (Score: 87/100)', time: '1 hour ago' },
  { id: '4', type: 'import', message: '12 guests imported from CSV', time: '2 hours ago' },
  { id: '5', type: 'guest_assigned', message: 'Mike Wilson assigned to Table 3', time: '3 hours ago' },
];

export function DashboardMockup() {
  const [eventName] = useState("Sarah & John's Wedding");
  const [eventDate] = useState('December 15, 2024');
  const [eventType] = useState('Wedding');

  const seatingPercentage = Math.round((mockStats.assignedGuests / mockStats.totalGuests) * 100);
  const unassignedGuests = mockStats.totalGuests - mockStats.assignedGuests;

  return (
    <div className="dashboard-mockup">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <span className="mockup-badge">MOCKUP</span>
      </div>

      <div className="dashboard-grid">
        {/* Event Summary Card */}
        <div className="dashboard-card event-summary">
          <h3>Event Details</h3>
          <div className="event-info">
            <div className="event-name">{eventName}</div>
            <div className="event-meta">
              <span className="event-date">{eventDate}</span>
              <span className="event-type-badge">{eventType}</span>
            </div>
          </div>
          <button className="edit-event-btn">Edit Event Settings</button>
        </div>

        {/* Stats Overview */}
        <div className="dashboard-card stats-overview">
          <h3>Overview</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value">{mockStats.totalGuests}</span>
              <span className="stat-label">Total Guests</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{mockStats.totalTables}</span>
              <span className="stat-label">Tables</span>
            </div>
            <div className="stat-item confirmed">
              <span className="stat-value">{mockStats.confirmedGuests}</span>
              <span className="stat-label">Confirmed</span>
            </div>
            <div className="stat-item warning">
              <span className="stat-value">{mockStats.pendingGuests}</span>
              <span className="stat-label">Pending</span>
            </div>
            <div className="stat-item error">
              <span className="stat-value">{mockStats.declinedGuests}</span>
              <span className="stat-label">Declined</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{unassignedGuests}</span>
              <span className="stat-label">Unassigned</span>
            </div>
          </div>
        </div>

        {/* Progress Ring */}
        <div className="dashboard-card progress-card">
          <h3>Seating Progress</h3>
          <div className="progress-ring-container">
            <svg className="progress-ring" viewBox="0 0 120 120">
              <circle
                className="progress-ring-bg"
                cx="60"
                cy="60"
                r="52"
                fill="none"
                strokeWidth="12"
              />
              <circle
                className="progress-ring-fill"
                cx="60"
                cy="60"
                r="52"
                fill="none"
                strokeWidth="12"
                strokeDasharray={`${(seatingPercentage / 100) * 327} 327`}
                strokeLinecap="round"
              />
            </svg>
            <div className="progress-text">
              <span className="progress-percentage">{seatingPercentage}%</span>
              <span className="progress-label">Complete</span>
            </div>
          </div>
          <div className="progress-detail">
            {mockStats.assignedGuests} / {mockStats.totalGuests} guests seated
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-card quick-actions">
          <h3>Quick Actions</h3>
          <div className="actions-grid">
            <button className="action-btn primary">
              <span className="action-icon">+</span>
              <span>Add Table</span>
            </button>
            <button className="action-btn primary">
              <span className="action-icon">+</span>
              <span>Add Guest</span>
            </button>
            <button className="action-btn secondary">
              <span className="action-icon">*</span>
              <span>Run Optimization</span>
            </button>
            <button className="action-btn outline">
              <span className="action-icon">^</span>
              <span>Export Event</span>
            </button>
          </div>
        </div>

        {/* Activity Feed */}
        <div className="dashboard-card activity-feed full-width">
          <h3>Recent Activity</h3>
          <div className="activity-list">
            {mockActivities.map((activity, index) => (
              <div
                key={activity.id}
                className={`activity-item ${activity.type}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="activity-indicator" />
                <div className="activity-content">
                  <span className="activity-message">{activity.message}</span>
                  <span className="activity-time">{activity.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardMockup;
