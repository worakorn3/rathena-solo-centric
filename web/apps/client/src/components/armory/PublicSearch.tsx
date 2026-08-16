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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="ro-window w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Title Bar */}
        <div className="ro-titlebar">
          <div className="flex items-center space-x-2">
            <Search size={14} className="text-sky-300" />
            <span className="font-cinzel font-bold text-xs tracking-wider text-slate-100 uppercase">
              Public Character Armory & Hall of Fame
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-5 h-5 rounded bg-[#2a3c50] hover:bg-red-900 text-slate-300 flex items-center justify-center border border-ro-borderLight/30 text-xs"
          >
            <X size={12} />
          </button>
        </div>

        <div className="p-4 space-y-4 bg-[#1a2332]/95 overflow-y-auto flex-1 flex flex-col">
          {inspectChar ? (
            /* Character Inspect Detail View */
            <div className="space-y-3">
              <button
                onClick={() => setInspectChar(null)}
                className="ro-button flex items-center gap-1 text-xs py-1 px-3 mb-2"
              >
                ← Back to Search / Rankings
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <StatusWindow char={inspectChar} />
                <Paperdoll paperdoll={inspectChar.paperdoll} />
              </div>
            </div>
          ) : (
            /* Search Input & Results */
            <>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search player or character name..."
                  className="w-full bg-[#121824] border-2 border-[#364960] focus:border-ro-gold rounded px-3 py-2 pl-9 text-xs text-slate-100 placeholder:text-slate-500 outline-none shadow-roInset font-mono"
                  autoFocus
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Display Results or Top Rankings */}
              <div className="flex-1 overflow-y-auto">
                <div className="text-[11px] font-mono uppercase text-slate-400 mb-2 font-semibold">
                  {query.trim()
                    ? `Search Results (${results.length})`
                    : `👑 Server Top Rankings (Hall of Fame)`}
                </div>

                {loading ? (
                  <div className="p-8 text-center text-xs text-slate-400 font-mono animate-pulse">
                    Querying replica database...
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {(query.trim() ? results : rankings).map((char, index) => (
                      <div
                        key={char.charId}
                        onClick={() => handleSelectChar(char.charId)}
                        className="ro-inset p-3 flex items-center justify-between cursor-pointer hover:border-ro-gold hover:bg-[#233144] transition-all"
                      >
                        <div className="flex items-center space-x-2.5">
                          <div className="w-8 h-8 rounded bg-[#101722] border border-ro-borderLight/40 flex items-center justify-center font-bold text-xs text-ro-gold">
                            {!query.trim() ? `#${index + 1}` : <User size={14} />}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-100 flex items-center gap-1.5">
                              <span>{char.name}</span>
                              {char.online && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              )}
                            </div>
                            <div className="text-[10px] text-ro-gold font-medium">
                              {char.className}
                            </div>
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-2">
                          <div className="font-mono">
                            <div className="text-xs font-bold text-slate-200">
                              Lv. {char.baseLevel}/{char.jobLevel}
                            </div>
                            <div className="text-[10px] text-amber-300">
                              {formatZeny(char.zeny)} Z
                            </div>
                          </div>
                          <ChevronRight size={14} className="text-slate-500" />
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
