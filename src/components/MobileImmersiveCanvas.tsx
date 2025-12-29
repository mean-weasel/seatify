import { useState, useRef, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { TransientTopBar } from './TransientTopBar';
import { BottomControlSheet } from './BottomControlSheet';
import { useStore } from '../store/useStore';
import './MobileImmersiveCanvas.css';

interface MobileImmersiveCanvasProps {
  children: ReactNode;
  showRelationships: boolean;
  onToggleRelationships: () => void;
  onShowImport: () => void;
  isGuestPanelOpen?: boolean;
  onOpenGuestPanel?: () => void;
  onCloseGuestPanel?: () => void;
}

/**
 * Wraps the canvas in immersive mode for mobile devices.
 * Provides gesture-based UI access:
 * - Swipe DOWN: Show top navigation bar
 * - Swipe UP: Show bottom control sheet
 * - Swipe LEFT (from right): Open guest panel (handled by MobileGuestPanel)
 */
export function MobileImmersiveCanvas({
  children,
  showRelationships,
  onToggleRelationships,
  onShowImport,
  isGuestPanelOpen = false,
  onOpenGuestPanel,
  onCloseGuestPanel,
}: MobileImmersiveCanvasProps) {
  const { hasSeenImmersiveHint, setHasSeenImmersiveHint } = useStore();

  const [topBarVisible, setTopBarVisible] = useState(false);
  const [bottomSheetVisible, setBottomSheetVisible] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Single drawer logic: close other drawers when one opens
  const openTopBar = useCallback(() => {
    setTopBarVisible(true);
    setBottomSheetVisible(false);
    onCloseGuestPanel?.();
    setShowHint(false);
  }, [onCloseGuestPanel]);

  const openBottomSheet = useCallback(() => {
    setBottomSheetVisible(true);
    setTopBarVisible(false);
    onCloseGuestPanel?.();
    setShowHint(false);
  }, [onCloseGuestPanel]);

  const openGuestPanel = useCallback(() => {
    onOpenGuestPanel?.();
    setTopBarVisible(false);
    setBottomSheetVisible(false);
    setShowHint(false);
  }, [onOpenGuestPanel]);

  // Touch tracking
  const touchStartY = useRef(0);
  const touchStartX = useRef(0);

  // Show hint for first-time users
  useEffect(() => {
    if (!hasSeenImmersiveHint) {
      const timer = setTimeout(() => {
        setShowHint(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenImmersiveHint]);

  // Auto-hide hint after a few seconds
  useEffect(() => {
    if (showHint) {
      const timer = setTimeout(() => {
        setShowHint(false);
        setHasSeenImmersiveHint();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showHint, setHasSeenImmersiveHint]);

  // Document-level touch handlers for gesture detection
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      const deltaY = touchEndY - touchStartY.current;
      const deltaX = touchEndX - touchStartX.current;

      // Minimum swipe distance
      const minSwipe = 50;

      // Check if primarily vertical or horizontal swipe
      const isVertical = Math.abs(deltaY) > Math.abs(deltaX);

      // Handle dismissal gestures when panels are open
      if (topBarVisible && isVertical && deltaY < -minSwipe) {
        // Swipe UP to dismiss top bar
        setTopBarVisible(false);
        return;
      }

      if (bottomSheetVisible && isVertical && deltaY > minSwipe) {
        // Swipe DOWN to dismiss bottom sheet
        setBottomSheetVisible(false);
        return;
      }

      if (isGuestPanelOpen && !isVertical && deltaX > minSwipe) {
        // Swipe RIGHT to dismiss guest panel
        onCloseGuestPanel?.();
        return;
      }

      // Don't process opening gestures if panels are already open
      if (topBarVisible || bottomSheetVisible || isGuestPanelOpen) {
        return;
      }

      // Ignore touches that started on interactive elements (only for opening gestures)
      const target = e.target as HTMLElement;
      const isOnInteractiveElement =
        target.closest('.mobile-fab') ||
        target.closest('.corner-indicator') ||
        target.closest('.transient-top-bar') ||
        target.closest('.bottom-control-sheet') ||
        target.closest('.mobile-guest-panel') ||
        target.closest('button') ||
        target.closest('input');

      if (isOnInteractiveElement) {
        return;
      }

      if (isVertical) {
        // Swipe DOWN = show top bar
        if (deltaY > minSwipe) {
          openTopBar();
          return;
        }

        // Swipe UP = show bottom sheet
        if (deltaY < -minSwipe) {
          openBottomSheet();
          return;
        }
      } else {
        // Swipe LEFT (from right) = open guest panel
        if (deltaX < -minSwipe && onOpenGuestPanel) {
          openGuestPanel();
          return;
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [topBarVisible, bottomSheetVisible, isGuestPanelOpen, onOpenGuestPanel, onCloseGuestPanel, openTopBar, openBottomSheet, openGuestPanel]);

  // Close all overlays
  const closeAll = () => {
    setTopBarVisible(false);
    setBottomSheetVisible(false);
  };

  // Corner indicator tap - show top bar (single drawer only)
  const handleCornerTap = () => {
    openTopBar();
    setHasSeenImmersiveHint();
  };

  return (
    <div className="mobile-immersive-canvas">
      {/* Main canvas content */}
      {children}

      {/* Transient Top Bar */}
      <TransientTopBar
        isVisible={topBarVisible}
        onClose={closeAll}
        onOpenSettings={openBottomSheet}
      />

      {/* Bottom Control Sheet */}
      <BottomControlSheet
        isVisible={bottomSheetVisible}
        onClose={closeAll}
        showRelationships={showRelationships}
        onToggleRelationships={onToggleRelationships}
        onShowImport={onShowImport}
      />

      {/* Corner Indicator - always visible */}
      <button
        className="corner-indicator"
        onClick={handleCornerTap}
        aria-label="Show controls"
      >
        <span className="indicator-dot" />
      </button>

      {/* First-time hint */}
      {showHint && (
        <div className="immersive-hint">
          <div className="hint-content">
            <p><strong>Swipe to access controls</strong></p>
            <p>↓ Down for nav • ↑ Up for tools</p>
          </div>
        </div>
      )}

      {/* Edge hint indicators */}
      <div className="edge-hint top" />
      <div className="edge-hint bottom" />
    </div>
  );
}
