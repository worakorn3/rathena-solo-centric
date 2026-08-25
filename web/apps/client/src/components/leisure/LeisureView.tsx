import React, { useState, useEffect } from "react";
import { CharacterDetail, CharacterSummary } from "@rathena/shared";
import {
  Radio,
  WifiOff,
  Headphones,
  Info,
  Play,
} from "lucide-react";
import { formatZeny } from "../../lib/assets";
import { useAudio } from "../../context/AudioContext";

interface LeisureViewProps {
  characters: CharacterSummary[];
  selectedCharId: number | null;
  selectedCharDetail: CharacterDetail | null;
  onSelectChar: (charId: number) => void;
}

export const LeisureView: React.FC<LeisureViewProps> = ({
  characters,
  selectedCharId,
  selectedCharDetail,
  onSelectChar,
}) => {
  const [now, setNow] = useState<number>(() => Math.floor(Date.now() / 1000));
  const {
    tracks,
    activeTrack,
    isPlaying,
    hasStarted,
    isOnlineNetwork,
    playTrack,
    togglePlay,
  } = useAudio();

  const activeChar =
    (selectedCharDetail && selectedCharDetail.charId === selectedCharId
      ? selectedCharDetail
      : characters.find((c) => c.charId === selectedCharId)) || characters[0];

  // Live second ticker for offline expedition accrual
  useEffect(() => {
    if (!activeChar || activeChar.online) return;
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [activeChar?.charId, activeChar?.online, activeChar?.lastLogoutTime]);

  if (!activeChar) {
    return (
      <div className="bento-card flex-1 flex flex-col items-center justify-center text-center p-8 text-muted">
        <Headphones className="w-10 h-10 text-muted/40 mb-3" />
        <h3 className="text-sm font-bold text-primary mb-1">No Character Selected</h3>
        <p className="text-xs max-w-sm">
          Please log in or select a character to monitor offline rest and expedition yields.
        </p>
      </div>
    );
  }

  // Offline Rest & Expedition metrics (48h ceiling = 172,800s = 2880m):
  const isOffline = !activeChar.online;
  const logoutTs =
    activeChar.lastLogoutTime && activeChar.lastLogoutTime > 0
      ? activeChar.lastLogoutTime
      : now;
  const elapsedSec = isOffline ? Math.max(0, now - logoutTs) : 0;

  // Cumulative offline minutes combining banked unclaimed time + active offline session
  const totalAccruedMin =
    (activeChar.unclaimedRestMin || 0) + (isOffline ? Math.floor(elapsedSec / 60) : 0);
  const cappedMin = Math.min(2880, totalAccruedMin);
  const progressPct = Math.min(100, (cappedMin / 2880) * 100);

  const displayHours = Math.floor(cappedMin / 60);
  const displayMins = cappedMin % 60;
  const displaySecs = isOffline && totalAccruedMin < 2880 ? elapsedSec % 60 : 0;
  const pad = (n: number) => String(n).padStart(2, "0");
  const timeDisplay = `${pad(displayHours)}h ${pad(displayMins)}m ${pad(displaySecs)}s`;

  // Base EXP & Job EXP Yield (Zero Zeny)
  const estBaseExp = Math.floor(activeChar.baseLevel * 10 * cappedMin);
  const estJobExp = Math.floor(activeChar.baseLevel * 5 * cappedMin);

  return (
    <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-hidden">
      {/* 6:6 Balanced Bento Grid: Left Offline EXP, Right Ragnarok LoFi Radio */}
      <div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
        
        {/* LEFT 6 COLS: Offline Rest & Expedition Console */}
        <div className="col-span-12 lg:col-span-6 flex flex-col min-h-0">
          <div className="bento-card flex-1 flex flex-col justify-between p-4 sm:p-5 overflow-hidden">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isOffline ? "bg-success animate-pulse" : "bg-muted"
                    }`}
                  />
                  <h3 className="text-xs sm:text-sm font-bold text-primary">
                    Offline Rest & Expedition Yields
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${
                      isOffline
                        ? "bg-success/15 text-success border-success/30"
                        : "bg-surface2 text-muted border-border"
                    }`}
                  >
                    {isOffline ? "RESTING & ACCRUING" : "ACTIVE IN-GAME"}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface2 border border-border text-muted hidden sm:inline-block">
                    48h Ceiling
                  </span>
                </div>
              </div>

              {/* Accumulated Time Box */}
              <div className="p-4 rounded-xl bg-surface2/50 border border-border flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] text-muted uppercase font-bold tracking-wider">
                    Accumulated Rest Time
                  </div>
                  <div className="text-2xl font-bold font-mono text-primary flex items-baseline gap-1.5 mt-1">
                    <span>{pad(displayHours)}</span>
                    <span className="text-xs text-muted font-normal">h</span>
                    <span>{pad(displayMins)}</span>
                    <span className="text-xs text-muted font-normal">m</span>
                    <span className="text-accent text-lg font-bold">{pad(displaySecs)}</span>
                    <span className="text-xs text-muted font-normal">s</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-muted uppercase font-bold tracking-wider">
                    Saturation
                  </div>
                  <div className="text-xs font-bold text-success font-mono mt-1">
                    {progressPct.toFixed(1)}% / 100%
                  </div>
                </div>
              </div>

              {/* Saturation Progress Bar */}
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-[11px] font-mono text-muted">
                  <span>Accrued Time Limit</span>
                  <span>
                    {cappedMin} / 2,880 Minutes ({displayHours}h / 48h)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-surface2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-accent to-success rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </div>

              {/* Base & Job EXP Yield Strips */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3.5 rounded-xl bg-surface2/30 border border-border">
                  <div className="text-[11px] font-medium text-muted flex items-center justify-between">
                    <span>Earned Base EXP</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-info/15 text-info font-mono font-semibold">
                      +{activeChar.baseLevel * 600}/h
                    </span>
                  </div>
                  <div className="text-base font-bold font-mono text-info mt-2">
                    +{formatZeny(estBaseExp)}{" "}
                    <span className="text-xs font-normal text-muted">EXP</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-surface2/30 border border-border">
                  <div className="text-[11px] font-medium text-muted flex items-center justify-between">
                    <span>Earned Job EXP</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-ro-dex/15 text-ro-dex font-mono font-semibold">
                      +{activeChar.baseLevel * 300}/h
                    </span>
                  </div>
                  <div className="text-base font-bold font-mono text-ro-dex mt-2">
                    +{formatZeny(estJobExp)}{" "}
                    <span className="text-xs font-normal text-muted">EXP</span>
                  </div>
                </div>
              </div>
            </div>

            {/* In-game System Tablet Notice */}
            <div className="p-3 rounded-lg bg-accent/10 border border-accent/20 flex items-start gap-2.5 text-xs text-accent/90">
              <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-accent">How to claim:</span> Rewards accumulate
                safely while offline. Claim your earned Base and Job EXP anytime in-game via the{" "}
                <span className="underline font-mono font-bold">System Tablet</span> without losing
                accrued progress.
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT 6 COLS: Ragnarok Online LoFi Radio Hub */}
        <div className="col-span-12 lg:col-span-6 flex flex-col min-h-0">
          <div className="bento-card flex-1 flex flex-col justify-between p-4 sm:p-5 overflow-hidden">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                <div className="flex items-center gap-2">
                  <span className="p-1 rounded bg-danger/15 text-danger">
                    <Radio className="w-4 h-4" />
                  </span>
                  <h3 className="text-xs sm:text-sm font-bold text-primary">
                    Ragnarok Online LoFi Radio
                  </h3>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono border ${
                    isOnlineNetwork
                      ? isPlaying
                        ? "bg-success/10 border-success/20 text-success"
                        : "bg-surface2 border-border text-muted"
                      : "bg-danger/10 border-danger/20 text-danger"
                  }`}
                >
                  {isOnlineNetwork ? (
                    isPlaying ? (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                        <span>Online Stream</span>
                      </>
                    ) : (
                      <>
                        <span className="w-1.5 h-1.5 rounded-full bg-muted" />
                        <span>Standby (Click to Play)</span>
                      </>
                    )
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-danger" />
                      <span>Offline (Network Required)</span>
                    </>
                  )}
                </div>
              </div>

              {/* Responsive Video Container OR Offline / Standby Fallback */}
              <div
                id="leisureVideoSlot"
                className="relative w-full aspect-video rounded-xl bg-black border border-border overflow-hidden shadow-inner flex items-center justify-center mb-3"
              >
                {isOnlineNetwork ? (
                  hasStarted ? (
                    <iframe
                      key={activeTrack.id}
                      className="w-full h-full"
                      src={`https://www.youtube-nocookie.com/embed/${activeTrack.id}?autoplay=1&enablejsapi=1`}
                      title="Ragnarok LoFi Beats"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
                  ) : (
                    /* Initial Standby Poster (NO unexpected sound until user clicks play) */
                    <div className="absolute inset-0 bg-surface flex flex-col items-center justify-center p-6 text-center space-y-3">
                      <div className="w-12 h-12 rounded-full bg-accent/15 border border-accent/30 flex items-center justify-center text-accent shadow-sm">
                        <Radio className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-primary">
                          Midgard LoFi Audio Radio
                        </div>
                        <p className="text-[11px] text-muted max-w-xs mt-1">
                          Select any soundscape below to begin streaming. Plays continuously in the background across all tabs without interrupting.
                        </p>
                      </div>
                      <button
                        onClick={() => playTrack(activeTrack)}
                        className="px-4 py-1.5 bg-accent hover:bg-accent/90 text-background rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Start Listening</span>
                      </button>
                    </div>
                  )
                ) : (
                  <div className="absolute inset-0 bg-surface flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-surface2 border border-border flex items-center justify-center text-muted">
                      <WifiOff className="w-6 h-6 text-muted" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-primary">
                        Internet Connection Required
                      </div>
                      <p className="text-[11px] text-muted max-w-xs mt-1">
                        YouTube LoFi streaming requires an active internet connection. Offline
                        expedition progression continues locally.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Curated Soundscape Switches */}
              <div className="space-y-2">
                <div className="text-[11px] font-medium text-muted">
                  Curated Soundscapes
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {tracks.map((track) => {
                    const isSelected = activeTrack.id === track.id;
                    return (
                      <button
                        key={track.id}
                        onClick={() => playTrack(track)}
                        className={`px-3 py-2 rounded-lg border text-left flex items-center gap-2.5 text-xs transition-colors cursor-pointer ${
                          isSelected && isPlaying
                            ? "bg-surface2 border-accent/50 text-primary shadow-sm ring-1 ring-accent/30"
                            : "bg-surface2/60 hover:bg-surface2 border-border text-muted hover:text-primary"
                        }`}
                      >
                        <span className={`w-2 h-2 rounded-full shrink-0 ${track.accentColor}`} />
                        <div className="truncate min-w-0">
                          <div className="font-bold truncate text-primary">{track.title}</div>
                          <div className="text-[10px] text-muted truncate">{track.subtitle}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="text-[10px] font-mono text-muted text-center pt-2">
              Midgard Audio Matrix • Ragnarok LoFi Radio
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
