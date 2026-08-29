import React, { useState, useMemo, useEffect } from "react";
import { ProgressionSummary, EvaluatedMilestone } from "@rathena/shared";
import { getMobSpriteUrl } from "../../lib/assets";
import { api } from "../../lib/api";
import {
  Skull,
  Crown,
  Swords,
  Target,
  Award,
  Send,
  MailCheck,
  Mail,
  CheckCircle2,
  AlertCircle,
  Search,
  X,
  ChevronDown,
  Lock,
} from "lucide-react";


interface KillTrackerProps {
  progression: ProgressionSummary;
  selectedCharId?: number | null;
  selectedCharName?: string;
  onClaimSuccess?: () => void;
}

export const KillTracker: React.FC<KillTrackerProps> = ({
  progression,
  selectedCharId,
  selectedCharName,
  onClaimSuccess,
}) => {
  const [filter, setFilter] = useState<"ALL" | "MVP" | "MINI_BOSS" | "NORMAL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  // ponytail: progressive chunking for 100+ monster kill records (10 initial)
  const [visibleCount, setVisibleCount] = useState<number>(10);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  const { totalKills, mvpKills, miniBossKills, killRecords = [], milestones = [] } =
    progression;

  useEffect(() => {
    setVisibleCount(10);
  }, [filter, searchQuery]);

  const filteredKills = useMemo(() => {
    let list = killRecords.filter((k) => {
      const matchesCat = filter === "ALL" || k.category === filter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q || k.mobName.toLowerCase().includes(q) || String(k.mobId).includes(q);
      return matchesCat && matchesSearch;
    });
    // Default sort by kill count descending
    return list.sort((a, b) => b.count - a.count);
  }, [killRecords, filter, searchQuery]);

  const claimedCount = milestones.filter((m) => m.isClaimed).length;

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToastMsg(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMsg(null);
    }, 3500);
  };

  const handleClaim = async (milestone: EvaluatedMilestone) => {
    if (!selectedCharId) {
      showToast("Please select an active character to receive the reward.", "error");
      return;
    }

    setClaimingId(milestone.id);
    try {
      const res = await api.post<{
        success: boolean;
        rewardDesc?: string;
        recipientChar?: string;
        error?: string;
      }>("/api/tracking/milestones/claim", {
        milestoneId: milestone.id,
        charId: selectedCharId,
      });

      if (res.success) {
        showToast(
          `Reward sent to [${res.recipientChar || selectedCharName || "Character"}]! Check your in-game RODEX mailbox.`,
          "success"
        );
        onClaimSuccess?.();
      } else {
        showToast(res.error || "Failed to claim reward.", "error");
      }
    } catch (err: any) {
      showToast(err.message || "Failed to communicate with server.", "error");
    } finally {
      setClaimingId(null);
    }
  };

  return (
    <div className="flex flex-col gap-3 min-h-0 h-full relative">
      {/* Toast Feedback */}
      {toastMsg && (
        <div
          className={`fixed bottom-4 right-4 z-50 bg-surface border ${
            toastType === "success" ? "border-success/50 text-success" : "border-danger/50 text-danger"
          } px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 text-xs animate-in fade-in slide-in-from-bottom-2`}
        >
          {toastType === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-danger shrink-0" />
          )}
          <span className="text-primary font-medium">{toastMsg}</span>
        </div>
      )}

      {/* 1. Top 4-Card Hero KPI Banner */}
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
            <MailCheck className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
          </div>
          <div>
            <div className="text-[8px] sm:text-[9px] font-bold text-muted uppercase">
              Milestones Claimed
            </div>
            <div className="text-lg sm:text-xl font-black font-mono text-success">
              {claimedCount} / {milestones.length}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Progression Stage: Left Target Records (7 cols) + Right Dynamic Milestones (5 cols) */}
      <div className="grid grid-cols-12 gap-3 min-h-0 flex-1">
        {/* Left: Hunt Target Records (7 Cols) */}
        <div className="col-span-12 lg:col-span-7 bento-card p-3.5 flex flex-col min-h-0">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-2.5 mb-2.5 shrink-0">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-danger" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-primary">
                Hunted Targets
              </h3>
              <span className="text-[10px] text-muted font-mono">
                ({filteredKills.length} recorded)
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Search Bar */}
              <div className="relative flex-1 sm:w-40">
                <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search target..."
                  className="w-full bg-surface2/80 border border-border rounded-lg pl-7 pr-6 py-1 text-[11px] text-primary placeholder:text-muted/60 focus:outline-none focus:border-accent/60 transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-primary"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-1 bg-surface2 p-0.5 rounded-lg border border-border text-[11px] shrink-0">
                <button
                  onClick={() => setFilter("ALL")}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    filter === "ALL"
                      ? "bg-accent text-background font-bold"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter("MVP")}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    filter === "MVP"
                      ? "bg-accent text-background font-bold"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  MvP
                </button>
                <button
                  onClick={() => setFilter("MINI_BOSS")}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    filter === "MINI_BOSS"
                      ? "bg-info text-background font-bold"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  Mini
                </button>
                <button
                  onClick={() => setFilter("NORMAL")}
                  className={`px-2 py-0.5 rounded font-medium transition-colors ${
                    filter === "NORMAL"
                      ? "bg-surface text-primary font-bold"
                      : "text-muted hover:text-primary"
                  }`}
                >
                  Normal
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 min-h-0">
            {filteredKills.length === 0 ? (
              <div className="text-center py-12 text-muted text-xs font-mono">
                No monster kill records found matching your filters.
              </div>
            ) : (
              <>
                {filteredKills.slice(0, visibleCount).map((k, idx) => {
                  return (
                    <div
                      key={k.mobId}
                      className="bento-list-item p-2.5 rounded-lg bg-surface2/30 border border-border/70 flex items-center justify-between gap-3 hover:border-accent/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-muted w-4 text-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div className="w-10 h-10 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden relative">
                          <img
                            src={getMobSpriteUrl(k.mobId)}
                            alt={k.mobName}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-primary truncate">
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
                          {k.lastKilled && (
                            <div className="text-[10px] text-muted font-mono mt-0.5">
                              Last defeated: {k.lastKilled}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-sm text-primary">
                          {k.count.toLocaleString()}{" "}
                          <span className="text-xs font-sans text-muted">Kills</span>
                        </div>
                        <div className="text-[10px] text-muted font-mono">
                          #{k.mobId}
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* ponytail: progressive chunking load more trigger */}
                {filteredKills.length > visibleCount && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + 10)}
                      className="px-4 py-1.5 rounded-lg bg-surface2 hover:bg-surface text-xs font-bold text-muted hover:text-primary border border-border hover:border-accent/40 shadow-sm transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <ChevronDown className="w-3.5 h-3.5 text-accent animate-bounce" />
                      <span>Show More Targets ({filteredKills.length - visibleCount} remaining)</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Hunt Milestones (5 Cols) */}
        <div className="col-span-12 lg:col-span-5 bento-card p-3.5 flex flex-col justify-between min-h-0">
          <div className="space-y-3 min-h-0 flex flex-col flex-1">
            <div className="flex items-center justify-between border-b border-border pb-2 shrink-0">
              <h3 className="font-bold text-xs uppercase tracking-wider text-primary flex items-center gap-2">
                <Award className="w-4 h-4 text-accent" /> Hunt Milestones
              </h3>
              <span className="text-[10px] text-muted font-mono">
                {claimedCount} of {milestones.length} Claimed
              </span>
            </div>

            <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-0">
              {milestones.length === 0 ? (
                <div className="text-center py-10 text-muted text-xs font-mono">
                  No active hunt milestones available.
                </div>
              ) : (
                milestones.map((m) => {
                  const pct = Math.min(100, (m.currentCount / m.requiredCount) * 100);
                  const isClaimReady = m.isCompleted && !m.isClaimed && !m.isLocked;

                  return (
                    <div
                      key={m.id}
                      className={`p-2.5 rounded-lg bg-surface2/30 border ${
                        isClaimReady
                          ? "border-success shadow-[0_0_12px_rgba(74,222,128,0.25)]"
                          : m.isLocked
                          ? "border-border/50 opacity-70"
                          : "border-border"
                      } space-y-1.5 transition-all`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold gap-2">
                        <span className="text-primary flex items-center gap-1.5 truncate">
                          {m.category === "MVP" ? (
                            <Crown className="w-3.5 h-3.5 text-accent shrink-0" />
                          ) : m.category === "MINI_BOSS" ? (
                            <Swords className="w-3.5 h-3.5 text-info shrink-0" />
                          ) : m.category === "SPECIFIC_MOB" ? (
                            <Target className="w-3.5 h-3.5 text-info shrink-0" />
                          ) : (
                            <Skull className="w-3.5 h-3.5 text-danger shrink-0" />
                          )}
                          <span className="truncate">{m.title}</span>
                          {m.tierLabel && (
                            <span className="text-[9px] font-mono font-bold px-1 rounded bg-surface2 text-muted shrink-0">
                              {m.tierLabel}
                            </span>
                          )}
                        </span>
                        {m.isLocked ? (
                          <span className="font-mono text-[11px] text-muted flex items-center gap-1 shrink-0">
                            <Lock className="w-3 h-3 text-muted" /> LOCKED
                          </span>
                        ) : (
                          <span
                            className={`font-mono text-xs shrink-0 ${
                              m.isCompleted ? "text-success font-bold" : "text-accent"
                            }`}
                          >
                            {m.currentCount.toLocaleString()} / {m.requiredCount.toLocaleString()}
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-surface2 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            m.isLocked
                              ? "bg-muted/30"
                              : m.isCompleted
                              ? "bg-success shadow-[0_0_8px_rgba(74,222,128,0.6)]"
                              : "bg-accent"
                          }`}
                          style={{ width: `${m.isLocked ? 0 : pct}%` }}
                        />
                      </div>

                      {/* Bottom Rewards Text and 1-Click Claim Action */}
                      <div className="flex items-center justify-between text-[10px] gap-2 pt-0.5">
                        <span className="text-muted truncate">
                          Reward:{" "}
                          <span className="text-primary font-medium">{m.rewardDesc}</span>
                        </span>

                        {m.isClaimed ? (
                          <span className="text-muted font-mono font-bold flex items-center gap-1 text-[9px] bg-surface px-2 py-0.5 rounded border border-border shrink-0">
                            <MailCheck className="w-3 h-3 text-success" /> CLAIMED
                          </span>
                        ) : m.isLocked ? (
                          <span className="text-amber-400/90 font-mono text-[9px] flex items-center gap-1 font-semibold shrink-0">
                            <Lock className="w-3 h-3 shrink-0" /> Requires: {m.prevMilestoneTitle || "Prerequisite"}
                          </span>
                        ) : m.isCompleted ? (
                          <button
                            onClick={() => handleClaim(m)}
                            disabled={claimingId === m.id}
                            className="px-2.5 py-0.5 bg-success hover:bg-emerald-400 text-background font-bold rounded text-[10px] font-mono flex items-center gap-1 shadow-sm shrink-0 transition-transform active:scale-95 disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" />
                            <span>{claimingId === m.id ? "DISPATCHING..." : "CLAIM"}</span>
                          </button>
                        ) : (
                          <span className="text-muted font-mono text-[9px] shrink-0">
                            {Math.floor(pct)}% COMPLETE
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="text-[10px] text-muted text-center border-t border-border pt-2 font-mono mt-3 flex items-center justify-center gap-1.5 shrink-0">
            <Mail className="w-3 h-3 text-info" />
            <span>
              Rewards are sent directly to{" "}
              <b>{selectedCharName || "Active Character"}</b> via in-game RODEX mail.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
