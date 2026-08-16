import React, { useState } from "react";
import { CharacterItem, PaperdollData } from "@rathena/shared";
import { getItemIconUrl, getCardImgUrl } from "../../lib/assets";
import { Shield, Sparkles, ExternalLink } from "lucide-react";

interface PaperdollProps {
  paperdoll: PaperdollData;
}

interface SlotDefinition {
  key: keyof PaperdollData;
  label: string;
  shortLabel: string;
}

const STANDARD_SLOTS: { left: SlotDefinition[]; right: SlotDefinition[]; center: SlotDefinition[] } = {
  left: [
    { key: "headTop", label: "Head Upper", shortLabel: "TOP" },
    { key: "headMid", label: "Head Middle", shortLabel: "MID" },
    { key: "headLow", label: "Head Lower", shortLabel: "LOW" },
    { key: "armor", label: "Armor", shortLabel: "ARM" },
    { key: "garment", label: "Garment / Robe", shortLabel: "GAR" },
  ],
  right: [
    { key: "rightHand", label: "Weapon / Right", shortLabel: "R-WEP" },
    { key: "leftHand", label: "Shield / Left", shortLabel: "L-SHD" },
    { key: "shoes", label: "Footwear / Shoes", shortLabel: "SHOE" },
    { key: "accLeft", label: "Accessory 1", shortLabel: "ACC-L" },
    { key: "accRight", label: "Accessory 2", shortLabel: "ACC-R" },
  ],
  center: [],
};

export const Paperdoll: React.FC<PaperdollProps> = ({ paperdoll }) => {
  const [hoveredItem, setHoveredItem] = useState<{
    item: CharacterItem;
    label: string;
  } | null>(null);

  const renderSlot = (slotDef: SlotDefinition) => {
    const item = paperdoll[slotDef.key];
    const iconUrl = item ? getItemIconUrl(item.nameId) : "";
    const hasRefine = item && item.refine > 0;

    return (
      <div
        key={slotDef.key}
        className="flex items-center space-x-2 my-1"
        onMouseEnter={() => item && setHoveredItem({ item, label: slotDef.label })}
        onMouseLeave={() => setHoveredItem(null)}
      >
        <div
          className={`ro-paperdoll-slot ${
            item ? "border-ro-gold/60 bg-[#16202e]" : "border-[#2c3d52]/60 opacity-60"
          }`}
        >
          {item ? (
            <>
              {/* Item Icon */}
              <img
                src={iconUrl}
                alt={`Item ${item.nameId}`}
                className="w-7 h-7 object-contain drop-shadow"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = "none";
                }}
              />

              {/* Refine Badge */}
              {hasRefine && (
                <span className="absolute top-0.5 right-0.5 bg-amber-500 text-slate-950 font-bold font-mono text-[9px] px-1 rounded-sm leading-none shadow">
                  +{item.refine}
                </span>
              )}

              {/* Card dots */}
              {(item.card0 > 0 || item.card1 > 0 || item.card2 > 0 || item.card3 > 0) && (
                <div className="absolute bottom-0.5 left-0.5 flex gap-0.5">
                  {[item.card0, item.card1, item.card2, item.card3].map(
                    (c, idx) =>
                      c > 0 && (
                        <span
                          key={idx}
                          className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_4px_rgba(34,211,238,0.8)]"
                        />
                      )
                  )}
                </div>
              )}
            </>
          ) : (
            <span className="text-[9px] font-mono text-slate-500">{slotDef.shortLabel}</span>
          )}
        </div>

        {/* Slot Info text */}
        <div className="overflow-hidden flex-1">
          <div className="text-[10px] text-slate-400 uppercase font-mono">{slotDef.label}</div>
          <div className="text-xs font-semibold text-slate-200 truncate">
            {item ? (
              <span>
                {item.refine > 0 ? `+${item.refine} ` : ""}
                Item #{item.nameId}
              </span>
            ) : (
              <span className="text-slate-500 italic">None</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="ro-window flex flex-col h-full relative">
      {/* Title Bar */}
      <div className="ro-titlebar">
        <div className="flex items-center space-x-2">
          <Shield size={14} className="text-ro-gold" />
          <span className="font-cinzel font-bold text-xs tracking-wider text-slate-100 uppercase">
            Equipment Paperdoll
          </span>
        </div>
        <span className="text-[10px] text-ro-gold font-mono">Renewal Gear Slots</span>
      </div>

      <div className="p-3.5 bg-[#1a2332]/90 flex-1 flex flex-col justify-between">
        {/* Paperdoll Grid: Left and Right Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
          <div>{STANDARD_SLOTS.left.map(renderSlot)}</div>
          <div>{STANDARD_SLOTS.right.map(renderSlot)}</div>
        </div>

        {/* Hover Tooltip Card */}
        {hoveredItem ? (
          <div className="ro-inset p-2.5 mt-3 bg-[#111722] border-ro-gold/40 flex items-start justify-between gap-2 transition-all">
            <div className="space-y-1">
              <div className="text-xs font-bold text-ro-gold flex items-center gap-1.5">
                <Sparkles size={12} />
                <span>
                  {hoveredItem.item.refine > 0 ? `+${hoveredItem.item.refine} ` : ""}
                  Item #{hoveredItem.item.nameId}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">({hoveredItem.label})</span>
              </div>
              {/* Slotted Cards */}
              <div className="text-[11px] text-slate-300 font-mono">
                Cards:{" "}
                {[
                  hoveredItem.item.card0,
                  hoveredItem.item.card1,
                  hoveredItem.item.card2,
                  hoveredItem.item.card3,
                ].filter((c) => c > 0).length > 0 ? (
                  <span className="text-cyan-300">
                    {[
                      hoveredItem.item.card0,
                      hoveredItem.item.card1,
                      hoveredItem.item.card2,
                      hoveredItem.item.card3,
                    ]
                      .filter((c) => c > 0)
                      .map((c) => `Card #${c}`)
                      .join(" / ")}
                  </span>
                ) : (
                  <span className="text-slate-500">None</span>
                )}
              </div>
            </div>

            <a
              href={`https://www.divine-pride.net/database/item/${hoveredItem.item.nameId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ro-button flex items-center gap-1 text-[10px] py-0.5 px-2 text-sky-300 shrink-0"
            >
              <ExternalLink size={10} />
              Divine Pride
            </a>
          </div>
        ) : (
          <div className="text-center text-[10px] text-slate-500 pt-2 border-t border-ro-borderLight/10 font-mono">
            Hover over any equipped gear slot for live Divine Pride inspect details.
          </div>
        )}
      </div>
    </div>
  );
};
