import React, { useEffect } from "react";
import { X, Keyboard, Compass, Users, Sparkles } from "lucide-react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: "Navigation Cockpit",
      icon: <Compass className="w-4 h-4 text-accent" />,
      items: [
        { keys: ["1"], label: "Hero & Equipment Paperdoll" },
        { keys: ["2"], label: "Financial HQ & Stock Market" },
        { keys: ["3"], label: "Leisure & LoFi Audio Lounge" },
        { keys: ["4"], label: "Hunting Journal & Milestones" },
        { keys: ["5"], label: "Daily Junk Trader Bounties" },
        { keys: ["6"], label: "Midgard Egg Spinner Gacha Altar" },
      ],
    },
    {
      title: "Hero & Tools",
      icon: <Users className="w-4 h-4 text-info" />,
      items: [
        { keys: ["[", "]"], label: "Cycle Previous / Next Character" },
        { keys: ["C"], label: "Switch to Next Character in Roster" },
        { keys: ["/"], label: "Quick Armory Search" },
        { keys: ["Ctrl", "K"], label: "Global Command / Search" },
        { keys: ["R"], label: "Sync Live Realm Data" },
        { keys: ["M"], label: "Toggle LoFi Radio Play / Pause" },
        { keys: ["ESC"], label: "Close Modal / Dropdown" },
      ],
    },
    {
      title: "Cockpit Help",
      icon: <Sparkles className="w-4 h-4 text-warning" />,
      items: [
        { keys: ["?"], label: "Toggle This Keyboard Shortcuts HUD" },
        { keys: ["Alt", "1-6"], label: "Direct Tab Switch Override" },
      ],
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fadeIn">
      {/* Backdrop Dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="bento-card w-full max-w-xl bg-surface border border-accent/40 shadow-2xl p-5 sm:p-6 relative z-10 rounded-2xl flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/25 flex items-center justify-center">
              <Keyboard className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h2 className="text-base font-bold text-primary flex items-center gap-2">
                Cockpit Keyboard Shortcuts
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent/15 text-accent border border-accent/30">
                  HUD
                </span>
              </h2>
              <p className="text-xs text-muted">
                Navigate the companion portal at maximum speed using hotkeys.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface2 transition-colors cursor-pointer"
            title="Close (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcut Groups */}
        <div className="flex flex-col gap-4">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-wider">
                {group.icon}
                <span>{group.title}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {group.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-surface2/40 border border-border/60 text-xs"
                  >
                    <span className="text-primary/90 font-medium">{item.label}</span>
                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {item.keys.map((k, kidx) => (
                        <kbd
                          key={kidx}
                          className="px-1.5 py-0.5 min-w-[20px] text-center font-mono font-bold text-[10px] rounded bg-surface border border-border text-accent shadow-sm"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted font-mono">
          <span>Shortcuts disabled while typing in text inputs</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-surface2 hover:bg-surface2/80 text-primary font-bold text-xs border border-border transition-colors cursor-pointer"
          >
            Got it (ESC)
          </button>
        </div>
      </div>
    </div>
  );
};
