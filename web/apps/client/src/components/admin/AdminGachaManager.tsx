import React, { useState, useEffect } from "react";
import { Sliders, RefreshCw, Plus, Trash2, CheckCircle, AlertTriangle, Activity, Settings, Package } from "lucide-react";
import { GachaBanner, GachaPoolItem, GachaTier } from "@rathena/shared";
import { api } from "../../lib/api";
import { getItemIconUrl } from "../../lib/assets";

interface AdminGachaManagerProps {
  adminKey: string;
}

export const AdminGachaManager: React.FC<AdminGachaManagerProps> = ({ adminKey }) => {
  const [banners, setBanners] = useState<GachaBanner[]>([]);
  const [selectedBannerId, setSelectedBannerId] = useState<string>("supplies");
  const [poolItems, setPoolItems] = useState<GachaPoolItem[]>([]);
  const [tierFilter, setTierFilter] = useState<"ALL" | GachaTier>("ALL");
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Edit Banner Form State
  const [showEditBanner, setShowEditBanner] = useState(false);
  const [editBasePrice, setEditBasePrice] = useState<number>(10000);
  const [editPityThreshold, setEditPityThreshold] = useState<number>(50);
  const [editSsrRate, setEditSsrRate] = useState<number>(2.0);
  const [editSrRate, setEditSrRate] = useState<number>(18.0);
  const [editRRate, setEditRRate] = useState<number>(80.0);

  // Add Item Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newNameId, setNewNameId] = useState<number>(504);
  const [newItemName, setNewItemName] = useState<string>("White Potion");
  const [newAmount, setNewAmount] = useState<number>(20);
  const [newRefine, setNewRefine] = useState<number>(0);
  const [newTier, setNewTier] = useState<GachaTier>("R");
  const [newWeight, setNewWeight] = useState<number>(50);

  // Simulator State
  const [simResults, setSimResults] = useState<{ count: number; ssrCount: number; srCount: number; rCount: number } | null>(null);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const bannerRes = await api.get<{ success: boolean; banners: GachaBanner[] }>("/api/gacha/banners");
      setBanners(bannerRes.banners);

      const poolRes = await fetch("/api/gacha/admin/pool", {
        headers: {
          "x-admin-key": adminKey,
          ...(localStorage.getItem("rathena_token")
            ? { Authorization: `Bearer ${localStorage.getItem("rathena_token")}` }
            : {}),
        },
      });
      const poolData = await poolRes.json();
      if (poolData.success) {
        setPoolItems(poolData.items);
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to load gacha data." });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [adminKey]);

  const activeBanner = banners.find((b) => b.bannerId === selectedBannerId) || banners[0];

  useEffect(() => {
    if (activeBanner) {
      setEditBasePrice(activeBanner.basePrice);
      setEditPityThreshold(activeBanner.pityThreshold);
      setEditSsrRate(activeBanner.ssrRate);
      setEditSrRate(activeBanner.srRate);
      setEditRRate(activeBanner.rRate);
    }
  }, [selectedBannerId, banners]);

  const filteredPool = poolItems.filter((item) => {
    if (item.bannerId !== selectedBannerId) return false;
    if (tierFilter !== "ALL" && item.tier !== tierFilter) return false;
    return true;
  });

  // Force Rotate Banners
  const handleForceRotate = async () => {
    try {
      const res = await fetch("/api/gacha/admin/rotate", {
        method: "POST",
        headers: {
          "x-admin-key": adminKey,
          ...(localStorage.getItem("rathena_token")
            ? { Authorization: `Bearer ${localStorage.getItem("rathena_token")}` }
            : {}),
        },
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", text: "⚡ All 4 Banners force-rotated with fresh daily spotlights!" });
        fetchAdminData();
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to rotate banners." });
    }
  };

  // Update Banner Configuration (Base Price, Pity, Rates)
  const handleUpdateBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBanner) return;
    try {
      const res = await fetch("/api/gacha/admin/banner", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
          ...(localStorage.getItem("rathena_token")
            ? { Authorization: `Bearer ${localStorage.getItem("rathena_token")}` }
            : {}),
        },
        body: JSON.stringify({
          bannerId: activeBanner.bannerId,
          name: activeBanner.name,
          description: activeBanner.description,
          icon: activeBanner.icon,
          basePrice: Number(editBasePrice),
          ssrRate: Number(editSsrRate),
          srRate: Number(editSrRate),
          rRate: Number(editRRate),
          pityThreshold: Number(editPityThreshold),
          enabled: activeBanner.enabled !== false,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", text: `⚡ Updated ${activeBanner.name} parameters (Price: ${Number(editBasePrice).toLocaleString()} Z, Pity: ${editPityThreshold}, Rates: ${editSsrRate}% / ${editSrRate}% / ${editRRate}%)!` });
        setShowEditBanner(false);
        fetchAdminData();
      } else {
        throw new Error(data.error || "Failed to update banner.");
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to update banner." });
    }
  };

  // Add Item to Pool
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/gacha/admin/item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          bannerId: selectedBannerId,
          nameId: newNameId,
          itemName: newItemName,
          amount: newAmount,
          refine: newRefine,
          tier: newTier,
          weight: newWeight,
          enabled: true,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", text: `Added ${newItemName} to ${selectedBannerId} pool!` });
        setShowAddForm(false);
        fetchAdminData();
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to add item." });
    }
  };

  // Delete Item from Pool
  const handleDeleteItem = async (id: number) => {
    if (!confirm("Are you sure you want to remove this item from the drop pool?")) return;
    try {
      const res = await fetch(`/api/gacha/admin/item/${id}`, {
        method: "DELETE",
        headers: { "x-admin-key": adminKey },
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ type: "success", text: "Item removed from pool." });
        fetchAdminData();
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: err.message || "Failed to delete item." });
    }
  };

  // Run Simulation
  const handleSimulate = (count: number) => {
    if (!activeBanner) return;
    let ssr = 0;
    let sr = 0;
    let r = 0;

    for (let i = 0; i < count; i++) {
      const roll = Math.random() * 100;
      if (roll < activeBanner.ssrRate) ssr++;
      else if (roll < activeBanner.ssrRate + activeBanner.srRate) sr++;
      else r++;
    }

    setSimResults({ count, ssrCount: ssr, srCount: sr, rCount: r });
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Bar & Force Rotate */}
      <div className="p-3.5 rounded-xl bg-surface2/50 border border-border space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-accent" />
            <span className="font-bold text-xs text-primary">Banner Configuration</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowEditBanner(!showEditBanner)}
              className="bg-surface2 hover:bg-surface2/80 text-primary border border-border px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-accent" />
              <span>{showEditBanner ? "Close Editor" : "Edit Parameters"}</span>
            </button>
            <button
              onClick={handleForceRotate}
              className="bg-accent/20 hover:bg-accent/30 text-accent border border-accent/40 font-bold px-2.5 py-1 rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>⚡ Force Rotate</span>
            </button>
          </div>
        </div>

        {feedback && (
          <div
            className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
              feedback.type === "success"
                ? "bg-success/10 border-success/30 text-success"
                : "bg-danger/10 border-danger/30 text-danger"
            }`}
          >
            {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
            <span>{feedback.text}</span>
          </div>
        )}

        {/* Banner Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {banners.map((b) => (
            <button
              key={b.bannerId}
              onClick={() => setSelectedBannerId(b.bannerId)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedBannerId === b.bannerId
                  ? "bg-accent text-background shadow-sm"
                  : "bg-surface text-muted hover:text-primary border border-border"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>

        {/* Edit Banner Parameters Form */}
        {showEditBanner && activeBanner && (
          <form onSubmit={handleUpdateBanner} className="p-3.5 rounded-xl bg-surface border border-accent/40 space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-accent">Edit {activeBanner.name} Parameters</span>
              <span className="text-[10px] font-mono text-muted">
                Total Rates: {(Number(editSsrRate) + Number(editSrRate) + Number(editRRate)).toFixed(1)}%
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div>
                <label className="text-[10px] text-muted uppercase">Base Price (Z)</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editBasePrice}
                  onChange={(e) => setEditBasePrice(Number(e.target.value))}
                  className="w-full bg-background border border-border focus:border-accent rounded p-1.5 text-xs text-primary font-mono outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase">Pity Pulls</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editPityThreshold}
                  onChange={(e) => setEditPityThreshold(Number(e.target.value))}
                  className="w-full bg-background border border-border focus:border-accent rounded p-1.5 text-xs text-primary font-mono outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase text-amber-400 font-bold">SSR Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  min={0.1}
                  max={100}
                  value={editSsrRate}
                  onChange={(e) => setEditSsrRate(Number(e.target.value))}
                  className="w-full bg-background border border-border focus:border-accent rounded p-1.5 text-xs text-amber-400 font-mono outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase text-purple-400 font-bold">SR Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  min={0.1}
                  max={100}
                  value={editSrRate}
                  onChange={(e) => setEditSrRate(Number(e.target.value))}
                  className="w-full bg-background border border-border focus:border-accent rounded p-1.5 text-xs text-purple-400 font-mono outline-none font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase text-sky-400 font-bold">R Rate (%)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  min={0.1}
                  max={100}
                  value={editRRate}
                  onChange={(e) => setEditRRate(Number(e.target.value))}
                  className="w-full bg-background border border-border focus:border-accent rounded p-1.5 text-xs text-sky-400 font-mono outline-none font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowEditBanner(false)}
                className="px-2.5 py-1 rounded text-xs text-muted hover:text-primary cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-accent hover:bg-accent/90 text-background font-bold text-xs px-3.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}

        {activeBanner && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 font-mono text-xs">
            <div className="p-2 rounded bg-surface border border-border">
              <span className="text-[10px] text-muted uppercase font-sans">Base Price:</span>
              <div className="font-bold text-accent">{activeBanner.basePrice.toLocaleString()} Z</div>
            </div>
            <div className="p-2 rounded bg-surface border border-border">
              <span className="text-[10px] text-muted uppercase font-sans">Pity Threshold:</span>
              <div className="font-bold text-primary">{activeBanner.pityThreshold} pulls</div>
            </div>
            <div className="p-2 rounded bg-surface border border-border">
              <span className="text-[10px] text-muted uppercase font-sans">SSR / SR / R Rates:</span>
              <div className="font-bold text-amber-400">
                {activeBanner.ssrRate}% / {activeBanner.srRate}% / {activeBanner.rRate}%
              </div>
            </div>
            <div className="p-2 rounded bg-surface border border-border">
              <span className="text-[10px] text-muted uppercase font-sans">Effective Price:</span>
              <div className="font-bold text-emerald-400">{activeBanner.effectivePrice.toLocaleString()} Z</div>
            </div>
          </div>
        )}
      </div>

      {/* Master Item Pool Table */}
      <div className="p-3.5 rounded-xl bg-surface2/50 border border-border space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-info" />
            <span className="font-bold text-xs text-primary">
              Master Item Pool ({filteredPool.length} items)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-surface p-1 rounded-lg border border-border text-xs">
              {(["ALL", "SSR", "SR", "R"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                    tierFilter === t ? "bg-accent text-background" : "text-muted hover:text-primary"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Item</span>
            </button>
          </div>
        </div>

        {/* Add Item Form */}
        {showAddForm && (
          <form onSubmit={handleAddItem} className="p-3 rounded-lg bg-surface border border-accent/40 space-y-2.5">
            <div className="font-bold text-xs text-accent">Add New Item to {selectedBannerId}</div>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
              <div>
                <label className="text-[10px] text-muted uppercase">Item ID</label>
                <input
                  type="number"
                  required
                  value={newNameId}
                  onChange={(e) => setNewNameId(Number(e.target.value))}
                  className="w-full bg-background border border-border focus:border-accent rounded p-1 text-xs text-primary font-mono outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-[10px] text-muted uppercase">Item Name</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full bg-background border border-border focus:border-accent rounded p-1 text-xs text-primary outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase">Tier</label>
                <select
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value as GachaTier)}
                  className="w-full bg-background border border-border focus:border-accent rounded p-1 text-xs text-primary outline-none"
                >
                  <option value="SSR">SSR (5★)</option>
                  <option value="SR">SR (4★)</option>
                  <option value="R">R (3★)</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase">Amount</label>
                <input
                  type="number"
                  min={1}
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  className="w-full bg-background border border-border focus:border-accent rounded p-1 text-xs text-primary font-mono outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-muted uppercase">Weight</label>
                <input
                  type="number"
                  min={1}
                  value={newWeight}
                  onChange={(e) => setNewWeight(Number(e.target.value))}
                  className="w-full bg-background border border-border focus:border-accent rounded p-1 text-xs text-primary font-mono outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2.5 py-1 rounded text-xs text-muted hover:text-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-accent text-background font-bold text-xs px-3 py-1 rounded-lg"
              >
                Save Item
              </button>
            </div>
          </form>
        )}

        {/* Pool Table */}
        <div className="overflow-y-auto max-h-56">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-surface text-muted font-mono uppercase text-[10px] border-b border-border">
              <tr>
                <th className="p-2">ID</th>
                <th className="p-2">Name</th>
                <th className="p-2">Tier</th>
                <th className="p-2">Amount</th>
                <th className="p-2">Refine</th>
                <th className="p-2">Weight</th>
                <th className="p-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 font-mono text-xs">
              {filteredPool.map((item) => (
                <tr key={item.id} className="hover:bg-surface/50">
                  <td className="p-2 text-muted whitespace-nowrap">
                    <img
                      src={getItemIconUrl(item.nameId)}
                      alt={item.itemName}
                      className="ro-icon w-5 h-5 inline-block mr-1.5 align-middle"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = "none";
                      }}
                    />
                    #{item.nameId}
                  </td>
                  <td className="p-2 text-primary font-sans font-bold">{item.itemName}</td>
                  <td className="p-2">
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded font-bold ${
                        item.tier === "SSR"
                          ? "bg-amber-400 text-background"
                          : item.tier === "SR"
                          ? "bg-purple-400 text-background"
                          : "bg-sky-400/20 text-sky-300"
                      }`}
                    >
                      {item.tier}
                    </span>
                  </td>
                  <td className="p-2 text-primary">x{item.amount}</td>
                  <td className="p-2 text-muted">+{item.refine}</td>
                  <td className="p-2 text-accent">{item.weight}</td>
                  <td className="p-2 text-right">
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="text-muted hover:text-danger p-1 transition-colors"
                      title="Delete Item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Simulator Sandbox */}
      <div className="p-3.5 rounded-xl bg-surface2/50 border border-border space-y-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-info" />
          <span className="font-bold text-xs text-primary">
            Pull Simulator Sandbox (Verify Drop Rates)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSimulate(100)}
            className="bg-surface hover:bg-surface2 text-primary border border-border px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Simulate 100 Pulls
          </button>
          <button
            onClick={() => handleSimulate(1000)}
            className="bg-surface hover:bg-surface2 text-primary border border-border px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Simulate 1,000 Pulls
          </button>
        </div>

        {simResults && (
          <div className="p-3 rounded-lg bg-background border border-border font-mono text-xs space-y-1">
            <div className="font-bold text-accent">
              Results for {simResults.count.toLocaleString()} Pulls on {activeBanner?.name}:
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div className="p-2 rounded bg-amber-400/10 border border-amber-400/20 text-amber-400 font-bold">
                SSR: {simResults.ssrCount} ({((simResults.ssrCount / simResults.count) * 100).toFixed(1)}%)
              </div>
              <div className="p-2 rounded bg-purple-400/10 border border-purple-400/20 text-purple-400 font-bold">
                SR: {simResults.srCount} ({((simResults.srCount / simResults.count) * 100).toFixed(1)}%)
              </div>
              <div className="p-2 rounded bg-sky-400/10 border border-sky-400/20 text-sky-400 font-bold">
                R: {simResults.rCount} ({((simResults.rCount / simResults.count) * 100).toFixed(1)}%)
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
