import { useRef, useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent, DragMoveEvent } from '@dnd-kit/core';
import { useStore } from '../store/useStore';
import { TableComponent } from './Table';
import { GuestChip } from './GuestChip';
import { CanvasGuest } from './CanvasGuest';
import { TablePropertiesPanel } from './TablePropertiesPanel';
import { CanvasSearch } from './CanvasSearch';
import { CanvasMinimap } from './CanvasMinimap';
import type { TableShape, Table, AlignmentGuide } from '../types';
import './Canvas.css';

const SNAP_THRESHOLD = 80; // pixels in canvas coordinates
const ALIGNMENT_THRESHOLD = 10; // pixels for alignment guide detection

// Snap a position to grid
function snapToGrid(value: number, gridSize: number, enabled: boolean): number {
  if (!enabled) return value;
  return Math.round(value / gridSize) * gridSize;
}

// Find alignment guides for a moving table
function findAlignmentGuides(
  movingTable: Table,
  newX: number,
  newY: number,
  otherTables: Table[],
  threshold: number
): AlignmentGuide[] {
  const guides: AlignmentGuide[] = [];
  const movingCenterX = newX + movingTable.width / 2;
  const movingCenterY = newY + movingTable.height / 2;
  const movingLeft = newX;
  const movingRight = newX + movingTable.width;
  const movingTop = newY;
  const movingBottom = newY + movingTable.height;

  for (const table of otherTables) {
    if (table.id === movingTable.id) continue;

    const tableCenterX = table.x + table.width / 2;
    const tableCenterY = table.y + table.height / 2;
    const tableLeft = table.x;
    const tableRight = table.x + table.width;
    const tableTop = table.y;
    const tableBottom = table.y + table.height;

    // Vertical alignment (horizontal guides)
    // Center to center
    if (Math.abs(movingCenterY - tableCenterY) < threshold) {
      guides.push({
        type: 'horizontal',
        position: tableCenterY,
        start: Math.min(movingLeft, tableLeft) - 20,
        end: Math.max(movingRight, tableRight) + 20,
      });
    }
    // Top to top
    if (Math.abs(movingTop - tableTop) < threshold) {
      guides.push({
        type: 'horizontal',
        position: tableTop,
        start: Math.min(movingLeft, tableLeft) - 20,
        end: Math.max(movingRight, tableRight) + 20,
      });
    }
    // Bottom to bottom
    if (Math.abs(movingBottom - tableBottom) < threshold) {
      guides.push({
        type: 'horizontal',
        position: tableBottom,
        start: Math.min(movingLeft, tableLeft) - 20,
        end: Math.max(movingRight, tableRight) + 20,
      });
    }

    // Horizontal alignment (vertical guides)
    // Center to center
    if (Math.abs(movingCenterX - tableCenterX) < threshold) {
      guides.push({
        type: 'vertical',
        position: tableCenterX,
        start: Math.min(movingTop, tableTop) - 20,
        end: Math.max(movingBottom, tableBottom) + 20,
      });
    }
    // Left to left
    if (Math.abs(movingLeft - tableLeft) < threshold) {
      guides.push({
        type: 'vertical',
        position: tableLeft,
        start: Math.min(movingTop, tableTop) - 20,
        end: Math.max(movingBottom, tableBottom) + 20,
      });
    }
    // Right to right
    if (Math.abs(movingRight - tableRight) < threshold) {
      guides.push({
        type: 'vertical',
        position: tableRight,
        start: Math.min(movingTop, tableTop) - 20,
        end: Math.max(movingBottom, tableBottom) + 20,
      });
    }
  }

  return guides;
}

function findNearbyTable(x: number, y: number, tables: Table[]): Table | null {
  for (const table of tables) {
    const tableCenterX = table.x + table.width / 2;
    const tableCenterY = table.y + table.height / 2;

    let distance: number;

    if (table.shape === 'round') {
      const radius = table.width / 2;
      const dx = x - tableCenterX;
      const dy = y - tableCenterY;
      distance = Math.sqrt(dx * dx + dy * dy) - radius;
    } else {
      // Rectangle/square - distance to nearest edge
      const dx = Math.max(Math.abs(x - tableCenterX) - table.width / 2, 0);
      const dy = Math.max(Math.abs(y - tableCenterY) - table.height / 2, 0);
      distance = Math.sqrt(dx * dx + dy * dy);
    }

    if (distance < SNAP_THRESHOLD) {
      return table;
    }
  }
  return null;
}

export function Canvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    event,
    canvas,
    canvasPrefs,
    alignmentGuides,
    setZoom,
    setPan,
    moveTable,
    assignGuestToTable,
    moveGuestOnCanvas,
    detachGuestFromTable,
    addTable,
    selectTable,
    selectGuest,
    setAlignmentGuides,
    clearAlignmentGuides,
    pushHistory,
    addQuickGuest,
  } = useStore();

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedGuestId, setDraggedGuestId] = useState<string | null>(null);
  const [nearbyTableId, setNearbyTableId] = useState<string | null>(null);
  const [dragType, setDragType] = useState<string | null>(null);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [showTableDropdown, setShowTableDropdown] = useState(false);
  const addDropdownRef = useRef<HTMLDivElement>(null);
  const tableDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (addDropdownRef.current && !addDropdownRef.current.contains(e.target as Node)) {
        setShowAddDropdown(false);
      }
      if (tableDropdownRef.current && !tableDropdownRef.current.contains(e.target as Node)) {
        setShowTableDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        setZoom(canvas.zoom + delta);
      } else {
        setPan(canvas.panX - e.deltaX, canvas.panY - e.deltaY);
      }
    },
    [canvas.zoom, canvas.panX, canvas.panY, setZoom, setPan]
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
        setIsPanning(true);
        setPanStart({ x: e.clientX - canvas.panX, y: e.clientY - canvas.panY });
      }
    },
    [canvas.panX, canvas.panY]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isPanning) {
        setPan(e.clientX - panStart.x, e.clientY - panStart.y);
      }
    },
    [isPanning, panStart, setPan]
  );

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  const handleDragStart = (dragEvent: DragStartEvent) => {
    const { active } = dragEvent;
    const type = active.data.current?.type;
    if (type === 'guest' || type === 'canvas-guest' || type === 'seated-guest') {
      setDraggedGuestId(active.id as string);
      setDragType(type);
    } else if (type === 'table') {
      setDragType(type);
      // Save state before moving for undo
      pushHistory('Move table');
    }
  };

  const handleDragMove = (dragEvent: DragMoveEvent) => {
    const { active, delta } = dragEvent;
    const type = active.data.current?.type;

    if (type === 'table') {
      const table = event.tables.find((t) => t.id === active.id);
      if (!table) return;

      const newX = table.x + delta.x / canvas.zoom;
      const newY = table.y + delta.y / canvas.zoom;

      // Compute alignment guides
      if (canvasPrefs.showAlignmentGuides) {
        const guides = findAlignmentGuides(table, newX, newY, event.tables, ALIGNMENT_THRESHOLD);
        setAlignmentGuides(guides);
      }
    } else if (type === 'canvas-guest') {
      const guest = event.guests.find((g) => g.id === active.id);
      if (!guest || guest.canvasX === undefined || guest.canvasY === undefined) return;

      const newX = guest.canvasX + delta.x / canvas.zoom;
      const newY = guest.canvasY + delta.y / canvas.zoom;

      const nearbyTable = findNearbyTable(newX, newY, event.tables);
      setNearbyTableId(nearbyTable?.id || null);
    } else if (type === 'seated-guest') {
      const originalPos = active.data.current?.originalPosition;
      if (!originalPos) return;

      const newX = originalPos.canvasX + delta.x / canvas.zoom;
      const newY = originalPos.canvasY + delta.y / canvas.zoom;

      const nearbyTable = findNearbyTable(newX, newY, event.tables);
      setNearbyTableId(nearbyTable?.id || null);
    }
  };

  const handleDragEnd = (dragEvent: DragEndEvent) => {
    const { active, over, delta } = dragEvent;
    setDraggedGuestId(null);
    setNearbyTableId(null);
    setDragType(null);
    clearAlignmentGuides();

    const type = active.data.current?.type;

    if (type === 'table') {
      const table = event.tables.find((t) => t.id === active.id);
      if (table) {
        let newX = table.x + delta.x / canvas.zoom;
        let newY = table.y + delta.y / canvas.zoom;

        // Apply snap to grid
        if (canvasPrefs.snapToGrid) {
          newX = snapToGrid(newX, canvasPrefs.gridSize, true);
          newY = snapToGrid(newY, canvasPrefs.gridSize, true);
        }

        moveTable(active.id as string, newX, newY);
      }
    } else if (type === 'canvas-guest') {
      // Dragging a free-floating guest on the canvas
      const guest = event.guests.find((g) => g.id === active.id);
      if (!guest || guest.canvasX === undefined || guest.canvasY === undefined) return;

      const newX = guest.canvasX + delta.x / canvas.zoom;
      const newY = guest.canvasY + delta.y / canvas.zoom;

      const nearbyTable = findNearbyTable(newX, newY, event.tables);

      if (nearbyTable) {
        // Snap to table
        assignGuestToTable(active.id as string, nearbyTable.id);
      } else {
        // Just move on canvas
        moveGuestOnCanvas(active.id as string, newX, newY);
      }
    } else if (type === 'seated-guest') {
      // Dragging a guest who is currently seated at a table
      const originalPos = active.data.current?.originalPosition;
      if (!originalPos) return;

      const newX = originalPos.canvasX + delta.x / canvas.zoom;
      const newY = originalPos.canvasY + delta.y / canvas.zoom;

      const nearbyTable = findNearbyTable(newX, newY, event.tables);

      if (nearbyTable) {
        // Assign to (possibly different) table
        assignGuestToTable(active.id as string, nearbyTable.id);
      } else {
        // Detach from table - guest becomes free-floating
        detachGuestFromTable(active.id as string, newX, newY);
      }
    } else if (type === 'guest') {
      // Dragging from sidebar
      if (over?.data.current?.type === 'table') {
        assignGuestToTable(active.id as string, over.id as string);
      } else if (!over) {
        // Dropped on canvas - calculate position
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          // Place guest at a reasonable position on canvas
          const guest = event.guests.find((g) => g.id === active.id);
          const existingPos = guest?.canvasX !== undefined && guest?.canvasY !== undefined;

          if (!existingPos) {
            // Give a default position in canvas coordinates
            const existingUnassigned = event.guests.filter((g) => !g.tableId && g.id !== active.id);
            const defaultX = 80;
            const defaultY = 100 + existingUnassigned.length * 70;
            moveGuestOnCanvas(active.id as string, defaultX, defaultY);
          }
          // Unassign from table
          assignGuestToTable(active.id as string, undefined);
        }
      }
    }
  };

  const handleAddTable = (shape: TableShape) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = (rect.width / 2 - canvas.panX) / canvas.zoom;
      const centerY = (rect.height / 2 - canvas.panY) / canvas.zoom;
      addTable(shape, centerX, centerY);
      setShowAddDropdown(false);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      selectTable(null);
    }
  };

  const handleAddGuest = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const centerX = (rect.width / 2 - canvas.panX) / canvas.zoom;
      const centerY = (rect.height / 2 - canvas.panY) / canvas.zoom;
      addQuickGuest(centerX, centerY);
    }
  };

  const goToTable = (table: Table) => {
    // Center viewport on table
    const viewportWidth = window.innerWidth - 280;
    const viewportHeight = window.innerHeight - 120;

    const newPanX = viewportWidth / 2 - (table.x + table.width / 2) * canvas.zoom;
    const newPanY = viewportHeight / 2 - (table.y + table.height / 2) * canvas.zoom;

    setPan(newPanX, newPanY);
    selectTable(table.id);
    setShowTableDropdown(false);
  };

  const draggedGuest = draggedGuestId
    ? event.guests.find((g) => g.id === draggedGuestId)
    : null;

  return (
    <div className="canvas-container">
      <div className="canvas-toolbar">
        {/* Add Table Dropdown */}
        <div className="toolbar-group add-dropdown" ref={addDropdownRef}>
          <button
            onClick={() => setShowAddDropdown(!showAddDropdown)}
            className="add-button"
            title="Add Table"
          >
            + Add Table
          </button>
          {showAddDropdown && (
            <div className="dropdown-menu add-dropdown-menu">
              <button onClick={() => handleAddTable('round')}>
                <span className="table-shape-icon">⭕</span> Round Table
              </button>
              <button onClick={() => handleAddTable('rectangle')}>
                <span className="table-shape-icon">▭</span> Rectangle Table
              </button>
              <button onClick={() => handleAddTable('square')}>
                <span className="table-shape-icon">⬜</span> Square Table
              </button>
              <button onClick={() => handleAddTable('oval')}>
                <span className="table-shape-icon">⬭</span> Oval Table
              </button>
              <button onClick={() => handleAddTable('half-round')}>
                <span className="table-shape-icon">◗</span> Half-Round Table
              </button>
              <button onClick={() => handleAddTable('serpentine')}>
                <span className="table-shape-icon">〰️</span> Buffet Table
              </button>
            </div>
          )}
        </div>

        {/* Add Guest Button */}
        <button
          onClick={handleAddGuest}
          className="add-guest-button"
          title="Add Guest"
        >
          + Add Guest
        </button>

        {/* Go to Table dropdown */}
        {event.tables.length > 0 && (
          <div className="toolbar-group table-nav-dropdown" ref={tableDropdownRef}>
            <button
              onClick={() => setShowTableDropdown(!showTableDropdown)}
              title="Go to Table"
            >
              Go to Table
            </button>
            {showTableDropdown && (
              <div className="dropdown-menu table-dropdown-menu">
                {event.tables.map(table => {
                  const guestCount = event.guests.filter(g => g.tableId === table.id).length;
                  const isFull = guestCount >= table.capacity;
                  return (
                    <button
                      key={table.id}
                      onClick={() => goToTable(table)}
                      className={`table-nav-item ${isFull ? 'full' : ''}`}
                    >
                      <span className="table-nav-name">{table.name}</span>
                      <span className="table-nav-count">{guestCount}/{table.capacity}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className="toolbar-spacer" />

        {/* Zoom controls */}
        <div className="toolbar-group zoom-controls">
          <button onClick={() => setZoom(canvas.zoom - 0.1)} title="Zoom Out">−</button>
          <span className="zoom-display">{Math.round(canvas.zoom * 100)}%</span>
          <button onClick={() => setZoom(canvas.zoom + 0.1)} title="Zoom In">+</button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
      >
        <div
          ref={canvasRef}
          className="canvas"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          style={{ cursor: isPanning ? 'grabbing' : 'default' }}
        >
          <div
            className="canvas-content"
            style={{
              transform: `translate(${canvas.panX}px, ${canvas.panY}px) scale(${canvas.zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {event.tables.map((table) => (
              <TableComponent
                key={table.id}
                table={table}
                guests={event.guests.filter((g) => g.tableId === table.id)}
                isSelected={canvas.selectedTableId === table.id}
                isSnapTarget={nearbyTableId === table.id}
              />
            ))}

            {/* Unassigned guests on canvas */}
            {event.guests
              .filter((g) => !g.tableId && g.canvasX !== undefined && g.canvasY !== undefined)
              .map((guest) => (
                <CanvasGuest
                  key={guest.id}
                  guest={guest}
                  isSelected={canvas.selectedGuestId === guest.id}
                  isNearTable={nearbyTableId !== null && draggedGuestId === guest.id}
                  onSelect={() => selectGuest(guest.id)}
                />
              ))}

            {/* Alignment guides */}
            {alignmentGuides.map((guide, index) => (
              <div
                key={`guide-${index}`}
                className={`alignment-guide alignment-guide-${guide.type}`}
                style={
                  guide.type === 'horizontal'
                    ? {
                        top: guide.position,
                        left: guide.start,
                        width: guide.end - guide.start,
                      }
                    : {
                        left: guide.position,
                        top: guide.start,
                        height: guide.end - guide.start,
                      }
                }
              />
            ))}
          </div>

          {/* Grid overlay */}
          {canvasPrefs.showGrid && (
            <div
              className="canvas-grid-overlay"
              style={{
                backgroundSize: `${canvasPrefs.gridSize * canvas.zoom}px ${canvasPrefs.gridSize * canvas.zoom}px`,
                backgroundPosition: `${canvas.panX}px ${canvas.panY}px`,
              }}
            />
          )}

          {event.tables.length === 0 && event.guests.filter((g) => !g.tableId).length === 0 && (
            <div className="canvas-empty">
              <p>No tables yet!</p>
              <p>Click the buttons above to add tables to your floor plan.</p>
            </div>
          )}
        </div>

        <DragOverlay>
          {draggedGuest && (
            dragType === 'canvas-guest' || dragType === 'seated-guest' ? (
              <div className="canvas-guest-overlay">
                <div className="canvas-guest-circle">
                  <span className="initials">
                    {draggedGuest.name
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2)}
                  </span>
                </div>
              </div>
            ) : (
              <GuestChip guest={draggedGuest} isDragging />
            )
          )}
        </DragOverlay>
      </DndContext>

      <CanvasMinimap />
      <CanvasSearch />
      <TablePropertiesPanel />
    </div>
  );
}
