/**
 * ============================================
 * USE KEYBOARD SHORTCUTS HOOK
 * ============================================
 *
 * Global keyboard shortcuts manager for the application.
 * Provides consistent keyboard navigation and actions.
 *
 * @author Gold Factory Dev Team
 * @version 1.0.0 - Phase 12
 */

import { useEffect, useCallback, useRef } from 'react';

// ============================================
// TYPES
// ============================================

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  description: string;
  action: (event: KeyboardEvent) => void;
  preventDefault?: boolean;
  enabled?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
  enableOnInputs?: boolean; // Allow shortcuts when input/textarea focused
}

// ============================================
// HOOK
// ============================================

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions) {
  const { shortcuts, enabled = true, enableOnInputs = false } = options;
  const shortcutsRef = useRef<KeyboardShortcut[]>(shortcuts);

  // Update ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't handle if globally disabled
      if (!enabled) return;

      // Check if user is typing in an input/textarea/contenteditable
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Skip if typing in input and shortcuts not enabled on inputs
      if (isInput && !enableOnInputs) {
        // Exception: Allow ESC to work in inputs to blur/close
        if (event.key === 'Escape') {
          // Allow ESC to propagate
        } else {
          return;
        }
      }

      // Find matching shortcut
      const matchedShortcut = shortcutsRef.current.find((shortcut) => {
        if (shortcut.enabled === false) return false;

        // Check key match (case-insensitive for letters)
        const keyMatch =
          event.key.toLowerCase() === shortcut.key.toLowerCase() ||
          event.code.toLowerCase() === shortcut.key.toLowerCase();

        if (!keyMatch) return false;

        // Check modifiers
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        return ctrlMatch && shiftMatch && altMatch;
      });

      // Execute matched shortcut
      if (matchedShortcut) {
        if (matchedShortcut.preventDefault !== false) {
          event.preventDefault();
        }
        matchedShortcut.action(event);
      }
    },
    [enabled, enableOnInputs]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, handleKeyDown]);

  return {
    shortcuts: shortcutsRef.current,
  };
}

// ============================================
// COMMON SHORTCUTS PRESETS
// ============================================

export const createSaveShortcut = (onSave: () => void): KeyboardShortcut => ({
  key: 's',
  ctrl: true,
  description: 'Save',
  action: onSave,
  preventDefault: true,
});

export const createSubmitShortcut = (onSubmit: () => void): KeyboardShortcut => ({
  key: 'Enter',
  ctrl: true,
  description: 'Submit',
  action: onSubmit,
  preventDefault: true,
});

export const createSearchShortcut = (onSearch: () => void): KeyboardShortcut => ({
  key: '/',
  description: 'Focus search',
  action: (event) => {
    // Only trigger if not already in an input
    const target = event.target as HTMLElement;
    const isInput =
      target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
    if (!isInput) {
      onSearch();
    }
  },
  preventDefault: true,
});

export const createCommandPaletteShortcut = (onOpen: () => void): KeyboardShortcut => ({
  key: 'k',
  ctrl: true,
  description: 'Open command palette',
  action: onOpen,
  preventDefault: true,
});

export const createEscapeShortcut = (onEscape: () => void): KeyboardShortcut => ({
  key: 'Escape',
  description: 'Close/Cancel',
  action: onEscape,
  preventDefault: false, // Allow default ESC behavior
});

export const createRefreshShortcut = (onRefresh: () => void): KeyboardShortcut => ({
  key: 'r',
  ctrl: true,
  description: 'Refresh',
  action: onRefresh,
  preventDefault: true,
});

// ============================================
// HELPER: Show shortcuts hint
// ============================================

export function getShortcutDisplay(shortcut: KeyboardShortcut): string {
  const parts: string[] = [];

  if (shortcut.ctrl) parts.push('Ctrl');
  if (shortcut.shift) parts.push('Shift');
  if (shortcut.alt) parts.push('Alt');
  if (shortcut.meta) parts.push('⌘');

  // Format key
  let key = shortcut.key;
  if (key === 'Escape') key = 'ESC';
  if (key === 'Enter') key = '↵';
  if (key === ' ') key = 'Space';

  parts.push(key.toUpperCase());

  return parts.join(' + ');
}
