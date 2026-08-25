import React from "react";
import { useAudio } from "../../context/AudioContext";
import { Play, Pause, Headphones, X } from "lucide-react";
import { NavTab } from "../layout/Sidebar";

interface GlobalAudioDockProps {
  activeTab: NavTab;
  onNavigateTab: (tab: NavTab) => void;
}

export const GlobalAudioDock: React.FC<GlobalAudioDockProps> = ({
  activeTab,
  onNavigateTab,
}) => {
  const { activeTrack, isPlaying, hasStarted, isOnlineNetwork, togglePlay, closeRadio } = useAudio();

  // Floating mini pill stays visible across other tabs once started (even when paused)
  if (!hasStarted || !isOnlineNetwork || activeTab === "LEISURE") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-surface/95 border border-border/80 backdrop-blur-md rounded-full shadow-2xl px-3.5 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 select-none">
      {/* Equalizer Waveform Indicator */}
      <div className="flex items-center gap-0.5 h-3.5 px-1">
        <span
          className={`w-1 h-3 rounded-full transition-all ${
            isPlaying ? "bg-accent animate-pulse" : "bg-muted/40"
          }`}
        />
        <span
          className={`w-1 h-4 rounded-full transition-all ${
            isPlaying ? "bg-accent animate-pulse delay-75" : "bg-muted/40"
          }`}
        />
        <span
          className={`w-1 h-2 rounded-full transition-all ${
            isPlaying ? "bg-accent animate-pulse delay-150" : "bg-muted/40"
          }`}
        />
      </div>

      {/* Track Info */}
      <div className="flex flex-col min-w-0 max-w-[130px] sm:max-w-[190px]">
        <span className="text-xs font-bold text-primary truncate leading-tight flex items-center gap-1">
          <span className="truncate">{activeTrack.title}</span>
          {!isPlaying && (
            <span className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-surface2 text-muted shrink-0">
              Paused
            </span>
          )}
        </span>
        <span className="text-[9px] text-muted truncate font-mono">
          {activeTrack.subtitle}
        </span>
      </div>

      {/* Controls: Play/Pause, Quick Return to Lounge, and Dismiss */}
      <div className="flex items-center gap-1.5 pl-1 border-l border-border">
        <button
          onClick={togglePlay}
          className="p-1.5 rounded-full bg-surface2 hover:bg-border text-primary hover:text-accent transition-colors cursor-pointer"
          title={isPlaying ? "Pause Stream" : "Resume Stream"}
          aria-label={isPlaying ? "Pause Stream" : "Resume Stream"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>

        <button
          onClick={() => onNavigateTab("LEISURE")}
          className="px-2 py-1 rounded-full bg-accent/15 hover:bg-accent/25 border border-accent/30 text-accent font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
          title="Open Leisure Lounge"
        >
          <Headphones className="w-3 h-3" />
          <span className="hidden sm:inline">Lounge</span>
        </button>

        <button
          onClick={closeRadio}
          className="p-1 rounded-full text-muted hover:text-primary transition-colors cursor-pointer"
          title="Dismiss Radio Dock"
          aria-label="Dismiss Radio Dock"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
