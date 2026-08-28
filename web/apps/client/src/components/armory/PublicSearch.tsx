import React, { useState, useEffect } from "react";
import { Search, X, Shield, Award, MapPin, User, ChevronRight } from "lucide-react";
import { CharacterDetail, CharacterSummary } from "@rathena/shared";
import { api } from "../../lib/api";
import { StatusWindow } from "../character/StatusWindow";
import { Paperdoll } from "../character/Paperdoll";
import { formatZeny } from "../../lib/assets";

interface PublicSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PublicSearch: React.FC<PublicSearchProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CharacterSummary[]>([]);
  const [rankings, setRankings] = useState<CharacterSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [inspectChar, setInspectChar] = useState<CharacterDetail | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Load top rankings initially
      api.get<{ success: boolean; rankings: CharacterSummary[] }>("/api/character/rankings")
        .then((res) => {
          if (res.success) setRankings(res.rankings);
        })
        .catch(() => {});
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get<{ success: boolean; results: CharacterSummary[] }>(
          `/api/character/search?q=${encodeURIComponent(query)}`
        );
        if (res.success) setResults(res.results);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelectChar = async (charId: number) => {
    setInspectLoading(true);
    try {
      const res = await api.get<{ success: boolean; character: CharacterDetail }>(
        `/api/character/${charId}`
      );
      if (res.success && res.character) {
        setInspectChar(res.character);
      }
    } catch {
      // Ignore
    } finally {
      setInspectLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        if (inspectChar) {
          setInspectChar(null);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, inspectChar, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bento-card w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col p-0 overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="bg-surface2 border-b border-border px-3.5 py-2.5 sm:p-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Search size={16} className="text-info" />
            <span className="font-bold text-xs sm:text-sm text-primary uppercase tracking-wide truncate">
              Public Character Armory & Hall of Fame
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-primary transition-colors p-2 min-w-[40px] min-h-[40px] flex items-center justify-center"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3 sm:p-5 space-y-3 sm:space-y-4 bg-surface overflow-y-auto flex-1 flex flex-col">
          {inspectChar ? (
            /* Character Inspect Detail View */
            <div className="space-y-4">
              <button
                onClick={() => setInspectChar(null)}
                className="flex items-center gap-2 text-sm font-medium text-muted hover:text-primary transition-colors mb-2"
              >
                ← Back to Search / Rankings
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <StatusWindow char={inspectChar} />
                <Paperdoll paperdoll={inspectChar.paperdoll} />
              </div>
            </div>
          ) : (
            /* Search Input & Results */
            <>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                  size={18}
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search player or character name..."
                  className="w-full bg-background border border-border focus:border-accent rounded-lg px-4 py-3 pl-10 text-sm text-primary placeholder:text-muted outline-none transition-colors"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-primary transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Display Results or Top Rankings */}
              <div className="flex-1 overflow-y-auto space-y-4">
                <div className="text-xs font-bold uppercase tracking-wider text-muted">
                  {query.trim()
                    ? `Search Results (${results.length})`
                    : `👑 Server Top Rankings (Hall of Fame)`}
                </div>

                {loading ? (
                  <div className="py-12 text-center text-sm text-muted animate-pulse">
                    Searching Adventurer Archives...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(query.trim() ? results : rankings).map((char, index) => (
                      <div
                        key={char.charId}
                        onClick={() => handleSelectChar(char.charId)}
                        className="bg-surface2 border border-border rounded-lg p-4 flex items-center justify-between cursor-pointer hover:border-accent hover:bg-surface2/80 transition-all group"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-lg bg-background border border-border flex items-center justify-center font-bold text-sm text-accent group-hover:scale-110 transition-transform">
                            {!query.trim() ? `#${index + 1}` : <User size={16} />}
                          </div>
                          <div>
                            <div className="font-bold text-primary flex items-center gap-2">
                              <span>{char.name}</span>
                              {char.online && (
                                <span className="w-2 h-2 rounded-full bg-success" title="Online" />
                              )}
                            </div>
                            <div className="text-xs text-accent font-medium">
                              {char.className}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <div className="font-mono">
                            <div className="text-sm font-bold text-primary">
                              Lv. {char.baseLevel}/{char.jobLevel}
                            </div>
                            <div className="text-xs text-muted">
                              {formatZeny(char.zeny)} Z
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-muted group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
