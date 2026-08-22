import React, { useEffect, useState } from "react";
import { Target, Skull, ExternalLink, Sparkles } from "lucide-react";
import { DailyBounty } from "@rathena/shared";
import { formatZeny, getItemIconUrl } from "../../lib/assets";
import { api } from "../../lib/api";

export const BountyBoard: React.FC = () => {
  const [bounties, setBounties] = useState<DailyBounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBounties = async () => {
      try {
        const res = await api.get<{ success: boolean; bounties: DailyBounty[] }>(
          "/api/economy/bounties"
        );
        if (res.success && res.bounties) {
          setBounties(res.bounties);
        }
      } catch (err) {
        console.error("Failed to load bounties", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBounties();
  }, []);

  if (loading) {
    return (
      <div className="bento-card py-20 text-center text-xs font-medium text-muted">
        Loading Daily Junk Trader Bounties...
      </div>
    );
  }

  const tiers = [1, 2, 3, 4, 5, 6];
  const groupedBounties = tiers.map((tier) => ({
    tier,
    items: bounties.filter((b) => b.tier === tier).sort((a, b) => a.index - b.index),
  }));

  const allItems = groupedBounties.flatMap((g) => g.items);

  return (
    <div className="flex flex-col gap-3 min-h-0 h-full">
      {/* Top Banner: Daily Turn-in Quota + Rules */}
      <div className="bento-card p-3 sm:p-3.5 shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-sm font-bold text-primary flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" /> Daily Junk Trader Bounties
          </h2>
          <div className="text-[11px] text-muted mt-0.5">
            Hunt target monsters and sell their drops to the Junk Trader for boosted payouts. Resets daily at 00:00 server time.
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-border/60 pt-2 sm:pt-0">
          <div className="text-left sm:text-right">
            <div className="text-[9px] text-muted uppercase font-bold">
              Daily Turn-in Quota
            </div>
            <div className="text-sm font-bold font-mono text-accent">
              Max 100 Items/day
            </div>
          </div>
        </div>
      </div>

      {/* 6-Card Responsive Board (2 Rows x 3 Columns) */}
      {allItems.length === 0 ? (
        <div className="bento-card text-center py-20 text-xs font-medium text-muted">
          No daily bounties found. The Junk Trader might be resting today.
        </div>
      ) : (
        <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 overflow-y-auto pr-1">
          {allItems.map((bounty) => (
            <div
              key={`${bounty.tier}-${bounty.index}`}
              className="bento-card p-3.5 flex flex-col justify-between border-accent/20 bg-accent/5 hover:border-accent/50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold uppercase bg-accent/20 text-accent px-1.5 py-0.5 rounded">
                    Tier {bounty.tier}
                  </span>
                  <h4 className="font-bold text-sm text-primary">
                    {bounty.itemName}
                  </h4>
                  <div className="text-[11px] text-muted flex items-center gap-1">
                    <Skull size={12} className="text-danger shrink-0" />
                    <span>
                      {bounty.mobName} (Lv.{bounty.mobLevel})
                    </span>
                  </div>
                </div>

                <div className="w-11 h-11 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0 shadow-inner">
                  <img
                    src={getItemIconUrl(bounty.itemId)}
                    alt={bounty.itemName}
                    className="ro-icon w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-border flex justify-between items-center text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted text-[11px]">Payout:</span>
                  <a
                    href={`https://www.divine-pride.net/database/item/${bounty.itemId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-info hover:text-primary flex items-center gap-0.5"
                  >
                    <span>DB</span>
                    <ExternalLink size={9} />
                  </a>
                </div>
                <span className="font-mono font-bold text-accent text-sm">
                  {formatZeny(bounty.price)} Z
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
