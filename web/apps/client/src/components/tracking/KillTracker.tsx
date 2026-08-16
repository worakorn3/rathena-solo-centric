import React, { useState } from "react";
import { ProgressionSummary, KillRecord } from "@rathena/shared";
import { getMobSpriteUrl } from "../../lib/assets";
import { Skull, Crown, Swords, Shield, ExternalLink, Filter } from "lucide-react";

interface KillTrackerProps {
  progression: ProgressionSummary;
}

export const KillTracker: React.FC<KillTrackerProps> = ({ progression }) => {
  const [filter, setFilter] = useState<"ALL" | "MVP" | "MINI_BOSS" | "NORMAL">("ALL");

  const { totalKills, mvpKills, miniBossKills, normalKills, killRecords } = progression;

  const filteredKills = killRecords.filter((k) => {
    if (filter === "ALL") return true;
    return k.category === filter;
  });

  return (
    <div className="ro-window flex flex-col h-full">
      {/* Title Bar */}
      <div className="ro-titlebar">
        <div className="flex items-center space-x-2">
          <Skull size={14} className="text-red-400" />
          <span className="font-cinzel font-bold text-xs tracking-wider text-slate-100 uppercase">
            Solo Hunt Milestones & Kill Tracker
          </span>
        </div>
        <span className="text-[10px] text-slate-300 font-mono">
          {totalKills.toLocaleString()} Lifetime Kills
        </span>
      </div>

      <div className="p-3.5 space-y-3.5 bg-[#1a2332]/90 flex-1 flex flex-col">
        {/* Metric Summary Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="ro-inset p-2 text-center border-b-2 border-red-500">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Total Defeated</div>
            <div className="text-base font-bold font-mono text-slate-100">
              {totalKills.toLocaleString()}
            </div>
          </div>

          <div className="ro-inset p-2 text-center border-b-2 border-amber-400">
            <div className="text-[10px] text-amber-300 uppercase font-mono flex items-center justify-center gap-1">
              <Crown size={10} />
              MvP Bosses
            </div>
            <div className="text-base font-bold font-mono text-amber-300">
              {mvpKills.toLocaleString()}
            </div>
          </div>

          <div className="ro-inset p-2 text-center border-b-2 border-sky-400">
            <div className="text-[10px] text-sky-300 uppercase font-mono flex items-center justify-center gap-1">
              <Swords size={10} />
              Mini-Bosses
            </div>
            <div className="text-base font-bold font-mono text-sky-300">
              {miniBossKills.toLocaleString()}
            </div>
          </div>

          <div className="ro-inset p-2 text-center border-b-2 border-slate-500">
            <div className="text-[10px] text-slate-400 uppercase font-mono">Field Monsters</div>
            <div className="text-base font-bold font-mono text-slate-300">
              {normalKills.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center justify-between gap-2 border-b border-ro-borderLight/20 pb-2">
          <div className="flex items-center space-x-1">
            <Filter size={12} className="text-slate-400 mr-1" />
            {(
              [
                { id: "ALL", label: "All" },
                { id: "MVP", label: "👑 MvP" },
                { id: "MINI_BOSS", label: "⚔️ Mini-Boss" },
                { id: "NORMAL", label: "Normal" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`text-[11px] px-2.5 py-0.5 rounded transition-all select-none font-medium ${
                  filter === tab.id
                    ? "bg-ro-gold text-slate-950 font-semibold shadow"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#253347]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <span className="text-[10px] text-slate-400 font-mono">
            Showing {filteredKills.length} species
          </span>
        </div>

        {/* Kill Records Grid */}
        {filteredKills.length === 0 ? (
          <div className="ro-inset p-6 text-center text-slate-400 space-y-2 my-auto">
            <Skull size={28} className="mx-auto text-slate-500" />
            <div className="text-xs font-semibold text-slate-300">No Hunting Records Found</div>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              Defeat monsters in fields or instances to populate your solo persistence hunt log.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 overflow-y-auto max-h-[360px] pr-1">
            {filteredKills.map((k) => {
              const spriteUrl = getMobSpriteUrl(k.mobId);
              return (
                <div
                  key={k.mobId}
                  className="ro-inset p-2.5 flex items-center justify-between gap-2 hover:border-ro-gold/40 transition-colors"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 rounded bg-[#101722] border border-ro-borderLight/30 flex items-center justify-center p-0.5 overflow-hidden shrink-0">
                      <img
                        src={spriteUrl}
                        alt={k.mobName}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-slate-200 truncate flex items-center gap-1">
                        {k.category === "MVP" && <Crown size={11} className="text-amber-400" />}
                        {k.category === "MINI_BOSS" && <Swords size={11} className="text-sky-400" />}
                        <span>{k.mobName}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Mob #{k.mobId}
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-sm font-black font-mono text-ro-gold">
                      {k.count.toLocaleString()}
                    </div>
                    <div className="text-[9px] text-slate-500 font-mono uppercase">Kills</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
