import { useEffect } from "react";
import { CharacterSummary } from "@rathena/shared";

export type NavTab =
  | "CHARACTER"
  | "FINANCE"
  | "LEISURE"
  | "PROGRESSION"
  | "BOUNTIES"
  | "GACHA"
  | "LOGIN"
  | "REGISTER";

interface UseKeyboardShortcutsOptions {
  onNavigateTab: (tab: NavTab) => void;
  onOpenSearch: () => void;
  onSync: () => void;
  onToggleShortcuts: () => void;
  characters?: CharacterSummary[];
  selectedCharId?: number | null;
  onSelectChar?: (charId: number) => void;
}

export const useKeyboardShortcuts = ({
  onNavigateTab,
  onOpenSearch,
  onSync,
  onToggleShortcuts,
  characters = [],
  selectedCharId,
  onSelectChar,
}: UseKeyboardShortcutsOptions) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement;
      const isInput =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl instanceof HTMLSelectElement ||
        activeEl?.getAttribute("contenteditable") === "true";

      // Global Escape handling
      if (e.key === "Escape") {
        if (isInput && activeEl instanceof HTMLElement) {
          activeEl.blur();
        }
        return;
      }

      // If user is currently typing inside an input/textarea, ignore global single-key shortcuts
      if (isInput) {
        return;
      }

      // 1. Search Shortcut: '/' or 'Ctrl+K' / 'Cmd+K'
      if (e.key === "/" || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")) {
        e.preventDefault();
        onOpenSearch();
        return;
      }

      // 2. Keyboard Shortcuts Cheat Sheet: '?' (Shift + /)
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        onToggleShortcuts();
        return;
      }

      // 3. Sync / Refresh Realm: 'r' or 'R' (without Ctrl/Cmd to avoid interfering with browser reload)
      if ((e.key === "r" || e.key === "R") && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        onSync();
        return;
      }

      // 4. Tab Navigation Hotkeys (1-6 or Alt+1-6)
      if (!e.ctrlKey && !e.metaKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            onNavigateTab("CHARACTER");
            return;
          case "2":
            e.preventDefault();
            onNavigateTab("FINANCE");
            return;
          case "3":
            e.preventDefault();
            onNavigateTab("LEISURE");
            return;
          case "4":
            e.preventDefault();
            onNavigateTab("PROGRESSION");
            return;
          case "5":
            e.preventDefault();
            onNavigateTab("BOUNTIES");
            return;
          case "6":
            e.preventDefault();
            onNavigateTab("GACHA");
            return;
        }
      }

      // 5. Hero Cycling: 'C', ']', '['
      if (characters.length > 1 && onSelectChar) {
        if (e.key === "c" || e.key === "C" || e.key === "]") {
          e.preventDefault();
          const currentIndex = characters.findIndex((c) => c.charId === selectedCharId);
          const nextIndex = (currentIndex + 1) % characters.length;
          onSelectChar(characters[nextIndex].charId);
          return;
        }
        if (e.key === "[") {
          e.preventDefault();
          const currentIndex = characters.findIndex((c) => c.charId === selectedCharId);
          const prevIndex = (currentIndex - 1 + characters.length) % characters.length;
          onSelectChar(characters[prevIndex].charId);
          return;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    onNavigateTab,
    onOpenSearch,
    onSync,
    onToggleShortcuts,
    characters,
    selectedCharId,
    onSelectChar,
  ]);
};
