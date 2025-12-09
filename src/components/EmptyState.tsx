import React from 'react';
import './EmptyState.css';

type EmptyStateVariant = 'canvas' | 'guests-unassigned' | 'guests-assigned' | 'search' | 'tables';

interface EmptyStateProps {
  variant: EmptyStateVariant;
  title?: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function CanvasIllustration() {
  return (
    <svg className="empty-state-illustration" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Floor/ground */}
      <ellipse cx="100" cy="145" rx="80" ry="10" fill="var(--color-border-light)" opacity="0.5" />

      {/* Round table */}
      <ellipse cx="70" cy="80" rx="35" ry="12" fill="var(--color-border)" />
      <ellipse cx="70" cy="75" rx="35" ry="12" fill="var(--color-bg-secondary)" stroke="var(--color-border)" strokeWidth="2" />

      {/* Chairs around round table */}
      <circle cx="40" cy="60" r="8" fill="var(--color-primary-light)" stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.7" />
      <circle cx="55" cy="50" r="8" fill="var(--color-primary-light)" stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.7" />
      <circle cx="85" cy="50" r="8" fill="var(--color-primary-light)" stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.7" />
      <circle cx="100" cy="60" r="8" fill="var(--color-primary-light)" stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.7" />
      <circle cx="100" cy="90" r="8" fill="var(--color-primary-light)" stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.7" />
      <circle cx="40" cy="90" r="8" fill="var(--color-primary-light)" stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.7" />

      {/* Rectangle table */}
      <rect x="125" y="70" width="50" height="25" rx="3" fill="var(--color-border)" />
      <rect x="125" y="65" width="50" height="25" rx="3" fill="var(--color-bg-secondary)" stroke="var(--color-border)" strokeWidth="2" />

      {/* Chairs around rectangle table */}
      <rect x="130" y="52" width="12" height="10" rx="2" fill="var(--color-primary-light)" stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.7" />
      <rect x="158" y="52" width="12" height="10" rx="2" fill="var(--color-primary-light)" stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.7" />
      <rect x="130" y="93" width="12" height="10" rx="2" fill="var(--color-primary-light)" stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.7" />
      <rect x="158" y="93" width="12" height="10" rx="2" fill="var(--color-primary-light)" stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.7" />

      {/* Plus icon suggesting "add" */}
      <circle cx="100" cy="130" r="15" fill="var(--color-primary)" opacity="0.9" />
      <path d="M100 122 L100 138 M92 130 L108 130" stroke="white" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function GuestsUnassignedIllustration() {
  return (
    <svg className="empty-state-illustration" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Celebration confetti */}
      <circle cx="30" cy="30" r="4" fill="var(--color-primary)" opacity="0.6" />
      <circle cx="170" cy="40" r="3" fill="var(--color-success)" opacity="0.6" />
      <circle cx="50" cy="50" r="2" fill="var(--color-warning)" opacity="0.6" />
      <circle cx="160" cy="60" r="4" fill="var(--color-primary-light)" opacity="0.8" />

      {/* Checkmark badge */}
      <circle cx="100" cy="70" r="40" fill="var(--color-success-light)" />
      <circle cx="100" cy="70" r="30" fill="var(--color-success)" opacity="0.2" />
      <path d="M82 70 L95 83 L118 57" stroke="var(--color-success)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />

      {/* Happy face elements */}
      <ellipse cx="100" cy="130" rx="50" ry="8" fill="var(--color-border-light)" opacity="0.5" />
    </svg>
  );
}

function GuestsAssignedIllustration() {
  return (
    <svg className="empty-state-illustration empty-state-illustration--small" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Empty clipboard */}
      <rect x="30" y="10" width="60" height="60" rx="4" fill="var(--color-bg-secondary)" stroke="var(--color-border)" strokeWidth="2" />
      <rect x="45" y="5" width="30" height="10" rx="3" fill="var(--color-border)" />

      {/* Dashed lines representing empty list */}
      <line x1="40" y1="30" x2="80" y2="30" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4 3" />
      <line x1="40" y1="42" x2="70" y2="42" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4 3" />
      <line x1="40" y1="54" x2="75" y2="54" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4 3" />
    </svg>
  );
}

function SearchIllustration() {
  return (
    <svg className="empty-state-illustration empty-state-illustration--small" viewBox="0 0 120 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Magnifying glass */}
      <circle cx="50" cy="35" r="22" fill="var(--color-bg-secondary)" stroke="var(--color-border)" strokeWidth="3" />
      <line x1="66" y1="51" x2="85" y2="70" stroke="var(--color-border)" strokeWidth="4" strokeLinecap="round" />

      {/* Question mark inside */}
      <text x="50" y="42" textAnchor="middle" fontSize="20" fill="var(--color-text-secondary)" fontWeight="bold">?</text>
    </svg>
  );
}

function TablesIllustration() {
  return (
    <svg className="empty-state-illustration" viewBox="0 0 200 160" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Single round table with arrow pointing to it */}
      <ellipse cx="100" cy="90" rx="45" ry="15" fill="var(--color-border)" />
      <ellipse cx="100" cy="85" rx="45" ry="15" fill="var(--color-bg-secondary)" stroke="var(--color-border)" strokeWidth="2" />

      {/* Empty chairs */}
      <circle cx="60" cy="65" r="10" fill="none" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4 3" />
      <circle cx="100" cy="55" r="10" fill="none" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4 3" />
      <circle cx="140" cy="65" r="10" fill="none" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4 3" />
      <circle cx="140" cy="105" r="10" fill="none" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4 3" />
      <circle cx="100" cy="115" r="10" fill="none" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4 3" />
      <circle cx="60" cy="105" r="10" fill="none" stroke="var(--color-border)" strokeWidth="2" strokeDasharray="4 3" />

      {/* Arrow pointing down */}
      <path d="M100 20 L100 40" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" />
      <path d="M92 32 L100 42 L108 32" stroke="var(--color-primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const illustrations: Record<EmptyStateVariant, () => React.ReactElement> = {
  canvas: CanvasIllustration,
  'guests-unassigned': GuestsUnassignedIllustration,
  'guests-assigned': GuestsAssignedIllustration,
  search: SearchIllustration,
  tables: TablesIllustration,
};

const defaultContent: Record<EmptyStateVariant, { title: string; description: string }> = {
  canvas: {
    title: 'Start Your Floor Plan',
    description: 'Add tables to begin arranging your event layout',
  },
  'guests-unassigned': {
    title: 'All Guests Seated!',
    description: 'Everyone has been assigned to a table',
  },
  'guests-assigned': {
    title: 'No Guests Assigned Yet',
    description: 'Drag guests from the unassigned list to assign them',
  },
  search: {
    title: 'No Results Found',
    description: 'Try adjusting your search or filters',
  },
  tables: {
    title: 'No Tables Yet',
    description: 'Create tables to start seating your guests',
  },
};

export function EmptyState({ variant, title, description, action }: EmptyStateProps) {
  const Illustration = illustrations[variant];
  const content = defaultContent[variant];

  return (
    <div className={`empty-state-container empty-state-container--${variant}`}>
      <div className="empty-state-illustration-wrapper">
        <Illustration />
      </div>
      <h3 className="empty-state-title">{title || content.title}</h3>
      <p className="empty-state-description">{description || content.description}</p>
      {action && (
        <button className="empty-state-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
