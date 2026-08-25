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
  isOnlineNetwork: boolean;
  playTrack: (track: TrackInfo) => void;
  togglePlay: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTrack, setActiveTrack] = useState<TrackInfo>(CURATED_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false); // No autoplay on initial load
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

  const playTrack = (track: TrackInfo) => {
    setActiveTrack(track);
    setIsPlaying(true); // User explicitly triggered playback
  };

  const togglePlay = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <AudioContext.Provider
      value={{
        tracks: CURATED_TRACKS,
        activeTrack,
        isPlaying,
        isOnlineNetwork,
        playTrack,
        togglePlay,
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
