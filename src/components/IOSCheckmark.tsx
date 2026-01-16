import './IOSCheckmark.css';

interface IOSCheckmarkProps {
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
  indeterminate?: boolean;
}

/**
 * iOS-style selection checkmark for table/list rows
 * Uses a circle that shows a checkmark when selected
 */
export function IOSCheckmark({
  checked,
  onChange,
  disabled = false,
  size = 'medium',
  indeterminate = false,
}: IOSCheckmarkProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={indeterminate ? 'mixed' : checked}
      className={`ios-checkmark ${size} ${checked ? 'checked' : ''} ${indeterminate ? 'indeterminate' : ''} ${disabled ? 'disabled' : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onChange();
      }}
      disabled={disabled}
    >
      <span className="ios-checkmark-circle">
        {(checked || indeterminate) && (
          <svg
            className="ios-checkmark-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {indeterminate ? (
              <line x1="6" y1="12" x2="18" y2="12" />
            ) : (
              <polyline points="20 6 9 17 4 12" />
            )}
          </svg>
        )}
      </span>
    </button>
  );
}
