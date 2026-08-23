import React, { useState } from "react";
import { ProgressionSummary } from "@rathena/shared";
import { getMobSpriteUrl } from "../../lib/assets";
import { Skull, Crown, Swords, Target, Award, Shield } from "lucide-react";

interface KillTrackerProps {
  progression: ProgressionSummary;
}

export const KillTracker: React.FC<KillTrackerProps> = ({ progression }) => {
  const [filter, setFilter] = useState<"ALL" | "MVP" | "MINI_BOSS" | "NORMAL">(
    "ALL"
  );

  const { totalKills, mvpKills, miniBossKills, normalKills, killRecords } =
    progression;

  const filteredKills = killRecords.filter((k) => {
    if (filter === "ALL") return true;
    return k.category === filter;
  });

  return (
    <div className="flex flex-col gap-3 min-h-0 h-full">
      {/* 1. Top 4-Card KPI Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 shrink-0">
        <div className="bento-card p-3 flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-danger/10 border border-danger/20 flex items-center justify-center shrink-0">
            <Skull className="w-4 h-4 sm:w-5 sm:h-5 text-danger" />
          </div>
          <div>
            <div className="text-[8px] sm:text-[9px] font-bold text-muted uppercase">
              Total Defeated
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-primary">
              {totalKills.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bento-card p-3 flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center shrink-0">
            <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
          </div>
          <div>
            <div className="text-[8px] sm:text-[9px] font-bold text-muted uppercase text-accent">
              MvP Bosses
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-accent">
              {mvpKills.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bento-card p-3 flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-info/10 border border-info/20 flex items-center justify-center shrink-0">
            <Swords className="w-4 h-4 sm:w-5 sm:h-5 text-info" />
          </div>
          <div>
            <div className="text-[8px] sm:text-[9px] font-bold text-muted uppercase text-info">
              Mini-Bosses
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-info">
              {miniBossKills.toLocaleString()}
            </div>
          </div>
        </div>

        <div className="bento-card p-3 flex items-center gap-2.5 sm:gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-surface2 border border-border flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-muted" />
          </div>
          <div>
            <div className="text-[8px] sm:text-[9px] font-bold text-muted uppercase">
              Normal Monsters
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-primary">
              {normalKills.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Progression Stage: Left Hunt Records (7 cols) + Right Milestones (5 cols) */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
        {/* Left: Filterable Hunt Records List (7 Cols) */}
        <div className="col-span-12 lg:col-span-7 bento-card p-3 sm:p-3.5 flex flex-col min-h-0">
          <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 border-b border-border pb-2.5 mb-2.5 shrink-0">
            <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-2">
              <Target className="w-4 h-4 text-accent" /> Top Hunted Targets
            </h3>

            <div className="flex gap-1 sm:gap-1.5">
              {(
                [
                  { id: "ALL", label: "All" },
                  { id: "MVP", label: "MvP" },
                  { id: "MINI_BOSS", label: "Mini" },
                  { id: "NORMAL", label: "Normal" },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`text-[10px] font-bold px-2 sm:px-2.5 py-1 sm:py-0.5 rounded transition-colors min-h-[32px] sm:min-h-0 flex items-center justify-center ${
                    filter === tab.id
                      ? "bg-accent text-background"
                      : "bg-surface2 text-muted hover:text-primary"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2">
            {filteredKills.length === 0 ? (
              <div className="flex items-center justify-center py-12 text-muted text-xs font-medium">
                No monster kill records matching this filter.
              </div>
            ) : (
              filteredKills.map((k) => {
                const spriteUrl = getMobSpriteUrl(k.mobId);
                const maxCount = Math.max(1, ...filteredKills.map((item) => item.count));
                const pct = Math.max(5, (k.count / maxCount) * 100);

                return (
                  <div
                    key={k.mobId}
                    className="p-2.5 rounded-lg bg-surface2/30 border border-border flex items-center justify-between hover:border-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface2 flex items-center justify-center overflow-hidden shrink-0 border border-border">
                        <img
                          src={spriteUrl}
                          alt={k.mobName}
                          className="ro-mob w-8 h-8 object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                          {k.category === "MVP" && (
                            <Crown size={12} className="text-accent" />
                          )}
                          {k.category === "MINI_BOSS" && (
                            <Swords size={12} className="text-info" />
                          )}
                          <span>{k.mobName}</span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                              k.category === "MVP"
                                ? "bg-accent/20 text-accent"
                                : k.category === "MINI_BOSS"
                                ? "bg-info/20 text-info"
                                : "bg-surface2 text-muted"
                            }`}
                          >
                            {k.category === "MVP"
                              ? "MvP"
                              : k.category === "MINI_BOSS"
                              ? "Mini-Boss"
                              : "Normal"}
                          </span>
                        </div>
                        <div className="w-44 bg-surface2 rounded-full h-1.5 mt-1.5">
                          <div
                            className={`h-1.5 rounded-full ${
                              k.category === "MVP"
                                ? "bg-accent shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                                : k.category === "MINI_BOSS"
                                ? "bg-info shadow-[0_0_8px_rgba(96,165,250,0.5)]"
                                : "bg-danger/80"
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-mono font-bold text-sm text-primary">
                        {k.count.toLocaleString()}{" "}
                        <span className="text-xs font-sans text-muted">Kills</span>
                      </div>
                      <div className="text-[10px] text-muted font-mono">
                        ID #{k.mobId}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Hunt Milestones & Achievements (5 Cols) */}
        <div className="col-span-12 lg:col-span-5 bento-card p-3.5 flex flex-col justify-between min-h-0">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-2">
                <Award className="w-4 h-4 text-accent" /> Hunt Milestones
              </h3>
              <span className="text-[10px] text-muted font-mono">Solo Persistence</span>
            </div>

            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg bg-surface2/30 border border-border space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-primary flex items-center gap-1.5">
                    <Crown className="w-3.5 h-3.5 text-accent" /> Centurion Slayer (MvPs)
                  </span>
                  <span className="text-accent font-mono">
                    {mvpKills} / 50
                  </span>
                </div>
                <div className="w-full bg-surface2 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-accent h-1.5 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                    style={{
                      width: `${Math.min(100, (mvpKills / 50) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-muted">
                  Reward: +10% Boss Drop Rate permanently
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-surface2/30 border border-border space-y-1.5">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-primary flex items-center gap-1.5">
                    <Skull className="w-3.5 h-3.5 text-danger" /> Exterminator Tier I
                  </span>
                  <span className="text-primary font-mono">
                    {totalKills.toLocaleString()} / 25,000
                  </span>
                </div>
                <div className="w-full bg-surface2 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-danger h-1.5 rounded-full"
                    style={{
                      width: `${Math.min(100, (totalKills / 25000) * 100)}%`,
                    }}
                  />
                </div>
                <div className="text-[10px] text-muted">
                  Reward: 500,000 Zeny bonus payout in-game
                </div>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-muted text-center border-t border-border pt-2 font-mono">
            Hunting milestones recorded passively to adventurer journal
          </div>
        </div>
      </div>
    </div>
  );
};
