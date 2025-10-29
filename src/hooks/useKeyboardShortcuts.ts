import { useEffect } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: KeyboardShortcut[], enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const matchingShortcut = shortcuts.find((shortcut) => {
        const eventKey = event.key?.toLowerCase() || '';
        const shortcutKey = shortcut.key?.toLowerCase() || '';

        return (
          eventKey === shortcutKey &&
          !!event.ctrlKey === !!shortcut.ctrlKey &&
          !!event.altKey === !!shortcut.altKey &&
          !!event.shiftKey === !!shortcut.shiftKey &&
          !!event.metaKey === !!shortcut.metaKey
        );
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, enabled]);
}

export function getShortcutLabel(shortcut: KeyboardShortcut): string {
  const modifiers: string[] = [];

  if (shortcut.ctrlKey) modifiers.push('Ctrl');
  if (shortcut.altKey) modifiers.push('Alt');
  if (shortcut.shiftKey) modifiers.push('Shift');
  if (shortcut.metaKey) modifiers.push('Cmd');

  modifiers.push(shortcut.key.toUpperCase());

  return modifiers.join('+');
}
