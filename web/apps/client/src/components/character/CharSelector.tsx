import React from "react";
import { CharacterSummary } from "@rathena/shared";
import { User, Shield } from "lucide-react";

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
  if (characters.length === 0) {
    return (
      <div className="ro-inset p-4 text-center text-xs text-slate-400">
        No characters found on this account.
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
      {characters.map((char) => {
        const isSelected = char.charId === selectedCharId;
        return (
          <button
            key={char.charId}
            onClick={() => onSelect(char.charId)}
            className={`ro-inset p-2.5 min-w-[170px] text-left transition-all relative select-none ${
              isSelected
                ? "border-ro-gold bg-[#243347] shadow-roWindow ring-1 ring-ro-gold"
                : "hover:border-ro-borderLight/60 hover:bg-[#1d2737]"
            }`}
          >
            {/* Online Pill */}
            {char.online && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            )}

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded bg-[#131b26] border border-ro-borderLight/40 flex items-center justify-center text-ro-gold">
                <Shield size={16} />
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-slate-100 truncate">{char.name}</div>
                <div className="text-[10px] text-ro-gold font-medium truncate">
                  {char.className}
                </div>
              </div>
            </div>

            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400 font-mono border-t border-ro-borderLight/20 pt-1.5">
              <span>
                Lv. <strong className="text-slate-200">{char.baseLevel}</strong>/{char.jobLevel}
              </span>
              <span className="text-amber-300 font-semibold truncate max-w-[80px]">
                {char.lastMap}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
};
