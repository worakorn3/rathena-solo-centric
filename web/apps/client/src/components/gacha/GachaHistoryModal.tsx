import React, { useEffect } from "react";
import { History, X } from "lucide-react";
import { GachaHistoryLog } from "@rathena/shared";

interface GachaHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: GachaHistoryLog[];
}

export const GachaHistoryModal: React.FC<GachaHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bento-card w-full max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden shadow-2xl border border-border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-surface2 border-b border-border px-4 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 font-bold text-sm text-primary">
            <History className="w-4 h-4 text-info" />
            <span>Pull History Audit Log</span>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary p-1 rounded hover:bg-surface transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Table */}
        <div className="p-4 overflow-y-auto max-h-[65vh]">
          {history.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted">
              No pull history recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-surface2/60 text-muted font-mono uppercase text-[10px] border-b border-border">
                <tr>
                  <th className="p-2.5">Date/Time</th>
                  <th className="p-2.5">Banner</th>
                  <th className="p-2.5">Item Won</th>
                  <th className="p-2.5">Tier</th>
                  <th className="p-2.5">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40 font-mono text-xs">
                {history.map((h) => {
                  const isSSR = h.tier === "SSR";
                  const isSR = h.tier === "SR";
                  const tierColor = isSSR
                    ? "text-amber-400 font-bold"
                    : isSR
                    ? "text-purple-400 font-bold"
                    : "text-sky-400";

                  return (
                    <tr key={h.id} className="hover:bg-surface2/30 transition-colors">
                      <td className="p-2.5 text-muted whitespace-nowrap">
                        {new Date(h.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="p-2.5 text-primary whitespace-nowrap">{h.bannerName || h.bannerId}</td>
                      <td className="p-2.5 text-primary font-bold">
                        {h.itemName}
                        {h.refine > 0 && ` +${h.refine}`}
                        {h.amount > 1 && ` x${h.amount}`}
                      </td>
                      <td className={`p-2.5 ${tierColor}`}>{h.tier}</td>
                      <td className="p-2.5 text-accent">{h.zenySpent.toLocaleString()} Z</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-surface2 border-t border-border px-4 py-2.5 flex items-center justify-between text-xs text-muted shrink-0">
          <span>Recent Pulls Ledger</span>
          <button
            onClick={onClose}
            className="bg-surface hover:bg-surface2 text-primary border border-border px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
