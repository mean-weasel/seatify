import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useStore } from '../store/useStore';
import './CanvasSearch.css';

interface SearchResult {
  type: 'guest' | 'table';
  id: string;
  name: string;
  subtitle?: string;
  x: number;
  y: number;
}

// Simple fuzzy matching
function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();

  if (!q) return 0;
  if (t === q) return 1.0;
  if (t.includes(q)) return 0.9;

  // Check word parts
  const queryParts = q.split(/\s+/);
  const targetParts = t.split(/\s+/);

  let matchCount = 0;
  for (const qPart of queryParts) {
    if (targetParts.some(tPart => tPart.startsWith(qPart))) {
      matchCount++;
    }
  }

  return matchCount > 0 ? 0.5 + (matchCount / queryParts.length) * 0.4 : 0;
}

export function CanvasSearch() {
  const { event, canvas, setPan, selectTable, selectGuest } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Global keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl+F to open search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsOpen(true);
      }
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Build search results
  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];

    const guestResults: SearchResult[] = event.guests
      .map((guest): SearchResult & { score: number } => {
        const nameScore = fuzzyMatch(query, guest.name);
        const groupScore = guest.group ? fuzzyMatch(query, guest.group) * 0.8 : 0;
        const score = Math.max(nameScore, groupScore);

        // Find guest position
        let x = guest.canvasX || 0;
        let y = guest.canvasY || 0;
        if (guest.tableId) {
          const table = event.tables.find(t => t.id === guest.tableId);
          if (table) {
            x = table.x + table.width / 2;
            y = table.y + table.height / 2;
          }
        }

        const tableName = guest.tableId
          ? event.tables.find(t => t.id === guest.tableId)?.name
          : 'Unassigned';

        return {
          type: 'guest',
          id: guest.id,
          name: guest.name,
          subtitle: tableName,
          x,
          y,
          score,
        };
      })
      .filter(r => r.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    const tableResults: SearchResult[] = event.tables
      .map((table): SearchResult & { score: number } => {
        const score = fuzzyMatch(query, table.name);
        const guestCount = event.guests.filter(g => g.tableId === table.id).length;

        return {
          type: 'table',
          id: table.id,
          name: table.name,
          subtitle: `${guestCount}/${table.capacity} guests`,
          x: table.x + table.width / 2,
          y: table.y + table.height / 2,
          score,
        };
      })
      .filter(r => r.score > 0.3)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return [...guestResults, ...tableResults].sort((a, b) => (b as any).score - (a as any).score).slice(0, 10);
  }, [query, event.guests, event.tables]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setQuery('');
    setSelectedIndex(0);
  }, []);

  const navigateToResult = useCallback((result: SearchResult) => {
    // Pan to center on result
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const newPanX = viewportWidth / 2 - result.x * canvas.zoom;
    const newPanY = viewportHeight / 2 - result.y * canvas.zoom;

    setPan(newPanX, newPanY);

    // Select the item
    if (result.type === 'table') {
      selectTable(result.id);
    } else {
      selectGuest(result.id);
    }

    handleClose();
  }, [canvas.zoom, setPan, selectTable, selectGuest, handleClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault();
      navigateToResult(results[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="canvas-search-overlay" onClick={handleClose}>
      <div className="canvas-search-modal" onClick={e => e.stopPropagation()}>
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search guests, tables, or groups..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="shortcut-hint">ESC</kbd>
        </div>

        {results.length > 0 && (
          <ul className="search-results">
            {results.map((result, index) => (
              <li
                key={`${result.type}-${result.id}`}
                className={`search-result ${index === selectedIndex ? 'selected' : ''}`}
                onClick={() => navigateToResult(result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span className="result-icon">
                  {result.type === 'guest' ? '👤' : '🪑'}
                </span>
                <div className="result-info">
                  <span className="result-name">{result.name}</span>
                  {result.subtitle && (
                    <span className="result-subtitle">{result.subtitle}</span>
                  )}
                </div>
                <span className="result-type">{result.type}</span>
              </li>
            ))}
          </ul>
        )}

        {query && results.length === 0 && (
          <div className="search-empty">
            No results found for "{query}"
          </div>
        )}

        <div className="search-footer">
          <span><kbd>↑</kbd> <kbd>↓</kbd> Navigate</span>
          <span><kbd>Enter</kbd> Go to</span>
          <span><kbd>Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
