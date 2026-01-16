import './IOSToggle.css';

interface IOSToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  size?: 'small' | 'medium';
}

export function IOSToggle({ checked, onChange, disabled = false, label, size = 'medium' }: IOSToggleProps) {
  return (
    <label className={`ios-toggle-container ${size} ${disabled ? 'disabled' : ''}`}>
      {label && <span className="ios-toggle-label">{label}</span>}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`ios-toggle ${checked ? 'on' : 'off'}`}
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
      >
        <span className="ios-toggle-track" />
        <span className="ios-toggle-thumb" />
      </button>
    </label>
  );
}
