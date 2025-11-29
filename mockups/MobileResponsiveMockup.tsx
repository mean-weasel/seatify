import { useState } from 'react';
import './MobileResponsiveMockup.css';

// Mock guest data for carousel
const mockGuests = [
  { id: '1', name: 'Alice Johnson', group: "Bride's Family", rsvpStatus: 'confirmed' },
  { id: '2', name: 'Bob Smith', group: "Groom's Family", rsvpStatus: 'pending' },
  { id: '3', name: 'Carol Williams', group: 'Friends', rsvpStatus: 'confirmed' },
  { id: '4', name: 'David Brown', group: 'Colleagues', rsvpStatus: 'confirmed' },
  { id: '5', name: 'Eva Martinez', group: 'Friends', rsvpStatus: 'pending' },
];

export function MobileResponsiveMockup() {
  const [activeView, setActiveView] = useState<'canvas' | 'guests' | 'optimize'>('canvas');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fabExpanded, setFabExpanded] = useState(false);
  const [currentGuestIndex, setCurrentGuestIndex] = useState(0);
  const [assignmentMode, setAssignmentMode] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  const handleTableTap = (tableId: string) => {
    if (!assignmentMode) {
      setAssignmentMode(true);
      setSelectedTable(tableId);
    } else {
      setAssignmentMode(false);
      setSelectedTable(null);
    }
  };

  const nextGuest = () => {
    setCurrentGuestIndex((i) => Math.min(i + 1, mockGuests.length - 1));
  };

  const prevGuest = () => {
    setCurrentGuestIndex((i) => Math.max(i - 1, 0));
  };

  return (
    <div className="mobile-mockup">
      {/* Mobile Frame */}
      <div className="phone-frame">
        <div className="phone-notch" />
        <div className="phone-screen">
          {/* Mobile Header */}
          <header className="mobile-header">
            <button className="hamburger-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? 'X' : '='}
            </button>
            <div className="mobile-logo">SeatOptima</div>
            <button className="menu-btn">...</button>
          </header>

          {/* Sidebar Overlay */}
          {sidebarOpen && (
            <>
              <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />
              <div className="mobile-sidebar">
                <div className="sidebar-header">
                  <h3>Event Settings</h3>
                  <button className="close-sidebar" onClick={() => setSidebarOpen(false)}>X</button>
                </div>
                <div className="sidebar-content">
                  <div className="sidebar-field">
                    <label>Event Name</label>
                    <input type="text" value="Sarah & John's Wedding" readOnly />
                  </div>
                  <div className="sidebar-field">
                    <label>Event Type</label>
                    <select defaultValue="wedding">
                      <option value="wedding">Wedding</option>
                      <option value="corporate">Corporate</option>
                    </select>
                  </div>
                  <div className="sidebar-stats">
                    <div className="stat">
                      <span className="stat-num">48</span>
                      <span className="stat-lbl">Guests</span>
                    </div>
                    <div className="stat">
                      <span className="stat-num">6</span>
                      <span className="stat-lbl">Tables</span>
                    </div>
                    <div className="stat">
                      <span className="stat-num">16</span>
                      <span className="stat-lbl">Unassigned</span>
                    </div>
                  </div>
                  <h4>Unassigned Guests</h4>
                  <div className="sidebar-guest-list">
                    {mockGuests.slice(0, 3).map((g) => (
                      <div key={g.id} className="sidebar-guest-chip">
                        <span className="chip-avatar">{g.name.split(' ').map(n => n[0]).join('')}</span>
                        <span className="chip-name">{g.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Main Content */}
          <main className="mobile-main">
            {activeView === 'canvas' && (
              <div className="mobile-canvas">
                {/* Assignment Mode Indicator */}
                {assignmentMode && (
                  <div className="assignment-mode-banner">
                    Tap a guest to assign to {selectedTable}
                    <button onClick={() => { setAssignmentMode(false); setSelectedTable(null); }}>Cancel</button>
                  </div>
                )}

                {/* Canvas Toolbar */}
                <div className="canvas-toolbar-mobile">
                  <button className="tool-btn">Zoom -</button>
                  <span className="zoom-level">100%</span>
                  <button className="tool-btn">Zoom +</button>
                </div>

                {/* Canvas Area */}
                <div className="canvas-area">
                  <div
                    className={`mobile-table ${selectedTable === 'T1' ? 'selected' : ''}`}
                    style={{ top: '15%', left: '25%' }}
                    onClick={() => handleTableTap('T1')}
                  >
                    <span>T1</span>
                    <span className="table-count">6/8</span>
                  </div>
                  <div
                    className={`mobile-table ${selectedTable === 'T2' ? 'selected' : ''}`}
                    style={{ top: '15%', left: '65%' }}
                    onClick={() => handleTableTap('T2')}
                  >
                    <span>T2</span>
                    <span className="table-count">8/8</span>
                  </div>
                  <div
                    className={`mobile-table rect ${selectedTable === 'T3' ? 'selected' : ''}`}
                    style={{ top: '50%', left: '45%' }}
                    onClick={() => handleTableTap('T3')}
                  >
                    <span>T3</span>
                    <span className="table-count">10/10</span>
                  </div>
                  <div
                    className={`mobile-table ${selectedTable === 'T4' ? 'selected' : ''}`}
                    style={{ top: '80%', left: '25%' }}
                    onClick={() => handleTableTap('T4')}
                  >
                    <span>T4</span>
                    <span className="table-count">4/8</span>
                  </div>
                  <div
                    className={`mobile-table ${selectedTable === 'T5' ? 'selected' : ''}`}
                    style={{ top: '80%', left: '65%' }}
                    onClick={() => handleTableTap('T5')}
                  >
                    <span>T5</span>
                    <span className="table-count">5/8</span>
                  </div>

                  {/* Pinch to zoom hint */}
                  <div className="canvas-hint">Pinch to zoom | Double-tap to reset</div>
                </div>
              </div>
            )}

            {activeView === 'guests' && (
              <div className="mobile-guests">
                <h2>Unassigned Guests</h2>
                <p className="guests-subtitle">Swipe to browse | Tap to assign</p>

                {/* Guest Carousel */}
                <div className="guest-carousel">
                  <button className="carousel-nav prev" onClick={prevGuest} disabled={currentGuestIndex === 0}>
                    {'<'}
                  </button>

                  <div className="carousel-track">
                    {mockGuests.map((guest, index) => (
                      <div
                        key={guest.id}
                        className={`carousel-card ${index === currentGuestIndex ? 'active' : ''} ${assignmentMode ? 'assignable' : ''}`}
                        style={{
                          transform: `translateX(${(index - currentGuestIndex) * 110}%)`,
                          opacity: index === currentGuestIndex ? 1 : 0.4,
                        }}
                      >
                        <div className="card-avatar">
                          {guest.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <h3>{guest.name}</h3>
                        <p className="card-group">{guest.group}</p>
                        <span className={`card-status ${guest.rsvpStatus}`}>
                          {guest.rsvpStatus}
                        </span>
                        <button className="assign-btn">Assign to Table</button>
                      </div>
                    ))}
                  </div>

                  <button className="carousel-nav next" onClick={nextGuest} disabled={currentGuestIndex === mockGuests.length - 1}>
                    {'>'}
                  </button>
                </div>

                {/* Carousel Dots */}
                <div className="carousel-dots">
                  {mockGuests.map((_, index) => (
                    <button
                      key={index}
                      className={`dot ${index === currentGuestIndex ? 'active' : ''}`}
                      onClick={() => setCurrentGuestIndex(index)}
                    />
                  ))}
                </div>

                <p className="carousel-counter">{currentGuestIndex + 1} / {mockGuests.length}</p>
              </div>
            )}

            {activeView === 'optimize' && (
              <div className="mobile-optimize">
                <h2>Optimization</h2>
                <div className="optimize-score-card">
                  <div className="score-circle-mobile">
                    <span className="score-num">87</span>
                    <span className="score-label">Score</span>
                  </div>
                </div>
                <div className="optimize-stats-mobile">
                  <div className="opt-stat">
                    <span className="opt-stat-icon pass">OK</span>
                    <span>12 constraints satisfied</span>
                  </div>
                  <div className="opt-stat">
                    <span className="opt-stat-icon warn">!</span>
                    <span>2 warnings</span>
                  </div>
                  <div className="opt-stat">
                    <span className="opt-stat-icon fail">X</span>
                    <span>1 issue</span>
                  </div>
                </div>
                <button className="optimize-btn-mobile">Run Optimization</button>
              </div>
            )}
          </main>

          {/* Floating Action Button */}
          <div className={`fab-container ${fabExpanded ? 'expanded' : ''}`}>
            {fabExpanded && <div className="fab-backdrop" onClick={() => setFabExpanded(false)} />}
            <div className="fab-actions">
              {activeView === 'canvas' ? (
                <>
                  <button className="fab-action" onClick={() => setFabExpanded(false)}>
                    <span>O</span> Round Table
                  </button>
                  <button className="fab-action" onClick={() => setFabExpanded(false)}>
                    <span>[]</span> Rectangle
                  </button>
                  <button className="fab-action" onClick={() => setFabExpanded(false)}>
                    <span>[]</span> Square
                  </button>
                </>
              ) : (
                <>
                  <button className="fab-action" onClick={() => setFabExpanded(false)}>
                    <span>+</span> Add Guest
                  </button>
                  <button className="fab-action" onClick={() => setFabExpanded(false)}>
                    <span>i</span> Import CSV
                  </button>
                </>
              )}
            </div>
            <button className="fab-main" onClick={() => setFabExpanded(!fabExpanded)}>
              {fabExpanded ? 'X' : '+'}
            </button>
          </div>

          {/* Bottom Navigation */}
          <nav className="bottom-nav">
            <button
              className={`nav-item ${activeView === 'canvas' ? 'active' : ''}`}
              onClick={() => setActiveView('canvas')}
            >
              <span className="nav-icon">m</span>
              <span className="nav-label">Floor Plan</span>
            </button>
            <button
              className={`nav-item ${activeView === 'guests' ? 'active' : ''}`}
              onClick={() => setActiveView('guests')}
            >
              <span className="nav-icon">P</span>
              <span className="nav-label">Guests</span>
              <span className="nav-badge">16</span>
            </button>
            <button
              className={`nav-item ${activeView === 'optimize' ? 'active' : ''}`}
              onClick={() => setActiveView('optimize')}
            >
              <span className="nav-icon">*</span>
              <span className="nav-label">Optimize</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Description */}
      <div className="mockup-description">
        <h2>Mobile Responsive Mockup</h2>
        <span className="mockup-badge">MOCKUP</span>
        <ul>
          <li><strong>Slide-out Sidebar:</strong> Hamburger menu opens drawer</li>
          <li><strong>Bottom Navigation:</strong> Thumb-friendly nav bar</li>
          <li><strong>Touch Canvas:</strong> Pinch-to-zoom, tap to select</li>
          <li><strong>Guest Carousel:</strong> Swipeable guest cards</li>
          <li><strong>FAB:</strong> Floating action button for quick actions</li>
          <li><strong>Assignment Mode:</strong> Tap table, then tap guest</li>
        </ul>
      </div>
    </div>
  );
}

export default MobileResponsiveMockup;
