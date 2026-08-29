import React, { useState, useEffect } from "react";
import { HuntMilestone, HuntMilestoneCategory, MobNames } from "@rathena/shared";
import { api } from "../../lib/api";
import { getMobSpriteUrl } from "../../lib/assets";
import {
  Target,
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
} from "lucide-react";



const SAMPLE_MOBS = [
  { id: 1002, name: "Poring (Lv 1, Novice)" },
  { id: 1023, name: "Orc Warrior (Lv 44, 2nd Class)" },
  { id: 1163, name: "Raydric (Lv 95, Trans)" },
  { id: 1836, name: "Magmaring (Lv 110, 3rd Class)" },
  { id: 20929, name: "Giant Caput (Lv 213, 4th Class)" },
];

const TIER_OPTIONS = [
  "Novice (Lv 1–40)",
  "2nd Class (Lv 41–99)",
  "Trans (Lv 90–99)",
  "3rd Class (Lv 100–185)",
  "4th Class (Lv 200–250+)",
  "Global / Boss",
];

export const AdminMilestoneManager: React.FC = () => {
  const [milestones, setMilestones] = useState<HuntMilestone[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [filter, setFilter] = useState<"ALL" | HuntMilestoneCategory>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<HuntMilestone>>({
    id: "",
    category: "SPECIFIC_MOB",
    prev_milestone_id: null,
    target_mob_id: 1002,
    required_count: 500,
    title: "",
    description: "",
    reward_zeny: 50000,
    reward_item_id: 501,
    reward_item_amount: 50,
    reward_desc: "50,000 Zeny + 50x Red Potions",
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

  const openCreateModal = () => {
    setIsEditing(false);
    setFormData({
      id: `custom_${Date.now()}`,
      category: "SPECIFIC_MOB",
      prev_milestone_id: null,
      target_mob_id: 1002,
      required_count: 1000,
      title: "",
      description: "",
      reward_zeny: 500000,
      reward_item_id: 617,
      reward_item_amount: 1,
      reward_desc: "500,000 Zeny + 1x Old Purple Box",
      tier_label: "Novice (Lv 1–40)",
      is_active: true,
      sort_order: milestones.length + 1,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (m: HuntMilestone) => {
    setIsEditing(true);
    setFormData({ ...m, prev_milestone_id: m.prev_milestone_id || null });
    setIsModalOpen(true);
  };


  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.id || !formData.title) {
      showFeedback("Milestone ID and Title are required.", "error");
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

  // Filtered List
  const filteredMilestones = milestones.filter((m) => {
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

  const activeCount = milestones.filter((m) => m.is_active).length;

  return (
    <div className="space-y-4">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`p-3 rounded-xl flex items-center gap-2 text-xs border ${
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
              placeholder="Search title, target mob or reward..."
              className="bg-surface border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-primary placeholder-muted focus:outline-none focus:border-accent w-48 sm:w-60"
            />
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 bg-surface p-0.5 rounded-lg border border-border text-[11px]">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-2 py-0.5 rounded font-semibold transition-colors ${
                filter === "ALL" ? "bg-accent text-background" : "text-muted hover:text-primary"
              }`}
            >
              All ({milestones.length})
            </button>
            <button
              onClick={() => setFilter("SPECIFIC_MOB")}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
                filter === "SPECIFIC_MOB"
                  ? "bg-accent text-background font-bold"
                  : "text-muted hover:text-primary"
              }`}
            >
              Targets
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
              onClick={() => setFilter("TOTAL")}
              className={`px-2 py-0.5 rounded font-medium transition-colors ${
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
            disabled={isLoading}
            className="p-1.5 rounded-lg bg-surface border border-border text-muted hover:text-primary transition-colors"
            title="Refresh Milestones"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={openCreateModal}
            className="flex items-center gap-1.5 bg-accent hover:bg-amber-400 text-background px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Create Milestone</span>
          </button>
        </div>
      </div>

      {/* Milestones List */}
      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {filteredMilestones.length === 0 ? (
          <div className="text-center py-10 text-muted text-xs font-mono">
            {isLoading ? "Loading milestones..." : "No milestones found matching criteria."}
          </div>
        ) : (
          filteredMilestones.map((m) => {
            const isMob = m.category === "SPECIFIC_MOB" && m.target_mob_id > 0;

            return (
              <div
                key={m.id}
                className={`p-3 rounded-xl bg-surface2/30 border ${
                  m.is_active ? "border-border" : "border-border/40 opacity-60"
                } flex flex-col md:flex-row items-start md:items-center justify-between gap-3 hover:border-accent/40 transition-all`}
              >
                <div className="flex items-center gap-3 min-w-0">
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
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-xs text-primary">{m.title}</span>
                      {m.tier_label && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-surface2 text-muted border border-border">
                          {m.tier_label}
                        </span>
                      )}
                      {m.prev_milestone_id && (
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Requires: {milestones.find((x) => x.id === m.prev_milestone_id)?.title || m.prev_milestone_id}
                        </span>
                      )}
                      {m.is_active ? (
                        <span className="text-[9px] text-success font-mono font-bold">ACTIVE</span>
                      ) : (
                        <span className="text-[9px] text-muted font-mono">DISABLED</span>
                      )}

                    </div>
                    <div className="text-[11px] text-muted mt-0.5">{m.description}</div>
                    <div className="text-[10px] text-accent font-mono mt-1 flex items-center gap-2 flex-wrap">
                      <span>🎯 Target: {m.required_count.toLocaleString()} kills</span>
                      <span>•</span>
                      <span>🎁 RODEX: {m.reward_desc}</span>
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
          <span>Table <code className="text-primary font-bold">solo_milestones</code></span>
          <span>•</span>
          <span>{activeCount} Active</span>
        </div>
        <div className="text-[10px] text-accent font-mono">
          Changes immediately update player tracking and RODEX delivery payloads
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
            {/* Modal Header */}
            <div className="bg-surface2 px-4 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-primary">
                    {isEditing ? "Edit Hunt Milestone & Rewards" : "Create New Hunt Milestone"}
                  </h3>
                  <p className="text-[10px] text-muted font-mono">
                    Server Database (:3306)
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
            <form onSubmit={handleSave} className="p-4 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase mb-1">
                    Unique Milestone ID
                  </label>
                  <input

                    type="text"
                    value={formData.id || ""}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    disabled={isEditing}
                    className="w-full bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-accent font-mono disabled:opacity-50"
                    placeholder="e.g. orc_warrior_1000"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-muted uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category || "SPECIFIC_MOB"}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        category: e.target.value as HuntMilestoneCategory,
                      })
                    }
                    className="w-full bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-accent"
                  >
                    <option value="SPECIFIC_MOB">Specific Monster Target</option>
                    <option value="MVP">MvP Boss Slayer</option>
                    <option value="MINI_BOSS">Mini-Boss Hunter</option>
                    <option value="TOTAL">Total Kills (Exterminator)</option>
                    <option value="NORMAL">Normal Monsters</option>
                  </select>
                </div>
              </div>

              {formData.category === "SPECIFIC_MOB" && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase mb-1">
                      Quick Preset Target
                    </label>
                    <select
                      value={formData.target_mob_id || 1002}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          target_mob_id: Number(e.target.value),
                        })
                      }
                      className="w-full bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs text-primary focus:outline-none focus:border-accent font-mono"
                    >
                      {SAMPLE_MOBS.map((m) => (
                        <option key={m.id} value={m.id}>
                          #{m.id} - {m.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase mb-1">
                      Custom Mob ID
                    </label>
                    <input
                      type="number"
                      value={formData.target_mob_id || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          target_mob_id: Number(e.target.value),
                        })
                      }
                      className="w-full bg-surface2 border border-border rounded-lg px-3 py-1.5 text-xs font-mono text-primary focus:outline-none focus:border-accent font-bold"
                    />
                  </div>
                </div>
              )}

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

              <div>
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
                        {other.title} ({other.id})
                      </option>
                    ))}
                </select>
                <p className="text-[10px] text-muted mt-1">
                  Players must complete and claim this milestone before they can progress or claim this one.
                </p>
              </div>

              {/* Rewards Box */}

              <div className="p-3 bg-surface2/40 border border-border rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                  <span className="text-xs font-bold text-accent flex items-center gap-1.5">
                    <Gift className="w-3.5 h-3.5" /> Configurable RODEX Rewards
                  </span>
                  <span className="text-[10px] text-muted font-mono">Dispatched via RO Mail</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase mb-1">
                      Zeny Reward (z)
                    </label>
                    <input
                      type="number"
                      value={formData.reward_zeny || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reward_zeny: Number(e.target.value),
                        })
                      }
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-accent focus:outline-none focus:border-accent"
                      placeholder="100000"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase mb-1">
                      Reward Item ID
                    </label>
                    <input
                      type="number"
                      value={formData.reward_item_id || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reward_item_id: Number(e.target.value),
                        })
                      }
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-primary focus:outline-none focus:border-accent"
                      placeholder="604 (Dead Branch)"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase mb-1">
                      Item Amount
                    </label>
                    <input
                      type="number"
                      value={formData.reward_item_amount || 0}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          reward_item_amount: Number(e.target.value),
                        })
                      }
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-primary focus:outline-none focus:border-accent"
                      placeholder="5"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-muted uppercase mb-1">
                      Level Tier Badge
                    </label>
                    <select
                      value={formData.tier_label || "Global / Boss"}
                      onChange={(e) => setFormData({ ...formData, tier_label: e.target.value })}
                      className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:border-accent"
                    >
                      {TIER_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">
                    Reward Description Summary
                  </label>
                  <input
                    type="text"
                    value={formData.reward_desc || ""}
                    onChange={(e) => setFormData({ ...formData, reward_desc: e.target.value })}
                    className="w-full bg-surface border border-border rounded-lg px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:border-accent"
                    placeholder="e.g. 100,000 Zeny + 5x Dead Branches"
                  />
                </div>
              </div>

              {/* Active Toggle & Sort Order */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface2/30 border border-border">
                  <div>
                    <div className="text-xs font-bold text-primary">Active in Progression</div>
                    <div className="text-[10px] text-muted">Visible to all players</div>
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

                <div>
                  <label className="block text-[10px] font-bold text-muted uppercase mb-1">
                    Sort Order
                  </label>
                  <input
                    type="number"
                    value={formData.sort_order || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, sort_order: Number(e.target.value) })
                    }
                    className="w-full bg-surface2 border border-border rounded-lg px-2.5 py-1.5 text-xs font-mono text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-border flex items-center justify-between">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted hover:text-primary hover:bg-surface transition-colors"
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
