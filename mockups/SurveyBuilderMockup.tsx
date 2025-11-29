import { useState } from 'react';
import './SurveyBuilderMockup.css';

// Mock survey questions
const mockQuestions = [
  { id: '1', question: 'Which side are you here for?', type: 'single_select', options: ["Bride's side", "Groom's side", "Both"], required: true },
  { id: '2', question: 'Who else attending do you know?', type: 'relationship', required: false },
  { id: '3', question: 'What are your interests or hobbies?', type: 'text', required: false },
  { id: '4', question: 'Any dietary restrictions?', type: 'multiselect', options: ['Vegetarian', 'Vegan', 'Gluten-free', 'Kosher', 'Halal', 'None'], required: true },
];

// Mock statistics
const mockStats = {
  sent: 48,
  responded: 38,
  pending: 10,
  responseRate: 79,
  questionBreakdowns: [
    {
      id: '1',
      question: 'Which side are you here for?',
      answers: [
        { label: "Bride's side", count: 22, percentage: 58 },
        { label: "Groom's side", count: 13, percentage: 34 },
        { label: "Both", count: 3, percentage: 8 },
      ],
    },
    {
      id: '4',
      question: 'Any dietary restrictions?',
      answers: [
        { label: "None", count: 28, percentage: 74 },
        { label: "Vegetarian", count: 6, percentage: 16 },
        { label: "Vegan", count: 2, percentage: 5 },
        { label: "Gluten-free", count: 2, percentage: 5 },
      ],
    },
  ],
};

const questionTypeIcons: Record<string, string> = {
  text: '[ ]',
  multiselect: '[v]',
  single_select: '( )',
  relationship: '<->',
};

export function SurveyBuilderMockup() {
  const [activeTab, setActiveTab] = useState<'preview' | 'statistics'>('preview');
  const [questions] = useState(mockQuestions);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  return (
    <div className="survey-builder-mockup">
      <div className="sb-header">
        <h1>Survey Builder</h1>
        <span className="mockup-badge">MOCKUP</span>
      </div>

      <div className="sb-content">
        {/* Left Panel - Builder */}
        <div className="builder-panel">
          <div className="builder-header">
            <div className="template-selector">
              <label>Template:</label>
              <select>
                <option>Wedding</option>
                <option>Corporate Event</option>
                <option>Social Gathering</option>
                <option>Blank</option>
              </select>
            </div>
            <button className="add-question-btn">+ Add Question</button>
          </div>

          <div className="question-list">
            {questions.map((q, index) => (
              <div
                key={q.id}
                className={`question-card ${draggedId === q.id ? 'dragging' : ''}`}
                draggable
                onDragStart={() => setDraggedId(q.id)}
                onDragEnd={() => setDraggedId(null)}
              >
                <div className="question-header">
                  <span className="drag-handle">||</span>
                  <span className="question-number">Q{index + 1}</span>
                  <span className="question-text">{q.question}</span>
                  {q.required && <span className="required-badge">Required</span>}
                </div>
                <div className="question-meta">
                  <span className="question-type">
                    {questionTypeIcons[q.type]} {q.type.replace('_', ' ')}
                  </span>
                  {q.options && (
                    <span className="option-count">{q.options.length} options</span>
                  )}
                </div>
                <div className="question-actions">
                  <button className="q-action-btn">Edit</button>
                  <button className="q-action-btn">Duplicate</button>
                  <button className="q-action-btn danger">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Panel - Preview/Statistics */}
        <div className="preview-panel">
          <div className="preview-tabs">
            <button
              className={`preview-tab ${activeTab === 'preview' ? 'active' : ''}`}
              onClick={() => setActiveTab('preview')}
            >
              Preview
            </button>
            <button
              className={`preview-tab ${activeTab === 'statistics' ? 'active' : ''}`}
              onClick={() => setActiveTab('statistics')}
            >
              Statistics
            </button>
          </div>

          {activeTab === 'preview' ? (
            <div className="survey-preview">
              <div className="preview-frame">
                <div className="preview-header">
                  <h2>Guest Survey</h2>
                  <p>Sarah & John's Wedding</p>
                </div>

                <div className="preview-questions">
                  {questions.map((q, index) => (
                    <div key={q.id} className="preview-question">
                      <label className="preview-label">
                        {index + 1}. {q.question}
                        {q.required && <span className="required-star">*</span>}
                      </label>

                      {q.type === 'text' && (
                        <input type="text" className="preview-input" placeholder="Your answer..." />
                      )}

                      {q.type === 'single_select' && q.options && (
                        <div className="preview-options">
                          {q.options.map((opt) => (
                            <label key={opt} className="preview-option radio">
                              <input type="radio" name={q.id} />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {q.type === 'multiselect' && q.options && (
                        <div className="preview-options">
                          {q.options.map((opt) => (
                            <label key={opt} className="preview-option checkbox">
                              <input type="checkbox" />
                              <span>{opt}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {q.type === 'relationship' && (
                        <div className="preview-relationship">
                          <select className="preview-select">
                            <option>Select guests you know...</option>
                            <option>Alice Johnson</option>
                            <option>Bob Smith</option>
                            <option>Carol Williams</option>
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                <button className="preview-submit">Submit Response</button>
              </div>
            </div>
          ) : (
            <div className="statistics-dashboard">
              <div className="stats-overview">
                <div className="stat-card">
                  <span className="stat-number">{mockStats.sent}</span>
                  <span className="stat-label">Sent</span>
                </div>
                <div className="stat-card success">
                  <span className="stat-number">{mockStats.responded}</span>
                  <span className="stat-label">Responded</span>
                </div>
                <div className="stat-card warning">
                  <span className="stat-number">{mockStats.pending}</span>
                  <span className="stat-label">Pending</span>
                </div>
              </div>

              <div className="response-rate">
                <div className="rate-header">
                  <span>Response Rate</span>
                  <span className="rate-percentage">{mockStats.responseRate}%</span>
                </div>
                <div className="rate-bar">
                  <div
                    className="rate-fill"
                    style={{ width: `${mockStats.responseRate}%` }}
                  />
                </div>
              </div>

              <div className="question-breakdowns">
                <h3>Question Breakdown</h3>
                {mockStats.questionBreakdowns.map((breakdown) => (
                  <div key={breakdown.id} className="breakdown-card">
                    <h4>{breakdown.question}</h4>
                    <div className="breakdown-bars">
                      {breakdown.answers.map((answer) => (
                        <div key={answer.label} className="breakdown-row">
                          <span className="breakdown-label">{answer.label}</span>
                          <div className="breakdown-bar-container">
                            <div
                              className="breakdown-bar"
                              style={{ width: `${answer.percentage}%` }}
                            />
                          </div>
                          <span className="breakdown-percent">{answer.percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="panel-footer">
            <button className="send-survey-btn">Send Survey to Guests</button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SurveyBuilderMockup;
