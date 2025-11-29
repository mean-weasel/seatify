import { useState } from 'react';
import { DashboardMockup } from './DashboardMockup';
import { GuestManagementMockup } from './GuestManagementMockup';
import { SurveyBuilderMockup } from './SurveyBuilderMockup';
import { OptimizationResultsMockup } from './OptimizationResultsMockup';
import { MobileResponsiveMockup } from './MobileResponsiveMockup';
import './MockupViewer.css';

const mockups = [
  { id: 'dashboard', name: 'Dashboard', component: DashboardMockup },
  { id: 'guests', name: 'Guest Management', component: GuestManagementMockup },
  { id: 'survey', name: 'Survey Builder', component: SurveyBuilderMockup },
  { id: 'optimization', name: 'Optimization Results', component: OptimizationResultsMockup },
  { id: 'mobile', name: 'Mobile Responsive', component: MobileResponsiveMockup },
];

export function MockupViewer() {
  const [activeMockup, setActiveMockup] = useState('dashboard');
  const ActiveComponent = mockups.find(m => m.id === activeMockup)?.component || DashboardMockup;

  return (
    <div className="mockup-viewer">
      <nav className="mockup-nav">
        <h2>Mockup Viewer</h2>
        <div className="mockup-tabs">
          {mockups.map(mockup => (
            <button
              key={mockup.id}
              className={`mockup-tab ${activeMockup === mockup.id ? 'active' : ''}`}
              onClick={() => setActiveMockup(mockup.id)}
            >
              {mockup.name}
            </button>
          ))}
        </div>
      </nav>
      <div className="mockup-content">
        <ActiveComponent />
      </div>
    </div>
  );
}

export default MockupViewer;
