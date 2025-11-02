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
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

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
  const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);

  if (shortcut.ctrlKey) modifiers.push(isMac ? '⌘' : 'Ctrl');
  if (shortcut.altKey) modifiers.push(isMac ? '⌥' : 'Alt');
  if (shortcut.shiftKey) modifiers.push('⇧');
  if (shortcut.metaKey) modifiers.push('⌘');

  modifiers.push(shortcut.key.toUpperCase());

  return modifiers.join(isMac ? '' : '+');
}

export const COMMON_SHORTCUTS = {
  NEW_PATIENT: { key: 'n', ctrlKey: true, description: 'Nouveau patient' },
  SEARCH: { key: 'k', ctrlKey: true, description: 'Rechercher' },
  SAVE: { key: 's', ctrlKey: true, description: 'Enregistrer' },
  CANCEL: { key: 'Escape', description: 'Annuler/Fermer' },
  HELP: { key: '?', shiftKey: true, description: 'Aide raccourcis clavier' },
  NEW_APPOINTMENT: { key: 'a', ctrlKey: true, description: 'Nouveau rendez-vous' },
  EXPORT: { key: 'e', ctrlKey: true, description: 'Exporter CSV' },
  IMPORT: { key: 'i', ctrlKey: true, description: 'Importer CSV' },
} as const;
