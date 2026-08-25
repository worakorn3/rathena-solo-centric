import React, { createContext, useContext, useState, useEffect } from "react";

export interface TrackInfo {
  id: string;
  title: string;
  subtitle: string;
  accentColor: string;
}

export const CURATED_TRACKS: TrackInfo[] = [
  {
    id: "4DFPRCGMx6k",
    title: "Ragnarok LoFi Mix",
    subtitle: "Prontera & Fields Chill Compilation",
    accentColor: "bg-accent",
  },
  {
    id: "IeG0fw-nR6g",
    title: "Midgard Nostalgia Tape",
    subtitle: "Peaceful Town & Dungeon LoFi",
    accentColor: "bg-info",
  },
  {
    id: "JJAwgGggD2U",
    title: "Relaxing RO Soundscape",
    subtitle: "Extended Ambient Study & Relax Beats",
    accentColor: "bg-success",
  },
  {
    id: "_DWTntfXPlg",
    title: "Midgard Coffee Beats",
    subtitle: "Cozy Grind & LoFi Soundtrack",
    accentColor: "bg-purple",
  },
  {
    id: "MEFQr826Bdc",
    title: "Acoustic & Peaceful Melodies",
    subtitle: "Ragnarok Memories LoFi Chill",
    accentColor: "bg-danger",
  },
];

interface AudioContextType {
  tracks: TrackInfo[];
  activeTrack: TrackInfo;
  isPlaying: boolean;
  hasStarted: boolean;
  isOnlineNetwork: boolean;
  playTrack: (track: TrackInfo) => void;
  togglePlay: () => void;
  closeRadio: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTrack, setActiveTrack] = useState<TrackInfo>(CURATED_TRACKS[0]);
  const [hasStarted, setHasStarted] = useState<boolean>(false); // No initial clutter/autoplay
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isOnlineNetwork, setIsOnlineNetwork] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });

  // Browser network connectivity monitoring
  useEffect(() => {
    const handleOnline = () => setIsOnlineNetwork(true);
    const handleOffline = () => setIsOnlineNetwork(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const sendIframeCommand = (cmd: "playVideo" | "pauseVideo") => {
    const iframe = document.querySelector('iframe[title="Ragnarok LoFi Beats"]') as HTMLIFrameElement | null;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: cmd, args: [] }),
        "*"
      );
    }
  };

  const playTrack = (track: TrackInfo) => {
    setActiveTrack(track);
    setHasStarted(true);
    setIsPlaying(true);
    setTimeout(() => {
      sendIframeCommand("playVideo");
    }, 100);
  };

  const togglePlay = () => {
    if (!hasStarted) {
      setHasStarted(true);
      setIsPlaying(true);
      return;
    }

    setIsPlaying((prev) => {
      const next = !prev;
      sendIframeCommand(next ? "playVideo" : "pauseVideo");
      return next;
    });
  };

  const closeRadio = () => {
    sendIframeCommand("pauseVideo");
    setIsPlaying(false);
    setHasStarted(false);
  };

  return (
    <AudioContext.Provider
      value={{
        tracks: CURATED_TRACKS,
        activeTrack,
        isPlaying,
        hasStarted,
        isOnlineNetwork,
        playTrack,
        togglePlay,
        closeRadio,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export function useAudio(): AudioContextType {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error("useAudio must be used within an AudioProvider");
  }
  return context;
}
