import React, { useState, useEffect, useMemo } from "react";
import {
  HuntMilestone,
  HuntMilestoneCategory,
  MobNames,
  MobTypes,
  ItemNames,
  MonsterCategory,
} from "@rathena/shared";
import { api } from "../../lib/api";
import { getMobSpriteUrl } from "../../lib/assets";
import { MonsterCombobox } from "./MonsterCombobox";
import { ItemCombobox } from "./ItemCombobox";
import {
  Crown,
  Swords,
  Skull,
  PlusCircle,
  Search,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Gift,
  Lock,
  ArrowUp,
  ArrowDown,
  Coins,
  TrendingUp,
  Package,
  Sparkles,
  Layers,
  Sliders,
} from "lucide-react";

const TIER_OPTIONS = [
  "Novice (Lv 1–40)",
  "2nd Class (Lv 41–99)",
  "Trans (Lv 90–99)",
  "3rd Class (Lv 100–185)",
  "4th Class (Lv 200–250+)",
  "Global / Boss",
];

const STOCK_OPTIONS = [
  { ticker: "", name: "None (No stock reward)" },
  { ticker: "MS500", name: "MS500 • Midgard Sovereign 500 ETF" },
  { ticker: "PRON", name: "PRON • Prontera Financial Group" },
  { ticker: "GEFF", name: "GEFF • Geffen Arcane Industries" },
  { ticker: "PAYO", name: "PAYO • Payon Forestry & Timber" },
  { ticker: "ALBE", name: "ALBE • Alberta Maritime Logistics" },
  { ticker: "MORA", name: "MORA • Mora Biotech Holdings" },
  { ticker: "RACH", name: "RACH • Rachel Divine Energy" },
  { ticker: "LGT", name: "LGT • Lighthalzen R&D Heavyworks" },
  { ticker: "EIN", name: "EIN • Einbroch Steam & Steel" },
  { ticker: "COCK", name: "COCK • Comodo Entertainment & Gaming" },
];

const computeRewardSummary = (
  zeny: number,
  itemId: number,
  itemAmt: number,
  stockTicker?: string | null,
  stockShares?: number
): string => {
  const parts: string[] = [];
  if (zeny > 0) {
    parts.push(`${zeny.toLocaleString()} Zeny`);
  }
  if (itemId > 0 && itemAmt > 0) {
    const itemName = ItemNames[itemId] || `Item #${itemId}`;
    parts.push(`${itemAmt}x ${itemName}`);
  }
  if (stockTicker && stockShares && stockShares > 0) {
    parts.push(`${stockShares.toLocaleString()}x ${stockTicker}`);
  }
  return parts.length > 0 ? parts.join(" + ") : "No rewards configured";
};

export const AdminMilestoneManager: React.FC = () => {
  const [milestones, setMilestones] = useState<HuntMilestone[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isReordering, setIsReordering] = useState<boolean>(false);
  const [filter, setFilter] = useState<"ALL" | HuntMilestoneCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isCustomDesc, setIsCustomDesc] = useState<boolean>(false);

  // Target mode in modal: SPECIFIC_MOB vs CUMULATIVE_POOL
  const [targetMode, setTargetMode] = useState<"SPECIFIC_MOB" | "POOL">("SPECIFIC_MOB");

  const [formData, setFormData] = useState<Partial<HuntMilestone>>({
    id: "",
    category: "SPECIFIC_MOB",
    prev_milestone_id: null,
    target_mob_id: 1002,
    required_count: 500,
    title: "",
    description: "",
    reward_zeny: 50000,
    reward_item_id: 617,
    reward_item_amount: 1,
    reward_stock_ticker: null,
    reward_stock_shares: 0,
    reward_desc: "50,000 Zeny + 1x Old Purple Box",
    tier_label: "Novice (Lv 1–40)",
    is_active: true,
    sort_order: 1,
  });

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const showFeedback = (text: string, type: "success" | "error" = "success") => {
    setFeedback({ text, type });
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchMilestones = async () => {
    setIsLoading(true);
    try {
      const res = await api.get<{ success: boolean; milestones: HuntMilestone[] }>(
        "/api/admin/milestones"
      );
      if (res.success) {
        setMilestones(res.milestones);
      }
    } catch (err: any) {
      showFeedback(err.message || "Failed to load milestones.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMilestones();
  }, []);

  // Sync auto-computed reward description when rewards change (unless custom override enabled)
  const updateRewardFields = (updates: Partial<HuntMilestone>) => {
    const updated = { ...formData, ...updates };
    if (!isCustomDesc) {
      const autoSummary = computeRewardSummary(
        Number(updated.reward_zeny) || 0,
        Number(updated.reward_item_id) || 0,
        Number(updated.reward_item_amount) || 0,
        updated.reward_stock_ticker,
        Number(updated.reward_stock_shares) || 0
      );
      updated.reward_desc = autoSummary;
    }
    setFormData(updated);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setIsCustomDesc(false);
    setTargetMode("SPECIFIC_MOB");
    const defaultMobId = 1002;
    const defaultMobName = MobNames[defaultMobId] || "Poring";
    const initialZeny = 500000;
    const initialItemId = 617;
    const initialItemAmt = 1;
    const autoSummary = computeRewardSummary(initialZeny, initialItemId, initialItemAmt, null, 0);

    setFormData({
      id: "",
      category: "SPECIFIC_MOB",
      prev_milestone_id: null,
      target_mob_id: defaultMobId,
      required_count: 1000,
      title: `${defaultMobName} Slayer`,
      description: `Defeat 1,000 ${defaultMobName}s in Midgard`,
      reward_zeny: initialZeny,
      reward_item_id: initialItemId,
      reward_item_amount: initialItemAmt,
      reward_stock_ticker: null,
      reward_stock_shares: 0,
      reward_desc: autoSummary,
      tier_label: "Novice (Lv 1–40)",
      is_active: true,
      sort_order: milestones.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (m: HuntMilestone) => {
    setIsEditing(true);
    const isPool = m.category !== "SPECIFIC_MOB";
    setTargetMode(isPool ? "POOL" : "SPECIFIC_MOB");

    const expectedAuto = computeRewardSummary(
      m.reward_zeny,
      m.reward_item_id,
      m.reward_item_amount,
      m.reward_stock_ticker,
      m.reward_stock_shares
    );
    setIsCustomDesc(m.reward_desc !== expectedAuto);

    setFormData({ ...m, prev_milestone_id: m.prev_milestone_id || null });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSelectMonster = (mobId: number, mobName: string, category: MonsterCategory) => {
    const isBoss = category === "MVP" || category === "MINI_BOSS";
    let suggestedTier = formData.tier_label || "Novice (Lv 1–40)";
    if (category === "MVP") suggestedTier = "Global / Boss";
    else if (category === "MINI_BOSS") suggestedTier = "Trans (Lv 90–99)";

    const kills = Number(formData.required_count) || (isBoss ? 25 : 1000);

    setFormData((prev) => ({
      ...prev,
      target_mob_id: mobId,
      category: "SPECIFIC_MOB",
      title: prev.title.includes("Slayer") || !prev.title ? `${mobName} Slayer` : prev.title,
      description:
        prev.description.startsWith("Defeat") || !prev.description
          ? `Defeat ${kills.toLocaleString()} ${mobName}s in Midgard`
          : prev.description,
      tier_label: suggestedTier,
    }));
  };

  const handlePoolCategoryChange = (cat: HuntMilestoneCategory) => {
    let defaultTitle = "Grand Exterminator";
    let defaultDesc = "Defeat 1,000 Normal Monsters in Midgard";
    let defaultKills = 1000;
    let defaultTier = "2nd Class (Lv 41–99)";

    if (cat === "MVP") {
      defaultTitle = "MvP Boss Champion";
      defaultDesc = "Defeat 25 MvP Bosses across all dungeons";
      defaultKills = 25;
      defaultTier = "Global / Boss";
    } else if (cat === "MINI_BOSS") {
      defaultTitle = "Mini-Boss Stalker";
      defaultDesc = "Defeat 50 Mini-Bosses in Midgard";
      defaultKills = 50;
      defaultTier = "Trans (Lv 90–99)";
    } else if (cat === "TOTAL") {
      defaultTitle = "Total Exterminator";
      defaultDesc = "Accumulate 10,000 Total Kills in Midgard";
      defaultKills = 10000;
      defaultTier = "Global / Boss";
    }

    setFormData((prev) => ({
      ...prev,
      category: cat,
      target_mob_id: 0,
      required_count: defaultKills,
      title: defaultTitle,
      description: defaultDesc,
      tier_label: defaultTier,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.title.trim()) {
      showFeedback("Milestone Title is required.", "error");
      return;
    }

    try {
      const res = await api.post<{ success: boolean; message?: string; error?: string }>(
        "/api/admin/milestones",
        formData
      );
      if (res.success) {
        showFeedback(isEditing ? "Milestone updated successfully!" : "New milestone created!");
        closeModal();
        fetchMilestones();
      } else {
        showFeedback(res.error || "Failed to save milestone.", "error");
      }
    } catch (err: any) {
      showFeedback(err.message || "Error communicating with server.", "error");
    }
  };

  const handleToggleActive = async (m: HuntMilestone) => {
    try {
      const updated = { ...m, is_active: !m.is_active };
      const res = await api.post<{ success: boolean }>("/api/admin/milestones", updated);
      if (res.success) {
        showFeedback(`Milestone [${m.title}] ${updated.is_active ? "enabled" : "disabled"}.`);
        fetchMilestones();
      }
    } catch (err: any) {
      showFeedback(err.message || "Failed to toggle status.", "error");
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete the milestone [${title}]?`)) {
      return;
    }

    try {
      const res = await api.delete<{ success: boolean }>(`/api/admin/milestones/${id}`);
      if (res.success) {
        showFeedback("Milestone removed from database.");
        fetchMilestones();
      }
    } catch (err: any) {
      showFeedback(err.message || "Failed to delete milestone.", "error");
    }
  };

  // Reordering handler
  const handleMoveOrder = async (index: number, direction: "UP" | "DOWN") => {
    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= milestones.length) return;

    const newMilestones = [...milestones];
    const [moved] = newMilestones.splice(index, 1);
    newMilestones.splice(targetIndex, 0, moved);

    // Optimistic UI update
    setMilestones(newMilestones);
    setIsReordering(true);

    try {
      const ids = newMilestones.map((m) => m.id);
      const res = await api.post<{ success: boolean }>("/api/admin/milestones/reorder", { ids });
      if (res.success) {
        showFeedback("Milestone order saved.");
      }
    } catch (err: any) {
      showFeedback(err.message || "Failed to persist new order.", "error");
      fetchMilestones();
    } finally {
      setIsReordering(false);
    }
  };

  // Filtered List
  const filteredMilestones = useMemo(() => {
    return milestones.filter((m) => {
      if (filter !== "ALL" && m.category !== filter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mobName = MobNames[m.target_mob_id]?.toLowerCase() || "";
        return (
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          m.reward_desc.toLowerCase().includes(q) ||
          mobName.includes(q) ||
          m.id.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [milestones, filter, searchQuery]);

  const activeCount = milestones.filter((m) => m.is_active).length;

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-xl flex items-center gap-2 text-xs border animate-in fade-in duration-150 ${
            feedback.type === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-danger/10 border-danger/30 text-danger"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span className="font-medium">{feedback.text}</span>
        </div>
      )}

      {/* Toolbar & Filters */}
      <div className="p-3.5 bg-surface2/40 border border-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap flex-1">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search milestone title, target mob or reward..."
              className="bg-surface border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-primary placeholder-muted focus:outline-none focus:border-accent w-48 sm:w-64"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-surface p-0.5 rounded-lg border border-border text-[11px]">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                filter === "ALL" ? "bg-accent text-background" : "text-muted hover:text-primary"
              }`}
            >
              All ({milestones.length})
            </button>
            <button
              onClick={() => setFilter("SPECIFIC_MOB")}
              className={`px-2 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                filter === "SPECIFIC_MOB"
                  ? "bg-accent text-background font-bold"
                  : "text-muted hover:text-primary"
              }`}
            >
              <Skull className="w-3 h-3" /> Mobs
            </button>
            <button
              onClick={() => setFilter("MVP")}
              className={`px-2 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                filter === "MVP"
                  ? "bg-accent text-background font-bold"
                  : "text-muted hover:text-primary"
              }`}
            >
              <Crown className="w-3 h-3" /> MvP
            </button>
            <button
              onClick={() => setFilter("MINI_BOSS")}
              className={`px-2 py-1 rounded-md font-medium transition-colors flex items-center gap-1 ${
                filter === "MINI_BOSS"
                  ? "bg-accent text-background font-bold"
                  : "text-muted hover:text-primary"
              }`}
            >
              <Swords className="w-3 h-3" /> Mini-Boss
            </button>
            <button
              onClick={() => setFilter("NORMAL")}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                filter === "NORMAL"
                  ? "bg-accent text-background font-bold"
                  : "text-muted hover:text-primary"
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setFilter("TOTAL")}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                filter === "TOTAL"
                  ? "bg-accent text-background font-bold"
                  : "text-muted hover:text-primary"
              }`}
            >
              Total
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            onClick={fetchMilestones}
            disabled={isLoading || isReordering}
            className="p-1.5 rounded-lg bg-surface border border-border text-muted hover:text-primary transition-colors"
            title="Refresh Milestones"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading || isReordering ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 bg-accent hover:bg-amber-400 text-background px-3.5 py-1.5 rounded-lg font-bold text-xs shadow transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Milestone</span>
          </button>
        </div>
      </div>

      {/* Milestones List with Reordering */}
      <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
        {filteredMilestones.length === 0 ? (
          <div className="text-center py-12 text-muted text-xs font-mono">
            {isLoading ? "Loading milestones..." : "No hunt milestones found matching criteria."}
          </div>
        ) : (
          filteredMilestones.map((m, index) => {
            const isMob = m.category === "SPECIFIC_MOB" && m.target_mob_id > 0;
            const mobName = isMob ? MobNames[m.target_mob_id] : null;

            return (
              <div
                key={m.id}
                className={`p-3 rounded-xl bg-surface2/30 border ${
                  m.is_active ? "border-border" : "border-border/40 opacity-60"
                } flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-accent/40 transition-all`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Reordering Up/Down Arrows */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0 bg-surface/80 p-0.5 rounded-lg border border-border/60">
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(index, "UP")}
                      disabled={index === 0 || isReordering}
                      className="p-1 text-muted hover:text-accent disabled:opacity-20 disabled:hover:text-muted transition-colors rounded"
                      title="Move Milestone Up"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <span className="text-[9px] font-mono font-bold text-muted px-1">
                      {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleMoveOrder(index, "DOWN")}
                      disabled={index === milestones.length - 1 || isReordering}
                      className="p-1 text-muted hover:text-accent disabled:opacity-20 disabled:hover:text-muted transition-colors rounded"
                      title="Move Milestone Down"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Sprite or Category Icon Box */}
                  <div className="w-11 h-11 rounded-lg bg-surface border border-border flex items-center justify-center shrink-0 overflow-hidden relative">
                    {isMob ? (
                      <img
                        src={getMobSpriteUrl(m.target_mob_id)}
                        alt={m.title}
                        className="w-8 h-8 object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = "none";
                        }}
                      />
                    ) : m.category === "MVP" ? (
                      <Crown className="w-5 h-5 text-accent" />
                    ) : m.category === "MINI_BOSS" ? (
                      <Swords className="w-5 h-5 text-info" />
                    ) : (
                      <Skull className="w-5 h-5 text-danger" />
                    )}
                  </div>

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-primary">{m.title}</span>
                      {m.tier_label && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-surface2 text-muted border border-border">
                          {m.tier_label}
                        </span>
                      )}
                      {m.prev_milestone_id && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Requires:{" "}
                          {milestones.find((x) => x.id === m.prev_milestone_id)?.title ||
                            m.prev_milestone_id}
                        </span>
                      )}
                      {m.is_active ? (
                        <span className="text-[9px] text-success font-mono font-bold">ACTIVE</span>
                      ) : (
                        <span className="text-[9px] text-muted font-mono">DISABLED</span>
                      )}
                    </div>

                    <div className="text-[11px] text-muted mt-0.5">
                      {m.description || (isMob && mobName ? `Hunt ${m.required_count}x ${mobName}` : "")}
                    </div>

                    <div className="text-[10px] text-accent font-mono mt-1 flex items-center gap-2 flex-wrap">
                      <span>
                        🎯 Target: {m.required_count.toLocaleString()}{" "}
                        {isMob ? (mobName || `Mob #${m.target_mob_id}`) : `${m.category} Kills`}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Gift className="w-3 h-3 text-accent" /> RODEX: {m.reward_desc}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 self-end md:self-center shrink-0">
                  <button
                    onClick={() => openEditModal(m)}
                    className="px-2.5 py-1.5 rounded-lg bg-surface border border-border hover:border-accent text-xs font-semibold text-primary flex items-center gap-1 transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-accent" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleToggleActive(m)}
                    className={`p-1.5 rounded-lg bg-surface border border-border hover:border-border text-xs ${
                      m.is_active ? "text-success" : "text-muted"
                    } transition-colors`}
                    title={m.is_active ? "Disable Milestone" : "Enable Milestone"}
                  >
                    {m.is_active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => handleDelete(m.id, m.title)}
                    className="p-1.5 rounded-lg bg-surface border border-border hover:border-danger hover:text-danger text-muted text-xs transition-colors"
                    title="Delete Milestone"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-surface2/20 border border-border rounded-xl flex items-center justify-between text-[11px] text-muted">
        <div className="flex items-center gap-2 font-mono">
          <span>{milestones.length} Milestones Configured</span>
          <span>•</span>
          <span>{activeCount} Active</span>
        </div>
        <div className="text-[10px] text-accent font-mono">
          Reordering immediately syncs progression sequence and player unlock order
        </div>
      </div>

      {/* ========================================================================= */}
      {/* EDIT / CREATE MODAL                                                       */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-background/80 backdrop-blur-sm animate-in fade-in"
          onClick={closeModal}
        >
          <div
            className="bento-card w-full max-w-xl flex flex-col p-0 overflow-hidden shadow-2xl border-border animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header (No infra port leak) */}
            <div className="bg-surface2 px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-primary">
                    {isEditing ? "Edit Hunt Milestone & Rewards" : "Create New Hunt Milestone"}
                  </h3>
                  <p className="text-[10px] text-muted">
                    Configure monster hunt targets, prerequisites, and automatic RODEX rewards
                  </p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="text-muted hover:text-primary p-1 rounded-lg hover:bg-surface transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-4 space-y-4 max-h-[78vh] overflow-y-auto">
              {/* Target Hunt Selection Section */}
              <div className="p-3 bg-surface2/40 border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <Skull className="w-3.5 h-3.5 text-accent" /> Hunt Target Definition
                  </span>
                  {/* Mode Toggle */}
                  <div className="flex items-center gap-1 bg-surface p-0.5 rounded-lg border border-border text-[10px]">
                    <button
                      type="button"
                      onClick={() => {
                        setTargetMode("SPECIFIC_MOB");
                        setFormData((prev) => ({
                          ...prev,
                          category: "SPECIFIC_MOB",
                          target_mob_id: prev.target_mob_id || 1002,
                        }));
                      }}
                      className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                        targetMode === "SPECIFIC_MOB"
                          ? "bg-accent text-background font-bold"
                          : "text-muted hover:text-primary"
                      }`}
                    >
                      Specific Monster
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTargetMode("POOL");
                        handlePoolCategoryChange("NORMAL");
                      }}
                      className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                        targetMode === "POOL"
                          ? "bg-accent text-background font-bold"
                          : "text-muted hover:text-primary"
                      }`}
                    >
                      Category Pool
                    </button>
                  </div>
                </div>

                {/* Specific Monster Combobox */}
                {targetMode === "SPECIFIC_MOB" ? (
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase mb-1">
                      Choose Target Monster (2,600+ Catalog)
                    </label>
                    <MonsterCombobox
                      selectedMobId={Number(formData.target_mob_id) || 1002}
                      onSelect={handleSelectMonster}
                    />
                  </div>
                ) : (
                  /* Cumulative Category Pool Selector */
                  <div className="space-y-2">
                    <label className="block text-[11px] font-bold text-muted uppercase mb-1">
                      Aggregate Category Pool Target
                    </label>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <button
                        type="button"
                        onClick={() => handlePoolCategoryChange("NORMAL")}
                        className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                          formData.category === "NORMAL"
                            ? "bg-accent/15 border-accent text-primary font-bold"
                            : "bg-surface border-border text-muted hover:text-primary"
                        }`}
                      >
                        <Skull className="w-4 h-4 text-muted shrink-0" />
                        <div>
                          <div className="text-xs">Normal Monsters</div>
                          <div className="text-[10px] text-muted">All non-boss creatures</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePoolCategoryChange("MINI_BOSS")}
                        className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                          formData.category === "MINI_BOSS"
                            ? "bg-accent/15 border-accent text-primary font-bold"
                            : "bg-surface border-border text-muted hover:text-primary"
                        }`}
                      >
                        <Swords className="w-4 h-4 text-info shrink-0" />
                        <div>
                          <div className="text-xs">Mini-Bosses</div>
                          <div className="text-[10px] text-muted">All elite mini-bosses</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePoolCategoryChange("MVP")}
                        className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                          formData.category === "MVP"
                            ? "bg-accent/15 border-accent text-primary font-bold"
                            : "bg-surface border-border text-muted hover:text-primary"
                        }`}
                      >
                        <Crown className="w-4 h-4 text-accent shrink-0" />
                        <div>
                          <div className="text-xs">MvP Bosses</div>
                          <div className="text-[10px] text-muted">All world & dungeon MVPs</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => handlePoolCategoryChange("TOTAL")}
                        className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                          formData.category === "TOTAL"
                            ? "bg-accent/15 border-accent text-primary font-bold"
                            : "bg-surface border-border text-muted hover:text-primary"
                        }`}
                      >
                        <Sparkles className="w-4 h-4 text-warning shrink-0" />
                        <div>
                          <div className="text-xs">Total Kills</div>
                          <div className="text-[10px] text-muted">Cumulative exterminations</div>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Required Kills */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-muted uppercase mb-1">
                    Milestone Title
                  </label>
                  <input
                    type="text"
                    value={formData.title || ""}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-accent font-medium"
                    placeholder="e.g. Orc Village Conqueror"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase mb-1">
                    Required Kills
                  </label>
                  <input
                    type="number"
                    value={formData.required_count || 100}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        required_count: Number(e.target.value),
                      })
                    }
                    className="w-full bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-accent font-mono font-bold"
                    required
                  />
                </div>
              </div>

              {/* Description & Level Tier Badge */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[11px] font-bold text-muted uppercase mb-1">
                    Description Text
                  </label>
                  <input
                    type="text"
                    value={formData.description || ""}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-accent"
                    placeholder="e.g. Defeat 1,000 Orc Warriors in Gef_Fild"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase mb-1">
                    Level Tier Badge
                  </label>
                  <select
                    value={formData.tier_label || "Novice (Lv 1–40)"}
                    onChange={(e) => setFormData({ ...formData, tier_label: e.target.value })}
                    className="w-full bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:border-accent"
                  >
                    {TIER_OPTIONS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Prerequisite Milestone Unlock Condition */}
              <div>
                <label className="block text-[11px] font-bold text-muted uppercase mb-1 flex items-center gap-1.5">
                  <Lock className="w-3 h-3 text-accent" /> Prerequisite Milestone (Unlock Condition)
                </label>
                <select
                  value={formData.prev_milestone_id || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prev_milestone_id: e.target.value || null,
                    })
                  }
                  className="w-full bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-accent"
                >
                  <option value="">None (Available Immediately)</option>
                  {milestones
                    .filter((other) => other.id !== formData.id)
                    .map((other) => (
                      <option key={other.id} value={other.id}>
                        {other.title} ({other.required_count.toLocaleString()} kills)
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-muted mt-1">
                  Players must complete and claim this milestone before they can progress or claim this one.
                </p>
              </div>

              {/* ================================================================= */}
              {/* MODULAR RODEX REWARDS BUILDER                                     */}
              {/* ================================================================= */}
              <div className="p-3 bg-surface2/40 border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                  <span className="text-xs font-bold text-accent flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5" /> Configurable RODEX Rewards
                  </span>
                  <span className="text-[10px] text-muted font-mono">Dispatched via RO Mail</span>
                </div>

                {/* 1. Zeny Reward */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold text-muted uppercase flex items-center gap-1">
                      <Coins className="w-3 h-3 text-accent" /> Zeny Reward
                    </label>
                    <span className="text-[11px] font-mono text-accent font-bold">
                      {(Number(formData.reward_zeny) || 0).toLocaleString()} z
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={formData.reward_zeny || 0}
                      onChange={(e) =>
                        updateRewardFields({ reward_zeny: Number(e.target.value) })
                      }
                      className="w-40 bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-accent focus:outline-none focus:border-accent"
                      placeholder="100000"
                    />
                    <div className="flex items-center gap-1 flex-wrap text-[10px]">
                      <button
                        type="button"
                        onClick={() =>
                          updateRewardFields({
                            reward_zeny: (Number(formData.reward_zeny) || 0) + 50000,
                          })
                        }
                        className="px-1.5 py-0.5 rounded bg-surface border border-border hover:border-accent text-muted hover:text-primary transition-colors"
                      >
                        +50k
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateRewardFields({
                            reward_zeny: (Number(formData.reward_zeny) || 0) + 100000,
                          })
                        }
                        className="px-1.5 py-0.5 rounded bg-surface border border-border hover:border-accent text-muted hover:text-primary transition-colors"
                      >
                        +100k
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateRewardFields({
                            reward_zeny: (Number(formData.reward_zeny) || 0) + 500000,
                          })
                        }
                        className="px-1.5 py-0.5 rounded bg-surface border border-border hover:border-accent text-muted hover:text-primary transition-colors"
                      >
                        +500k
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateRewardFields({
                            reward_zeny: (Number(formData.reward_zeny) || 0) + 1000000,
                          })
                        }
                        className="px-1.5 py-0.5 rounded bg-surface border border-border hover:border-accent text-muted hover:text-primary transition-colors"
                      >
                        +1M
                      </button>
                      <button
                        type="button"
                        onClick={() => updateRewardFields({ reward_zeny: 0 })}
                        className="px-1.5 py-0.5 rounded bg-surface border border-border hover:border-danger hover:text-danger text-muted transition-colors"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Item Reward with ItemCombobox */}
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1 flex items-center gap-1">
                    <Package className="w-3 h-3 text-info" /> Item Reward (Search 30,000+ Items)
                  </label>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div className="col-span-2">
                      <ItemCombobox
                        selectedItemId={Number(formData.reward_item_id) || 0}
                        onSelect={(itemId) =>
                          updateRewardFields({
                            reward_item_id: itemId,
                            reward_item_amount:
                              itemId > 0 ? Number(formData.reward_item_amount) || 1 : 0,
                          })
                        }
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={formData.reward_item_amount || 0}
                        onChange={(e) =>
                          updateRewardFields({
                            reward_item_amount: Number(e.target.value),
                          })
                        }
                        disabled={!formData.reward_item_id || formData.reward_item_id <= 0}
                        className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-primary focus:outline-none focus:border-accent disabled:opacity-40"
                        placeholder="Quantity (e.g. 1)"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. Stock / Investment Reward */}
                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-success" /> Stock / ETF Reward (Midgard Stock Exchange)
                  </label>
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <div className="col-span-2">
                      <select
                        value={formData.reward_stock_ticker || ""}
                        onChange={(e) =>
                          updateRewardFields({
                            reward_stock_ticker: e.target.value || null,
                            reward_stock_shares:
                              e.target.value ? Number(formData.reward_stock_shares) || 50 : 0,
                          })
                        }
                        className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:border-accent font-mono"
                      >
                        {STOCK_OPTIONS.map((s) => (
                          <option key={s.ticker} value={s.ticker}>
                            {s.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <input
                        type="number"
                        value={formData.reward_stock_shares || 0}
                        onChange={(e) =>
                          updateRewardFields({
                            reward_stock_shares: Number(e.target.value),
                          })
                        }
                        disabled={!formData.reward_stock_ticker}
                        className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-primary focus:outline-none focus:border-accent disabled:opacity-40"
                        placeholder="Shares (e.g. 50)"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Live Reactive Reward Summary Banner */}
                <div className="pt-2 border-t border-border/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-muted uppercase flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-accent" /> Auto-Generated Reward Summary
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCustomDesc(!isCustomDesc)}
                      className="text-[10px] text-accent hover:underline flex items-center gap-1"
                    >
                      <Sliders className="w-2.5 h-2.5" />
                      {isCustomDesc ? "Reset to Auto Summary" : "Edit Custom Description"}
                    </button>
                  </div>

                  {isCustomDesc ? (
                    <input
                      type="text"
                      value={formData.reward_desc || ""}
                      onChange={(e) => setFormData({ ...formData, reward_desc: e.target.value })}
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:border-accent font-medium"
                      placeholder="Custom lore reward summary..."
                    />
                  ) : (
                    <div className="p-2 rounded-lg bg-surface border border-accent/30 text-xs text-accent font-mono flex items-center gap-2">
                      <Gift className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{formData.reward_desc || "No rewards configured"}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Active Toggle in Progression */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface2/30 border border-border">
                <div>
                  <div className="text-xs font-bold text-primary">Active in Progression</div>
                  <div className="text-[10px] text-muted">Visible and trackable by all players</div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(formData.is_active)}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 rounded text-accent focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary hover:bg-surface transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-bold bg-accent hover:bg-amber-400 text-background flex items-center gap-1.5 transition-colors shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEditing ? "Save Changes" : "Create Milestone"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
