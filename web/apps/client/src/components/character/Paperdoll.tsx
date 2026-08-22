import React, { useState, useEffect } from "react";
import { CharacterItem, PaperdollData, ItemNames } from "@rathena/shared";
import { getItemIconUrl } from "../../lib/assets";
import {
  Shield,
  Sparkles,
  ExternalLink,
  Award,
  MousePointerClick,
  Ghost,
  Shirt,
} from "lucide-react";

interface PaperdollProps {
  paperdoll: PaperdollData;
}

type GearTab = "MAIN" | "SHADOW" | "COSTUME";

interface SlotDefinition {
  key: keyof PaperdollData;
  label: string;
  shortLabel: string;
  column: "LEFT" | "RIGHT";
  category: GearTab;
}

const MAIN_SLOTS: SlotDefinition[] = [
  // Left Column
  { key: "headTop", label: "Head Upper", shortLabel: "TOP", column: "LEFT", category: "MAIN" },
  { key: "armor", label: "Armor", shortLabel: "ARM", column: "LEFT", category: "MAIN" },
  { key: "rightHand", label: "Weapon", shortLabel: "WEP", column: "LEFT", category: "MAIN" },
  { key: "garment", label: "Garment", shortLabel: "GAR", column: "LEFT", category: "MAIN" },
  { key: "accLeft", label: "Accessory 1", shortLabel: "ACC1", column: "LEFT", category: "MAIN" },
  // Right Column
  { key: "headMid", label: "Head Mid", shortLabel: "MID", column: "RIGHT", category: "MAIN" },
  { key: "headLow", label: "Head Lower", shortLabel: "LOW", column: "RIGHT", category: "MAIN" },
  { key: "leftHand", label: "Shield / Off-Hand", shortLabel: "SHD", column: "RIGHT", category: "MAIN" },
  { key: "shoes", label: "Footwear", shortLabel: "SHOE", column: "RIGHT", category: "MAIN" },
  { key: "accRight", label: "Accessory 2", shortLabel: "ACC2", column: "RIGHT", category: "MAIN" },
];

const SHADOW_SLOTS: SlotDefinition[] = [
  // Left Column
  { key: "shadowArmor", label: "Shadow Armor", shortLabel: "S-ARM", column: "LEFT", category: "SHADOW" },
  { key: "shadowWeapon", label: "Shadow Weapon", shortLabel: "S-WEP", column: "LEFT", category: "SHADOW" },
  { key: "shadowShoes", label: "Shadow Footwear", shortLabel: "S-SHOE", column: "LEFT", category: "SHADOW" },
  // Right Column
  { key: "shadowShield", label: "Shadow Shield", shortLabel: "S-SHD", column: "RIGHT", category: "SHADOW" },
  { key: "shadowAccL", label: "Shadow Earring (Acc L)", shortLabel: "S-EAR", column: "RIGHT", category: "SHADOW" },
  { key: "shadowAccR", label: "Shadow Pendant (Acc R)", shortLabel: "S-PEN", column: "RIGHT", category: "SHADOW" },
];

const COSTUME_SLOTS: SlotDefinition[] = [
  // Left Column
  { key: "costumeTop", label: "Costume Upper", shortLabel: "C-TOP", column: "LEFT", category: "COSTUME" },
  { key: "costumeLow", label: "Costume Lower", shortLabel: "C-LOW", column: "LEFT", category: "COSTUME" },
  // Right Column
  { key: "costumeMid", label: "Costume Mid", shortLabel: "C-MID", column: "RIGHT", category: "COSTUME" },
  { key: "costumeGarment", label: "Costume Garment", shortLabel: "C-GAR", column: "RIGHT", category: "COSTUME" },
];

export const Paperdoll: React.FC<PaperdollProps> = ({ paperdoll }) => {
  const [activeTab, setActiveTab] = useState<GearTab>("MAIN");
  const [selectedSlot, setSelectedSlot] = useState<{
    item: CharacterItem;
    label: string;
    category: GearTab;
  } | null>(null);

  // Clear selection if the character changes
  useEffect(() => {
    setSelectedSlot(null);
  }, [paperdoll]);

  const activeSlots =
    activeTab === "MAIN"
      ? MAIN_SLOTS
      : activeTab === "SHADOW"
      ? SHADOW_SLOTS
      : COSTUME_SLOTS;

  const leftSlots = activeSlots.filter((s) => s.column === "LEFT");
  const rightSlots = activeSlots.filter((s) => s.column === "RIGHT");

  const mainEquippedCount = MAIN_SLOTS.filter((s) => !!paperdoll[s.key]).length;
  const shadowEquippedCount = SHADOW_SLOTS.filter((s) => !!paperdoll[s.key]).length;
  const costumeEquippedCount = COSTUME_SLOTS.filter((s) => !!paperdoll[s.key]).length;

  const tabs: { id: GearTab; label: string; icon: React.ComponentType<{ className?: string }>; count: number }[] = [
    { id: "MAIN", label: "Main", icon: Shield, count: mainEquippedCount },
    { id: "SHADOW", label: "Shadow", icon: Ghost, count: shadowEquippedCount },
    { id: "COSTUME", label: "Costumes", icon: Shirt, count: costumeEquippedCount },
  ];

  const renderSlotButton = (slotDef: SlotDefinition) => {
    const item = paperdoll[slotDef.key];
    const isSelected = selectedSlot?.item.id === item?.id && !!item;
    const hasRefine = item && item.refine > 0;
    const isWeapon = slotDef.key === "rightHand";
    const isShadow = slotDef.category === "SHADOW";
    const isCostume = slotDef.category === "COSTUME";

    const cards = item
      ? [item.card0, item.card1, item.card2, item.card3].filter((c) => c > 0)
      : [];

    let selectedClasses = "bg-surface2 border-accent/60 ring-1 ring-accent/40 shadow-sm";
    if (isWeapon) {
      selectedClasses = "bg-danger/15 border-danger/60 ring-1 ring-danger/40 shadow-sm";
    } else if (isShadow) {
      selectedClasses = "bg-purple-500/15 border-purple-500/60 ring-1 ring-purple-500/40 shadow-sm";
    } else if (isCostume) {
      selectedClasses = "bg-cyan-500/15 border-cyan-500/60 ring-1 ring-cyan-500/40 shadow-sm";
    }

    let hoverClasses = "hover:border-accent/40";
    if (isWeapon) hoverClasses = "hover:border-danger/40";
    if (isShadow) hoverClasses = "hover:border-purple-500/40";
    if (isCostume) hoverClasses = "hover:border-cyan-500/40";

    let titleColor = "text-primary";
    if (isWeapon) titleColor = "text-danger";
    else if (isShadow) titleColor = "text-purple-400";
    else if (isCostume) titleColor = "text-cyan-400";

    return (
      <div
        key={slotDef.key}
        role="button"
        tabIndex={item ? 0 : -1}
        aria-selected={isSelected}
        onClick={() => {
          if (item) {
            setSelectedSlot({ item, label: slotDef.label, category: slotDef.category });
          }
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && item) {
            e.preventDefault();
            setSelectedSlot({ item, label: slotDef.label, category: slotDef.category });
          }
        }}
        className={`p-2 rounded-lg border transition-all flex items-center gap-2.5 min-h-[44px] ${
          isSelected
            ? selectedClasses
            : item
            ? `bg-surface2/30 border-border cursor-pointer ${hoverClasses}`
            : "bg-surface2/15 border-border/40 opacity-50 cursor-default"
        }`}
      >
        <div
          className={`w-8 h-8 rounded flex items-center justify-center shrink-0 shadow-inner ${
            item
              ? isWeapon
                ? "bg-background border border-danger/40"
                : isShadow
                ? "bg-background border border-purple-500/40"
                : isCostume
                ? "bg-background border border-cyan-500/40"
                : "bg-background border border-border"
              : "bg-background border border-border/50"
          }`}
        >
          {item ? (
            <img
              src={getItemIconUrl(item.nameId)}
              alt={`Item ${item.nameId}`}
              className="ro-icon w-5 h-5"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <span className="text-[9px] font-bold text-muted uppercase">
              {slotDef.shortLabel}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-bold text-muted uppercase tracking-wider">
            {slotDef.label}
          </div>
          {item ? (
            <>
              <div className={`text-xs font-bold truncate ${titleColor}`}>
                {hasRefine ? `+${item.refine} ` : ""}
                {ItemNames[item.nameId] || `Item #${item.nameId}`}
              </div>
              <div className="text-[10px] text-info truncate">
                {cards.length > 0
                  ? cards.map((c) => ItemNames[c] || `Card #${c}`).join(", ")
                  : isShadow || isCostume
                  ? "Equipment"
                  : "Unslotted"}
              </div>
            </>
          ) : (
            <div className="text-[11px] text-muted italic">Empty</div>
          )}
        </div>
      </div>
    );
  };

  const activeItem = selectedSlot?.item;
  const activeCards = activeItem
    ? [activeItem.card0, activeItem.card1, activeItem.card2, activeItem.card3].filter(
        (c) => c > 0
      )
    : [];

  return (
    <div className="bento-card p-3 sm:p-4 flex flex-col justify-between min-h-0 h-full">
      <div className="space-y-2.5">
        {/* Header with Sub-Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2 shrink-0">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary">
              Equipment Paperdoll
            </h3>
          </div>

          {/* Sub-Tab Navigation Switcher */}
          <div className="flex items-center gap-1 bg-surface2/60 p-0.5 rounded-lg border border-border">
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 transition-all ${
                    isActive
                      ? "bg-background text-primary shadow-xs border border-border/80"
                      : "text-muted hover:text-primary hover:bg-surface2/40"
                  }`}
                  role="tab"
                  aria-selected={isActive}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                  <span
                    className={`text-[10px] font-mono px-1 rounded-full ${
                      isActive
                        ? "bg-accent/15 text-accent font-bold"
                        : "bg-surface2 text-muted"
                    }`}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2-COLUMN PAPERDOLL GRID */}
        <div className="grid grid-cols-2 gap-2 min-h-[220px]">
          {/* Left Column Slots */}
          <div className="space-y-1.5">{leftSlots.map(renderSlotButton)}</div>
          {/* Right Column Slots */}
          <div className="space-y-1.5">{rightSlots.map(renderSlotButton)}</div>
        </div>
      </div>

      {/* ACTIVE GEAR INSPECTION CARD (Divine Pride DB Terminal) */}
      <div className="mt-3 p-3 bg-surface2/40 rounded-xl border border-border flex flex-col gap-2">
        {activeItem && selectedSlot ? (
          <>
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-1.5 border-b border-border pb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles
                  className={`w-4 h-4 shrink-0 ${
                    selectedSlot.category === "SHADOW"
                      ? "text-purple-400"
                      : selectedSlot.category === "COSTUME"
                      ? "text-cyan-400"
                      : "text-accent"
                  }`}
                />
                <h4 className="text-xs font-bold text-primary truncate max-w-[200px] sm:max-w-[280px]">
                  {activeItem.refine > 0 ? `+${activeItem.refine} ` : ""}
                  {ItemNames[activeItem.nameId] || `Item #${activeItem.nameId}`}{" "}
                  <span className="text-muted font-mono font-normal">
                    ({selectedSlot.label})
                  </span>
                </h4>
              </div>
              <a
                href={`https://www.divine-pride.net/database/item/${activeItem.nameId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-semibold text-info hover:text-primary flex items-center gap-1 transition-colors shrink-0"
              >
                <span>Divine Pride #{activeItem.nameId}</span>
                <ExternalLink size={10} />
              </a>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-muted text-[11px] font-mono">
                <span>
                  Refine:{" "}
                  <strong className="text-accent">
                    {activeItem.refine > 0 ? `+${activeItem.refine}` : "None"}
                  </strong>
                </span>
                <span>
                  Slotted Cards:{" "}
                  <strong className="text-info">{activeCards.length}</strong>
                </span>
              </div>

              {/* Slotted Cards List */}
              <div className="p-2 rounded bg-surface2/60 border border-border/60 space-y-1">
                <div className="text-[10px] font-bold text-accent flex items-center gap-1">
                  <Award className="w-3 h-3 text-accent" /> Slotted Card Sockets:
                </div>
                {activeCards.length > 0 ? (
                  activeCards.map((c, idx) => (
                    <div key={idx} className="text-[11px] text-info">
                      • <strong>{ItemNames[c] || `Card #${c}`}</strong> (ID: {c})
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-muted italic">
                    {selectedSlot.category === "SHADOW"
                      ? "Shadow equipment does not use card sockets."
                      : selectedSlot.category === "COSTUME"
                      ? "Costume gear does not use card sockets."
                      : "No cards currently socketed in this equipment."}
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="py-5 px-4 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-9 h-9 rounded-full bg-surface2/70 border border-border flex items-center justify-center text-muted">
              <MousePointerClick className="w-4 h-4 opacity-75" />
            </div>
            <div>
              <div className="text-xs font-semibold text-primary">
                No Equipment Selected
              </div>
              <p className="text-[11px] text-muted max-w-xs mt-0.5">
                Click any equipped slot above to inspect refinement, socketed cards, and database details.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
