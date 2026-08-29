import React, { useState, useMemo, useRef, useEffect } from "react";
import { ItemNames } from "@rathena/shared";
import { Search, Package, X, Check, ChevronsUpDown } from "lucide-react";

interface ItemOption {
  id: number;
  name: string;
}

interface ItemComboboxProps {
  selectedItemId: number;
  onSelect: (itemId: number, itemName: string) => void;
  disabled?: boolean;
}

const POPULAR_REWARD_ITEMS = [
  { id: 604, name: "Dead Branch" },
  { id: 607, name: "Yggdrasil Berry" },
  { id: 608, name: "Yggdrasil Seed" },
  { id: 616, name: "Old Blue Box" },
  { id: 617, name: "Old Purple Box" },
  { id: 644, name: "Gift Box" },
  { id: 674, name: "Bloody Branch" },
  { id: 984, name: "Oridecon" },
  { id: 985, name: "Elunium" },
  { id: 6001, name: "Enriched Elunium" },
  { id: 6002, name: "Enriched Oridecon" },
  { id: 6224, name: "Blacksmith's Blessing" },
  { id: 12208, name: "Battle Manual" },
];

export const ItemCombobox: React.FC<ItemComboboxProps> = ({
  selectedItemId,
  onSelect,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse all items once
  const allItems: ItemOption[] = useMemo(() => {
    const list: ItemOption[] = [];
    for (const [idStr, name] of Object.entries(ItemNames)) {
      const id = Number(idStr);
      if (!isNaN(id) && id > 0) {
        list.push({ id, name });
      }
    }
    return list.sort((a, b) => a.id - b.id);
  }, []);

  // Filtered items based on search query
  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) {
      // If query is empty, show popular reward presets
      return POPULAR_REWARD_ITEMS;
    }
    return allItems
      .filter((i) => i.name.toLowerCase().includes(q) || String(i.id).includes(q))
      .slice(0, 40);
  }, [allItems, searchQuery]);

  const selectedItem = useMemo(() => {
    if (!selectedItemId || selectedItemId <= 0) return null;
    return (
      allItems.find((i) => i.id === selectedItemId) || {
        id: selectedItemId,
        name: ItemNames[selectedItemId] || `Item #${selectedItemId}`,
      }
    );
  }, [allItems, selectedItemId]);

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

  const handleSelectItem = (item: ItemOption) => {
    onSelect(item.id, item.name);
    setIsOpen(false);
    setSearchQuery("");
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(0, "");
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Selected Box / Trigger */}
      <div
        onClick={handleOpen}
        className={`w-full flex items-center justify-between gap-2 bg-surface border border-border hover:border-accent/60 rounded-lg px-2.5 py-1.5 text-left cursor-pointer transition-colors ${
          disabled ? "opacity-50 pointer-events-none" : ""
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Package className="w-3.5 h-3.5 text-muted shrink-0" />
          <div className="min-w-0">
            {selectedItem ? (
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-xs text-primary truncate">
                  {selectedItem.name}
                </span>
                <span className="text-[10px] font-mono text-muted">
                  #{selectedItem.id}
                </span>
              </div>
            ) : (
              <span className="text-xs text-muted">No item reward</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {selectedItem && (
            <button
              type="button"
              onClick={handleClear}
              className="text-muted hover:text-danger p-0.5 rounded transition-colors"
              title="Remove Item Reward"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronsUpDown className="w-3.5 h-3.5 text-muted" />
        </div>
      </div>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1.5 w-full z-50 bg-surface border border-border rounded-xl shadow-2xl p-2.5 space-y-2 backdrop-blur-md animate-in fade-in zoom-in-95 duration-100 max-h-72 flex flex-col">
          {/* Search Box */}
          <div className="relative shrink-0">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 30,000+ items by name or ID (e.g. Purple, 617)..."
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

          <div className="text-[10px] font-bold text-muted uppercase tracking-wider px-1">
            {searchQuery ? "Search Matches" : "Quick Reward Presets"}
          </div>

          {/* Result List */}
          <div className="overflow-y-auto max-h-48 space-y-1 pr-1 flex-1">
            {filteredItems.length === 0 ? (
              <div className="text-center py-5 text-muted text-xs font-mono">
                No items found matching "{searchQuery}"
              </div>
            ) : (
              filteredItems.map((item) => {
                const isSelected = selectedItemId === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectItem(item)}
                    className={`w-full flex items-center justify-between gap-2 p-1.5 rounded-lg text-left transition-colors ${
                      isSelected
                        ? "bg-accent/15 border border-accent/40 text-primary"
                        : "hover:bg-surface2 text-primary"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium truncate">{item.name}</span>
                      <span className="text-[10px] font-mono text-muted">
                        #{item.id}
                      </span>
                    </div>

                    {isSelected && <Check className="w-3.5 h-3.5 text-accent shrink-0" />}
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
