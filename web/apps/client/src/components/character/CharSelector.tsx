import React, { useState, useEffect, useRef } from "react";
import { CharacterSummary } from "@rathena/shared";
import { Search, ChevronDown, MapPin, Coins } from "lucide-react";
import { formatZeny } from "../../lib/assets";

interface CharSelectorProps {
  characters: CharacterSummary[];
  selectedCharId: number | null;
  onSelect: (charId: number) => void;
}

export const CharSelector: React.FC<CharSelectorProps> = ({
  characters,
  selectedCharId,
  onSelect,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedChar =
    characters.find((c) => c.charId === selectedCharId) || characters[0];

  const onlineCount = characters.filter((c) => c.online).length;
  const offlineCount = characters.length - onlineCount;

  // Filtered characters
  const filteredChars = characters.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase().trim()) ||
      c.className.toLowerCase().includes(search.toLowerCase().trim())
  );

  // Close on Escape or Click Outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) setIsOpen(false);
    };
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.addEventListener("mousedown", handleClickOutside);
      searchInputRef.current?.focus();
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  if (characters.length === 0) {
    return null;
  }

  const isOnline = Boolean(selectedChar?.online);

  return (
    <div className="bento-card p-2 sm:px-3 sm:py-2 shrink-0 flex items-center justify-between gap-3 relative z-40">
      {/* Left: Active Hero Trigger (Identity, Class, Level & Location) */}
      <div className="relative min-w-0" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 sm:gap-2.5 p-1 sm:px-1.5 rounded-lg hover:bg-surface2/80 transition-all text-left group focus:outline-none cursor-pointer"
          aria-expanded={isOpen}
          aria-label="Switch Active Character"
        >
          {/* Avatar with Status Dot */}
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-lg bg-surface2 border border-border/80 flex items-center justify-center font-bold text-xs text-accent font-mono group-hover:border-accent/60 transition-colors">
              {selectedChar?.name ? selectedChar.name.charAt(0).toUpperCase() : "H"}
            </div>
            <span
              className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-surface ${
                isOnline
                  ? "bg-success shadow-[0_0_6px_#4ade80]"
                  : "bg-muted"
              }`}
              title={isOnline ? "Online In-Game" : "Offline"}
            />
          </div>

          {/* Hero Name & Job / Level / Location Details */}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 leading-tight">
              <span className="font-bold text-xs sm:text-sm text-primary group-hover:text-accent transition-colors truncate max-w-[120px] xs:max-w-[160px] sm:max-w-[220px]">
                {selectedChar?.name}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-muted/60 group-hover:text-accent transition-transform duration-200 shrink-0 ${
                  isOpen ? "rotate-180 text-accent" : ""
                }`}
              />
            </div>
            <div className="text-[10px] font-mono text-muted flex items-center gap-1.5 mt-0.5 leading-none">
              <span className="text-primary/90 font-medium">{selectedChar?.className}</span>
              <span className="opacity-40">•</span>
              <span>Lv {selectedChar?.baseLevel}/{selectedChar?.jobLevel}</span>
              {selectedChar?.lastMap && (
                <>
                  <span className="opacity-40 hidden xs:inline">•</span>
                  <span className="hidden xs:inline-flex items-center gap-0.5 text-muted/80">
                    <MapPin className="w-2.5 h-2.5 text-info inline shrink-0" />
                    <span>{selectedChar.lastMap}</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </button>

        {/* FLOATING DROPDOWN CARD MENU */}
        {isOpen && (
          <div className="absolute left-0 top-full mt-2 w-[calc(100vw-2.5rem)] max-w-sm sm:w-96 bento-card bg-surface p-3 shadow-2xl border-accent/40 rounded-xl flex flex-col gap-2 z-50 animate-fadeIn">
            {/* Search Bar */}
            <div className="flex items-center gap-2 bg-surface2 px-2.5 py-1.5 rounded-lg border border-border">
              <Search className="w-3.5 h-3.5 text-muted shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search heroes by name or job..."
                className="bg-transparent text-xs text-primary placeholder:text-muted/60 focus:outline-none w-full font-sans"
              />
              <span className="text-[9px] text-muted font-mono bg-background px-1 py-0.5 rounded border border-border/40">
                ESC
              </span>
            </div>

            {/* Matrix Status Ticker */}
            <div className="flex items-center justify-between text-[10px] font-bold text-muted border-b border-border pb-1.5 px-0.5">
              <span>HERO MATRIX ({characters.length})</span>
              <div className="flex gap-2 text-[9px] font-mono">
                <span className="text-success flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                  {onlineCount} Online
                </span>
                <span className="text-muted flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                  {offlineCount} Offline
                </span>
              </div>
            </div>

            {/* Character Cards Scroll List */}
            <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1">
              {filteredChars.length === 0 ? (
                <div className="p-3 text-center text-xs text-muted">
                  No heroes matching &ldquo;{search}&rdquo;
                </div>
              ) : (
                filteredChars.map((char) => {
                  const isSelected = char.charId === selectedCharId;
                  const charIsOnline = Boolean(char.online);
                  return (
                    <button
                      key={char.charId}
                      type="button"
                      onClick={() => {
                        onSelect(char.charId);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all border cursor-pointer ${
                        isSelected
                          ? "bg-surface2 border-accent/60 shadow-sm"
                          : "bg-surface2/30 hover:bg-surface2/70 border-border/40 text-muted hover:text-primary"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${
                            isSelected
                              ? "bg-accent"
                              : charIsOnline
                              ? "bg-success"
                              : "bg-muted"
                          }`}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`font-bold text-xs truncate ${
                                isSelected ? "text-accent" : "text-primary"
                              }`}
                            >
                              {char.name}
                            </span>
                            <span className="text-[9px] font-mono px-1 rounded border bg-surface text-muted border-border">
                              {char.className}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted font-mono truncate flex items-center gap-1 mt-0.5">
                            <span>
                              Lv {char.baseLevel}/{char.jobLevel}
                            </span>
                            <span>•</span>
                            <span className="truncate">{char.lastMap}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0 font-mono text-[10px]">
                        <div className="font-bold text-accent">
                          {formatZeny(char.zeny)} Z
                        </div>
                        <span
                          className={`text-[9px] ${
                            charIsOnline ? "text-success" : "text-muted/60"
                          }`}
                        >
                          {charIsOnline ? "● Online" : "○ Offline"}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="pt-1.5 border-t border-border flex justify-between items-center text-[10px] text-muted font-mono">
              <span>Select active hero</span>
              <span className="text-accent font-semibold">1-Click Switch</span>
            </div>
          </div>
        )}
      </div>

      {/* Right: Character Liquid Funds (Single Clean Counter) */}
      {selectedChar && (
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-surface2/50 border border-border/70 text-xs font-mono shrink-0">
          <Coins className="w-3.5 h-3.5 text-accent shrink-0" />
          <span className="font-bold text-accent">
            {formatZeny(selectedChar.zeny)} <span className="text-[10px] text-muted font-sans font-normal">Z</span>
          </span>
        </div>
      )}
    </div>
  );
};
