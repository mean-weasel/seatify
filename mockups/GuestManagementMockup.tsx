import { useState } from 'react';
import './GuestManagementMockup.css';

// Mock guest data
const mockGuests = [
  { id: '1', name: 'Alice Johnson', company: 'Tech Corp', group: "Bride's Family", rsvpStatus: 'confirmed', table: 'Table 1', relationships: 3 },
  { id: '2', name: 'Bob Smith', company: 'Design Co', group: "Groom's Family", rsvpStatus: 'confirmed', table: 'Table 2', relationships: 5 },
  { id: '3', name: 'Carol Williams', company: 'Marketing Inc', group: 'Friends', rsvpStatus: 'pending', table: null, relationships: 2 },
  { id: '4', name: 'David Brown', company: 'Finance LLC', group: 'Colleagues', rsvpStatus: 'confirmed', table: 'Table 3', relationships: 4 },
  { id: '5', name: 'Eva Martinez', company: 'Startup XYZ', group: 'Friends', rsvpStatus: 'declined', table: null, relationships: 1 },
  { id: '6', name: 'Frank Wilson', company: 'Agency Pro', group: "Bride's Family", rsvpStatus: 'confirmed', table: 'Table 1', relationships: 6 },
  { id: '7', name: 'Grace Lee', company: 'Consulting Co', group: 'Colleagues', rsvpStatus: 'pending', table: null, relationships: 2 },
  { id: '8', name: 'Henry Taylor', company: 'Tech Corp', group: "Groom's Family", rsvpStatus: 'confirmed', table: 'Table 2', relationships: 3 },
];

const mockDetailGuest = {
  id: '1',
  name: 'Alice Johnson',
  email: 'alice@techcorp.com',
  company: 'Tech Corp',
  jobTitle: 'Senior Engineer',
  group: "Bride's Family",
  interests: ['hiking', 'photography', 'cooking'],
  dietaryRestrictions: ['Vegetarian'],
  rsvpStatus: 'confirmed',
  table: 'Table 1',
  relationships: [
    { name: 'Bob Smith', type: 'friend', strength: 4 },
    { name: 'Carol Williams', type: 'colleague', strength: 3 },
    { name: 'Frank Wilson', type: 'family', strength: 5 },
  ],
  notes: 'Prefers seating near the dance floor',
};

export function GuestManagementMockup() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGuests, setSelectedGuests] = useState<Set<string>>(new Set(['1', '2']));
  const [selectedGuestDetail, setSelectedGuestDetail] = useState<string | null>('1');
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const toggleGuestSelection = (id: string) => {
    const newSelected = new Set(selectedGuests);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedGuests(newSelected);
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return (
    <div className="guest-management-mockup">
      <div className="gm-header">
        <h1>Guest Management</h1>
        <span className="mockup-badge">MOCKUP</span>
      </div>

      {/* Toolbar */}
      <div className="gm-toolbar">
        <div className="toolbar-left">
          <div className="search-container">
            <span className="search-icon">O</span>
            <input
              type="text"
              placeholder="Search guests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="filter-group">
            <button className="filter-btn">
              Status <span className="dropdown-arrow">v</span>
            </button>
            <button className="filter-btn active">
              Group <span className="dropdown-arrow">v</span>
            </button>
            <button className="filter-btn">
              Assigned <span className="dropdown-arrow">v</span>
            </button>
          </div>
        </div>

        <div className="toolbar-right">
          <button className="toolbar-btn">Import</button>
          <button className="toolbar-btn">Export</button>
          <div className="view-toggle">
            <button className="view-btn active">List</button>
            <button className="view-btn">Grid</button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedGuests.size > 0 && (
        <div className="bulk-actions-bar">
          <span className="selection-count">{selectedGuests.size} selected</span>
          <button className="bulk-btn">Assign to Table</button>
          <button className="bulk-btn">Change Status</button>
          <button className="bulk-btn danger">Delete</button>
          <button className="bulk-btn clear" onClick={() => setSelectedGuests(new Set())}>
            Clear Selection
          </button>
        </div>
      )}

      <div className="gm-content">
        {/* Guest Table */}
        <div className="guest-table-container">
          <table className="guest-table">
            <thead>
              <tr>
                <th className="checkbox-col">
                  <input type="checkbox" />
                </th>
                <th className="avatar-col"></th>
                <th className="sortable" onClick={() => handleSort('name')}>
                  Name {sortColumn === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('group')}>
                  Group {sortColumn === 'group' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('rsvpStatus')}>
                  RSVP {sortColumn === 'rsvpStatus' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="sortable" onClick={() => handleSort('table')}>
                  Table {sortColumn === 'table' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th>Relations</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {mockGuests.map((guest) => (
                <tr
                  key={guest.id}
                  className={`${selectedGuests.has(guest.id) ? 'selected' : ''} ${selectedGuestDetail === guest.id ? 'highlighted' : ''}`}
                  onClick={() => setSelectedGuestDetail(guest.id)}
                >
                  <td className="checkbox-col" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedGuests.has(guest.id)}
                      onChange={() => toggleGuestSelection(guest.id)}
                    />
                  </td>
                  <td className="avatar-col">
                    <div className={`guest-avatar ${guest.rsvpStatus}`}>
                      {guest.name.split(' ').map(n => n[0]).join('')}
                      <span className={`status-dot ${guest.rsvpStatus}`}></span>
                    </div>
                  </td>
                  <td>
                    <div className="guest-name-cell">
                      <span className="guest-name">{guest.name}</span>
                      <span className="guest-company">{guest.company}</span>
                    </div>
                  </td>
                  <td>
                    <span className="group-chip">{guest.group}</span>
                  </td>
                  <td>
                    <span className={`rsvp-badge ${guest.rsvpStatus}`}>
                      {guest.rsvpStatus}
                    </span>
                  </td>
                  <td>
                    {guest.table ? (
                      <span className="table-badge">{guest.table}</span>
                    ) : (
                      <span className="unassigned">Unassigned</span>
                    )}
                  </td>
                  <td>
                    <span className={`relationship-count ${guest.relationships > 0 ? 'has-relationships' : ''}`}>
                      {guest.relationships}
                    </span>
                  </td>
                  <td>
                    <div className="row-actions">
                      <button className="action-icon-btn">Edit</button>
                      <button className="action-icon-btn">Del</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        <div className={`guest-detail-panel ${selectedGuestDetail ? 'open' : ''}`}>
          <div className="detail-header">
            <h3>Guest Details</h3>
            <button className="close-btn" onClick={() => setSelectedGuestDetail(null)}>X</button>
          </div>

          <div className="detail-content">
            <div className="detail-avatar">
              <div className="large-avatar">
                {mockDetailGuest.name.split(' ').map(n => n[0]).join('')}
              </div>
              <h2>{mockDetailGuest.name}</h2>
              <p className="detail-title">{mockDetailGuest.jobTitle}</p>
              <p className="detail-company">{mockDetailGuest.company}</p>
              <div className="detail-badges">
                <span className={`rsvp-badge ${mockDetailGuest.rsvpStatus}`}>
                  {mockDetailGuest.rsvpStatus}
                </span>
                <span className="group-chip">{mockDetailGuest.group}</span>
              </div>
            </div>

            <div className="detail-section">
              <h4>Contact</h4>
              <p>{mockDetailGuest.email}</p>
            </div>

            <div className="detail-section">
              <h4>Interests</h4>
              <div className="tag-list">
                {mockDetailGuest.interests.map((interest) => (
                  <span key={interest} className="tag">{interest}</span>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h4>Dietary Restrictions</h4>
              <div className="tag-list">
                {mockDetailGuest.dietaryRestrictions.map((diet) => (
                  <span key={diet} className="tag warning">{diet}</span>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <h4>Relationships</h4>
              <div className="relationship-graph">
                <div className="graph-placeholder">
                  <div className="center-node">AJ</div>
                  {mockDetailGuest.relationships.map((rel, i) => (
                    <div
                      key={rel.name}
                      className={`satellite-node ${rel.type}`}
                      style={{
                        transform: `rotate(${i * 120}deg) translateX(60px) rotate(-${i * 120}deg)`
                      }}
                    >
                      {rel.name.split(' ').map(n => n[0]).join('')}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>Table Assignment</h4>
              <p>Currently: <strong>{mockDetailGuest.table}</strong></p>
              <div className="detail-actions">
                <button className="detail-btn">Reassign</button>
                <button className="detail-btn outline">Unassign</button>
              </div>
            </div>

            <div className="detail-section">
              <h4>Notes</h4>
              <p className="notes-text">{mockDetailGuest.notes}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuestManagementMockup;
