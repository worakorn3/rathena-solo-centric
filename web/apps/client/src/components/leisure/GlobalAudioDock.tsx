import React from "react";
import { useAudio } from "../../context/AudioContext";
import { Play, Pause, Headphones } from "lucide-react";
import { NavTab } from "../layout/Sidebar";

interface GlobalAudioDockProps {
  activeTab: NavTab;
  onNavigateTab: (tab: NavTab) => void;
}

export const GlobalAudioDock: React.FC<GlobalAudioDockProps> = ({
  activeTab,
  onNavigateTab,
}) => {
  const { activeTrack, isPlaying, isOnlineNetwork, togglePlay } = useAudio();

  // Floating mini pill shown on other tabs while audio is playing
  if (!isPlaying || !isOnlineNetwork || activeTab === "LEISURE") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 bg-surface/95 border border-border/80 backdrop-blur-md rounded-full shadow-2xl px-3.5 py-2 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 select-none">
      {/* Animated Equalizer Waveform */}
      <div className="flex items-center gap-0.5 h-3.5 px-1">
        <span className="w-1 h-3 bg-accent rounded-full animate-pulse" />
        <span className="w-1 h-4 bg-accent rounded-full animate-pulse delay-75" />
        <span className="w-1 h-2 bg-accent rounded-full animate-pulse delay-150" />
      </div>

      {/* Track Info */}
      <div className="flex flex-col min-w-0 max-w-[140px] sm:max-w-[200px]">
        <span className="text-xs font-bold text-primary truncate leading-tight">
          {activeTrack.title}
        </span>
        <span className="text-[9px] text-muted truncate font-mono">
          {activeTrack.subtitle}
        </span>
      </div>

      {/* Controls: Play/Pause & Quick Return to Leisure Lounge */}
      <div className="flex items-center gap-1.5 pl-1 border-l border-border">
        <button
          onClick={togglePlay}
          className="p-1.5 rounded-full bg-surface2 hover:bg-border text-primary hover:text-accent transition-colors cursor-pointer"
          title={isPlaying ? "Pause Stream" : "Play Stream"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => onNavigateTab("LEISURE")}
          className="px-2 py-1 rounded-full bg-accent/15 hover:bg-accent/25 border border-accent/30 text-accent font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer"
          title="Open Leisure Lounge"
        >
          <Headphones className="w-3 h-3" />
          <span className="hidden sm:inline">Lounge</span>
        </button>
      </div>
    </div>
  );
};
