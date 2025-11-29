import { useState } from 'react';
import './OptimizationResultsMockup.css';

// Mock optimization data
const mockResult = {
  overallScore: 87,
  grade: 'Excellent',
  breakdown: {
    constraints: { score: 95, max: 100 },
    relationships: { score: 78, max: 100 },
    groups: { score: 85, max: 100 },
    capacity: { score: 100, max: 100 },
  },
  constraintChecklist: [
    { id: '1', label: 'Keep groups together', status: 'pass', detail: '8/8 groups intact' },
    { id: '2', label: 'Respect "avoid" relationships', status: 'warn', detail: '1 pair seated nearby' },
    { id: '3', label: 'Same table constraints', status: 'fail', detail: '2/5 constraints unmet' },
    { id: '4', label: 'Accessibility requirements', status: 'pass', detail: 'All accommodated' },
    { id: '5', label: 'Dietary groupings', status: 'pass', detail: 'Vegetarians grouped' },
  ],
  issues: [
    { id: '1', severity: 'critical', message: 'John Smith & Jane Doe marked "avoid" but seated at Table 3', guestIds: ['1', '2'] },
    { id: '2', severity: 'warning', message: '"Marketing Team" split across Table 2 and Table 5', guestIds: ['3', '4', '5'] },
    { id: '3', severity: 'info', message: 'Mike Wilson prefers front - assigned Table 7 (back section)', guestIds: ['6'] },
  ],
  tableAnalysis: [
    { id: '1', name: 'Table 1', occupancy: 8, capacity: 8, score: 92, issues: 0 },
    { id: '2', name: 'Table 2', occupancy: 7, capacity: 8, score: 85, issues: 1 },
    { id: '3', name: 'Table 3', occupancy: 8, capacity: 8, score: 68, issues: 2 },
    { id: '4', name: 'Table 4', occupancy: 6, capacity: 8, score: 94, issues: 0 },
    { id: '5', name: 'Table 5', occupancy: 8, capacity: 8, score: 78, issues: 1 },
    { id: '6', name: 'Table 6', occupancy: 5, capacity: 8, score: 88, issues: 0 },
  ],
  suggestions: [
    { id: '1', description: 'Move John Smith to Table 5', improvement: 8 },
    { id: '2', description: 'Swap Carol (Table 2) with Dan (Table 5)', improvement: 5 },
    { id: '3', description: 'Move Mike Wilson to Table 2', improvement: 3 },
  ],
  beforeScore: 62,
};

export function OptimizationResultsMockup() {
  const [expandedConstraints, setExpandedConstraints] = useState(true);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState(3);

  const getGradeColor = (score: number) => {
    if (score >= 90) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'fair';
    return 'poor';
  };

  return (
    <div className="optimization-results-mockup">
      <div className="or-header">
        <div className="or-header-left">
          <button className="back-btn">Back</button>
          <h1>Optimization Results</h1>
          <span className="mockup-badge">MOCKUP</span>
        </div>
        <div className="or-header-right">
          <div className="version-selector">
            <span>History:</span>
            {[3, 2, 1].map((v) => (
              <button
                key={v}
                className={`version-btn ${selectedVersion === v ? 'active' : ''}`}
                onClick={() => setSelectedVersion(v)}
              >
                v{v}
              </button>
            ))}
          </div>
          <button
            className={`compare-btn ${compareMode ? 'active' : ''}`}
            onClick={() => setCompareMode(!compareMode)}
          >
            Compare
          </button>
        </div>
      </div>

      <div className="or-content">
        {/* Score Section */}
        <div className="score-section">
          <div className="overall-score-card">
            <div className={`score-circle ${getGradeColor(mockResult.overallScore)}`}>
              <svg viewBox="0 0 120 120">
                <circle className="score-bg" cx="60" cy="60" r="52" />
                <circle
                  className="score-fill"
                  cx="60"
                  cy="60"
                  r="52"
                  strokeDasharray={`${(mockResult.overallScore / 100) * 327} 327`}
                />
              </svg>
              <div className="score-value">
                <span className="score-number">{mockResult.overallScore}</span>
                <span className="score-max">/100</span>
              </div>
            </div>
            <div className={`grade-label ${getGradeColor(mockResult.overallScore)}`}>
              {mockResult.grade}
            </div>
          </div>

          <div className="score-breakdown">
            <h3>Score Breakdown</h3>
            {Object.entries(mockResult.breakdown).map(([key, value]) => (
              <div key={key} className="breakdown-item">
                <div className="breakdown-header">
                  <span className="breakdown-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                  <span className="breakdown-value">{value.score}%</span>
                </div>
                <div className="breakdown-bar">
                  <div
                    className="breakdown-fill"
                    style={{ width: `${value.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Constraint Checklist */}
        <div className="constraint-section">
          <div className="section-header" onClick={() => setExpandedConstraints(!expandedConstraints)}>
            <h3>Constraint Checklist</h3>
            <button className="expand-btn">{expandedConstraints ? '−' : '+'}</button>
          </div>
          {expandedConstraints && (
            <div className="constraint-list">
              {mockResult.constraintChecklist.map((item) => (
                <div key={item.id} className={`constraint-item ${item.status}`}>
                  <span className="constraint-icon">
                    {item.status === 'pass' && '✓'}
                    {item.status === 'warn' && '!'}
                    {item.status === 'fail' && '✕'}
                  </span>
                  <span className="constraint-label">{item.label}</span>
                  <span className={`constraint-status ${item.status}`}>
                    {item.status.toUpperCase()}
                  </span>
                  <span className="constraint-detail">{item.detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Issues Panel */}
        <div className="issues-section">
          <div className="section-header">
            <h3>Issues & Warnings</h3>
            <span className="issue-count">{mockResult.issues.length} total</span>
          </div>
          <div className="issues-list">
            {mockResult.issues.map((issue) => (
              <div key={issue.id} className={`issue-item ${issue.severity}`}>
                <span className="issue-icon">
                  {issue.severity === 'critical' && '!'}
                  {issue.severity === 'warning' && '!'}
                  {issue.severity === 'info' && 'i'}
                </span>
                <span className="issue-message">{issue.message}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table Analysis */}
        <div className="table-analysis-section">
          <h3>Table-by-Table Analysis</h3>
          <div className="table-grid">
            {mockResult.tableAnalysis.map((table) => (
              <div key={table.id} className={`table-card ${getGradeColor(table.score)}`}>
                <div className="table-card-header">
                  <span className="table-name">{table.name}</span>
                  <span className="table-occupancy">{table.occupancy}/{table.capacity}</span>
                </div>
                <div className="table-score">
                  <span className="table-score-value">{table.score}</span>
                  <span className="table-score-label">compatibility</span>
                </div>
                {table.issues > 0 && (
                  <span className="table-issues-badge">{table.issues} issue{table.issues > 1 ? 's' : ''}</span>
                )}
                <div className="table-guests">
                  {Array(table.occupancy).fill(0).map((_, i) => (
                    <div key={i} className="mini-avatar" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestions */}
        <div className="suggestions-section">
          <h3>Alternative Suggestions</h3>
          <div className="suggestions-list">
            {mockResult.suggestions.map((suggestion) => (
              <div key={suggestion.id} className="suggestion-card">
                <div className="suggestion-content">
                  <span className="suggestion-type">Swap:</span>
                  <span className="suggestion-text">{suggestion.description}</span>
                </div>
                <div className="suggestion-improvement">
                  +{suggestion.improvement} pts
                </div>
                <button className="apply-suggestion-btn">Apply</button>
              </div>
            ))}
          </div>
        </div>

        {/* Before/After Comparison */}
        {compareMode && (
          <div className="comparison-section">
            <h3>Before / After Comparison</h3>
            <div className="comparison-grid">
              <div className="comparison-card before">
                <h4>Before</h4>
                <div className="mini-floorplan">
                  <div className="mini-table" style={{ top: '20%', left: '20%' }} />
                  <div className="mini-table" style={{ top: '20%', left: '60%' }} />
                  <div className="mini-table" style={{ top: '60%', left: '20%' }} />
                  <div className="mini-table" style={{ top: '60%', left: '60%' }} />
                </div>
                <div className="comparison-stats">
                  <span className="comparison-score">{mockResult.beforeScore}</span>
                  <span className="comparison-label">Score</span>
                </div>
              </div>
              <div className="comparison-card after">
                <h4>After</h4>
                <div className="mini-floorplan">
                  <div className="mini-table optimized" style={{ top: '20%', left: '20%' }} />
                  <div className="mini-table optimized" style={{ top: '20%', left: '60%' }} />
                  <div className="mini-table optimized" style={{ top: '60%', left: '20%' }} />
                  <div className="mini-table optimized" style={{ top: '60%', left: '60%' }} />
                </div>
                <div className="comparison-stats">
                  <span className="comparison-score success">{mockResult.overallScore}</span>
                  <span className="comparison-label">Score</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button className="action-btn primary">Apply Arrangement</button>
          <button className="action-btn secondary">Try Again</button>
        </div>
      </div>
    </div>
  );
}

export default OptimizationResultsMockup;
