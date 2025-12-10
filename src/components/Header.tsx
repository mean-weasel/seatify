import { useEffect } from 'react';
import { useStore } from '../store/useStore';
import { version } from '../../package.json';
import { UpdatesButton } from './UpdatesPopup';
import './Header.css';

interface HeaderProps {
  onLogoClick?: () => void;
  onShowHelp?: () => void;
}

export function Header({ onLogoClick, onShowHelp }: HeaderProps) {
  const { event, setEventName, theme, cycleTheme } = useStore();

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      // System mode - remove attribute so media query takes over
      root.removeAttribute('data-theme');
    }
  }, [theme]);

  const getThemeIcon = () => {
    switch (theme) {
      case 'light': return '\u2600'; // Sun
      case 'dark': return '\u263D'; // Moon
      default: return '\u2699'; // Gear (system)
    }
  };

  const getThemeTitle = () => {
    switch (theme) {
      case 'light': return 'Light mode (click for dark)';
      case 'dark': return 'Dark mode (click for system)';
      default: return 'System theme (click for light)';
    }
  };

  return (
    <header className="header">
      <div className="header-left">
        <h1
          className="logo"
          onClick={onLogoClick}
          style={{ cursor: onLogoClick ? 'pointer' : 'default' }}
          title="Back to home"
        >TableCraft</h1>
        <span className="version-badge">v{version}</span>
        <UpdatesButton variant="header" />
        {onShowHelp && (
          <button
            className="help-btn"
            onClick={onShowHelp}
            title="Keyboard Shortcuts (?)"
          >
            ?
          </button>
        )}
        <button
          className="theme-btn"
          onClick={cycleTheme}
          title={getThemeTitle()}
        >
          {getThemeIcon()}
        </button>
        <div className="event-info">
          <input
            type="text"
            value={event.name}
            onChange={(e) => setEventName(e.target.value)}
            className="event-name-input"
          />
        </div>
      </div>
    </header>
  );
}
