import React, { useState, useMemo, useRef, useEffect } from "react";
import { MobNames, MobTypes, MonsterCategory } from "@rathena/shared";
import { getMobSpriteUrl } from "../../lib/assets";
import { Search, Crown, Swords, Skull, X, Check, ChevronsUpDown } from "lucide-react";

interface MonsterOption {
  id: number;
  name: string;
  category: MonsterCategory;
}

interface MonsterComboboxProps {
  selectedMobId: number;
  onSelect: (mobId: number, mobName: string, category: MonsterCategory) => void;
  disabled?: boolean;
}

export const MonsterCombobox: React.FC<MonsterComboboxProps> = ({
  selectedMobId,
  onSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<"ALL" | MonsterCategory>("ALL");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse all mobs once
  const allMobs: MonsterOption[] = useMemo(() => {
    const list: MonsterOption[] = [];
    for (const [idStr, name] of Object.entries(MobNames)) {
      const id = Number(idStr);
      if (!isNaN(id) && id > 0) {
        list.push({
          id,
          name,
          category: MobTypes[id] || "NORMAL",
        });
      }
    }
    // Sort by ID ascending
    return list.sort((a, b) => a.id - b.id);
  }, []);

  // Filtered mob list based on search and category
  const filteredMobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    let result = allMobs;

    if (categoryFilter !== "ALL") {
      result = result.filter((m) => m.category === categoryFilter);
    }

    if (q) {
      result = result.filter(
        (m) => m.name.toLowerCase().includes(q) || String(m.id).includes(q)
      );
    }

    return result.slice(0, 40); // Slice top 40 for optimal rendering performance
  }, [allMobs, searchQuery, categoryFilter]);

  const selectedMob = useMemo(() => {
    if (!selectedMobId) return null;
    return (
      allMobs.find((m) => m.id === selectedMobId) || {
        id: selectedMobId,
        name: MobNames[selectedMobId] || `Monster #${selectedMobId}`,
        category: MobTypes[selectedMobId] || ("NORMAL" as MonsterCategory),
      }
    );
  }, [allMobs, selectedMobId]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleOpen = () => {
    if (disabled) return;
    setIsOpen(true);
    setSearchQuery("");
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleSelectMob = (mob: MonsterOption) => {
    onSelect(mob.id, mob.name, mob.category);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Selected Box / Trigger */}
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className="w-full flex items-center justify-between gap-2 bg-surface border border-border hover:border-accent/60 rounded-xl px-3 py-2 text-left transition-colors focus:outline-none focus:border-accent disabled:opacity-50"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-surface2 border border-border flex items-center justify-center shrink-0 overflow-hidden">
            {selectedMob ? (
              <img
                src={getMobSpriteUrl(selectedMob.id)}
                alt={selectedMob.name}
                className="w-7 h-7 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />
            ) : (
              <Skull className="w-4 h-4 text-muted" />
            )}
          </div>
          <div className="min-w-0">
            {selectedMob ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold text-xs text-primary truncate">
                  {selectedMob.name}
                </span>
                <span className="text-[10px] font-mono text-muted">
                  #{selectedMob.id}
                </span>
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                    selectedMob.category === "MVP"
                      ? "bg-accent/15 text-accent border border-accent/30"
                      : selectedMob.category === "MINI_BOSS"
                      ? "bg-info/15 text-info border border-info/30"
                      : "bg-surface2 text-muted border border-border"
                  }`}
                >
                  {selectedMob.category}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted">Select target monster...</span>
            )}
          </div>
        </div>
        <ChevronsUpDown className="w-4 h-4 text-muted shrink-0" />
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full z-50 bg-surface border border-border rounded-xl shadow-2xl p-2.5 space-y-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 max-h-80 flex flex-col">
          {/* Search Box */}
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 2,600+ monsters by name or ID (e.g. Orc, 1002)..."
              className="w-full bg-surface2 border border-border rounded-lg pl-8 pr-7 py-1.5 text-xs text-primary placeholder-muted focus:outline-none focus:border-accent"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 shrink-0 bg-surface2/60 p-0.5 rounded-lg text-[10px]">
            <button
              type="button"
              onClick={() => setCategoryFilter("ALL")}
              className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                categoryFilter === "ALL"
                  ? "bg-accent text-background font-bold"
                  : "text-muted hover:text-primary"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("NORMAL")}
              className={`px-2 py-0.5 rounded font-semibold transition-colors flex items-center gap-1 ${
                categoryFilter === "NORMAL"
                  ? "bg-accent text-background font-bold"
                  : "text-muted hover:text-primary"
              }`}
            >
              <Skull className="w-2.5 h-2.5" /> Normal
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("MINI_BOSS")}
              className={`px-2 py-0.5 rounded font-semibold transition-colors flex items-center gap-1 ${
                categoryFilter === "MINI_BOSS"
                  ? "bg-accent text-background font-bold"
                  : "text-muted hover:text-primary"
              }`}
            >
              <Swords className="w-2.5 h-2.5" /> Mini-Boss
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter("MVP")}
              className={`px-2 py-0.5 rounded font-semibold transition-colors flex items-center gap-1 ${
                categoryFilter === "MVP"
                  ? "bg-accent text-background font-bold"
                  : "text-muted hover:text-primary"
              }`}
            >
              <Crown className="w-2.5 h-2.5" /> MVP
            </button>
          </div>

          {/* Result List */}
          <div className="overflow-y-auto max-h-52 space-y-1 pr-1 flex-1">
            {filteredMobs.length === 0 ? (
              <div className="text-center py-6 text-muted text-xs font-mono">
                No monsters found matching "{searchQuery}"
              </div>
            ) : (
              filteredMobs.map((mob) => {
                const isSelected = selectedMobId === mob.id;
                return (
                  <button
                    key={mob.id}
                    type="button"
                    onClick={() => handleSelectMob(mob)}
                    className={`w-full flex items-center justify-between gap-2 p-1.5 rounded-lg text-left transition-colors ${
                      isSelected
                        ? "bg-accent/15 border border-accent/40 text-primary"
                        : "hover:bg-surface2 text-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded bg-surface2 flex items-center justify-center shrink-0 overflow-hidden">
                        <img
                          src={getMobSpriteUrl(mob.id)}
                          alt={mob.name}
                          className="w-5 h-5 object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium truncate">{mob.name}</span>
                      <span className="text-[10px] font-mono text-muted">
                        #{mob.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`text-[8px] font-mono px-1 py-0.2 rounded font-bold ${
                          mob.category === "MVP"
                            ? "bg-accent/20 text-accent"
                            : mob.category === "MINI_BOSS"
                            ? "bg-info/20 text-info"
                            : "bg-surface text-muted"
                        }`}
                      >
                        {mob.category}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-accent" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
