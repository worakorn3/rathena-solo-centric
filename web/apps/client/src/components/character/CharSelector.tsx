import React, { useState, useEffect, useRef } from "react";
import { CharacterSummary } from "@rathena/shared";
import { Users, Search, ChevronDown, Compass, MapPin } from "lucide-react";
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
    return (
      <div className="bento-card p-3 shrink-0 text-center text-xs font-medium text-muted">
        No characters found on this account.
      </div>
    );
  }

  return (
    <div className="bento-card p-2.5 sm:p-3 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 relative z-40">
      {/* Left: Active Hero Dropdown Trigger */}
      <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-start min-w-0" ref={dropdownRef}>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5 shrink-0">
          <Users className="w-3.5 h-3.5 text-accent" /> Roster:
        </span>

        {/* ACTIVE CHARACTER TRIGGER PILL */}
        <div className="relative flex-1 sm:flex-initial min-w-0">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-1.5 sm:gap-2.5 px-2.5 py-1.5 rounded-lg bg-surface2 border border-accent/60 text-accent font-bold text-xs shadow-sm hover:border-accent transition-all group focus:outline-none min-w-0"
            aria-expanded={isOpen}
            aria-label="Select character from roster"
          >
            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  selectedChar?.online
                    ? "bg-success shadow-[0_0_8px_#4ade80]"
                    : "bg-accent animate-pulse"
                }`}
              />
              <span className="text-primary font-bold truncate max-w-[100px] xs:max-w-[130px] sm:max-w-none">
                {selectedChar?.name}
              </span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-surface border border-border text-primary shrink-0">
                {selectedChar?.className}
              </span>
              <span className="text-[10px] font-mono text-muted shrink-0">
                (Lv {selectedChar?.baseLevel}/{selectedChar?.jobLevel})
              </span>
              <span className="hidden sm:inline-block text-[9px] font-mono font-semibold bg-background px-1.5 py-0.2 rounded text-muted border border-border ml-0.5 shrink-0">
                {characters.length} Heroes
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-muted group-hover:text-accent transition-transform duration-200 shrink-0 ml-1 ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* FLOATING DROPDOWN CARD MENU */}
          {isOpen && (
            <div className="absolute left-0 top-full mt-2 w-[calc(100vw-2.5rem)] max-w-sm sm:w-96 bento-card bg-surface p-3 shadow-2xl border-accent/40 rounded-xl flex flex-col gap-2 z-50 animate-in fade-in duration-150">
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
                  <span className="text-accent flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent" />
                    {offlineCount} Resting
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
                    const isOffline = !char.online;
                    return (
                      <button
                        key={char.charId}
                        type="button"
                        onClick={() => {
                          onSelect(char.charId);
                          setIsOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-all border ${
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
                                : isOffline
                                ? "bg-muted"
                                : "bg-success"
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
                          {isOffline ? (
                            <span className="text-accent text-[9px] flex items-center justify-end gap-0.5">
                              <Compass className="w-2.5 h-2.5" /> Resting
                            </span>
                          ) : (
                            <span className="text-success text-[9px]">
                              ● Online
                            </span>
                          )}
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
      </div>

      {/* Center: Character Quick Meta & Location */}
      {selectedChar && (
        <div className="hidden md:flex items-center gap-5 text-xs text-muted">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-muted">
              Location:
            </span>
            <span className="font-mono text-primary font-semibold flex items-center gap-1">
              <MapPin className="w-3 h-3 text-info" /> {selectedChar.lastMap}
            </span>
          </div>
          <div className="border-l border-border pl-4 flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold text-muted">
              Death Penalty:
            </span>
            <span className="font-mono text-success font-semibold">
              0.5% (Solo)
            </span>
          </div>
        </div>
      )}

      {/* Right: Liquid Zeny & Offline Status Badge */}
      {selectedChar && (
        <div className="flex items-center justify-between md:justify-end gap-2 sm:gap-3 w-full md:w-auto border-t md:border-t-0 border-border/40 pt-2 md:pt-0">
          <div className="flex items-center gap-1.5 sm:gap-2 bg-surface2/60 border border-border px-2.5 sm:px-3 py-1 rounded-md text-xs">
            <span className="text-[10px] font-bold text-muted uppercase">
              Zeny:
            </span>
            <span className="font-mono font-bold text-accent">
              {formatZeny(selectedChar.zeny)} Z
            </span>
          </div>

          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface2 text-muted border border-border text-[10px] font-bold shrink-0">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                selectedChar.online ? "bg-success" : "bg-muted"
              }`}
            />
            {selectedChar.online ? (
              "Online"
            ) : (
              <>
                <span className="sm:hidden">Offline (Resting)</span>
                <span className="hidden sm:inline">Offline (Expedition Active)</span>
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
};
