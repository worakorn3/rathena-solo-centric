import React from "react";
import { useAudio } from "../../context/AudioContext";
import { Play, Pause, Headphones, X, SkipBack, SkipForward, Shuffle, Repeat } from "lucide-react";
import { NavTab } from "../layout/Sidebar";

interface GlobalAudioDockProps {
  activeTab: NavTab;
  onNavigateTab: (tab: NavTab) => void;
}

export const GlobalAudioDock: React.FC<GlobalAudioDockProps> = ({
  activeTab,
  onNavigateTab,
}) => {
  const {
    title,
    subtitle,
    isPlaying,
    hasStarted,
    isOnlineNetwork,
    isShuffled,
    isLooped,
    togglePlay,
    toggleShuffle,
    toggleLoop,
    nextTrack,
    prevTrack,
    closeRadio,
  } = useAudio();

  // Floating mini pill stays visible across other tabs once started (even when paused)
  if (!hasStarted || !isOnlineNetwork || activeTab === "LEISURE") {
    return null;
  }

  return (
    <div className="fixed bottom-[calc(3.75rem+env(safe-area-inset-bottom,0px))] left-3 right-3 sm:left-auto sm:right-4 sm:w-auto md:bottom-4 md:right-4 md:left-auto z-40 bg-surface/95 border border-border/80 backdrop-blur-md rounded-full shadow-2xl px-3 py-1.5 sm:px-3.5 sm:py-2 flex items-center justify-between sm:justify-start gap-2 sm:gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 select-none">
      {/* Equalizer Waveform Indicator */}
      <div className="flex items-center gap-0.5 h-3.5 px-0.5 sm:px-1 shrink-0">
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
      <div className="flex flex-col min-w-0 flex-1 sm:flex-initial sm:max-w-[160px]">
        <span className="text-xs font-bold text-primary truncate leading-tight flex items-center gap-1">
          <span className="truncate">{title}</span>
          {!isPlaying && (
            <span className="text-[8px] font-mono uppercase px-1 py-0.2 rounded bg-surface2 text-muted shrink-0">
              Paused
            </span>
          )}
        </span>
        <span className="text-[9px] text-muted truncate font-mono">
          {subtitle}
        </span>
      </div>

      {/* Controls: Shuffle, Loop, Prev, Play/Pause, Next, Return to Lounge, and Dismiss */}
      <div className="flex items-center gap-0.5 sm:gap-1 pl-1 sm:pl-1.5 border-l border-border shrink-0">
        <button
          onClick={toggleShuffle}
          className={`hidden sm:inline-flex p-1.5 rounded-full transition-colors cursor-pointer ${
            isShuffled ? "text-accent bg-accent/15" : "text-muted hover:text-primary hover:bg-surface2"
          }`}
          title={isShuffled ? "Shuffle Active" : "Shuffle Disabled"}
          aria-label={isShuffled ? "Shuffle Active" : "Shuffle Disabled"}
        >
          <Shuffle className="w-3 h-3" />
        </button>

        <button
          onClick={toggleLoop}
          className={`hidden sm:inline-flex p-1.5 rounded-full transition-colors cursor-pointer ${
            isLooped ? "text-accent bg-accent/15" : "text-muted hover:text-primary hover:bg-surface2"
          }`}
          title={isLooped ? "Loop Active" : "Loop Disabled"}
          aria-label={isLooped ? "Loop Active" : "Loop Disabled"}
        >
          <Repeat className="w-3 h-3" />
        </button>

        <button
          onClick={prevTrack}
          className="p-1.5 rounded-full hover:bg-surface2 text-muted hover:text-primary transition-colors cursor-pointer"
          title="Previous Track"
          aria-label="Previous Track"
        >
          <SkipBack className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
        </button>

        <button
          onClick={togglePlay}
          className="p-1.5 rounded-full bg-surface2 hover:bg-border text-primary hover:text-accent transition-colors cursor-pointer"
          title={isPlaying ? "Pause Stream" : "Resume Stream"}
          aria-label={isPlaying ? "Pause Stream" : "Resume Stream"}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
        </button>

        <button
          onClick={nextTrack}
          className="p-1.5 rounded-full hover:bg-surface2 text-muted hover:text-primary transition-colors cursor-pointer"
          title="Next Track"
          aria-label="Next Track"
        >
          <SkipForward className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
        </button>

        <button
          onClick={() => onNavigateTab("LEISURE")}
          className="px-2 py-1 rounded-full bg-accent/15 hover:bg-accent/25 border border-accent/30 text-accent font-bold text-[10px] flex items-center gap-1 transition-colors cursor-pointer ml-0.5"
          title="Open Leisure Lounge"
        >
          <Headphones className="w-3 h-3" />
          <span className="hidden sm:inline">Lounge</span>
        </button>

        <button
          onClick={closeRadio}
          className="p-1 rounded-full text-muted hover:text-primary transition-colors cursor-pointer ml-0.5"
          title="Dismiss Radio Dock"
          aria-label="Dismiss Radio Dock"
        >
          <X className="w-3.5 h-3.5 sm:w-3 sm:h-3" />
        </button>
      </div>
    </div>
  );
};
