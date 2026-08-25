import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

export const DEFAULT_PLAYLIST_ID = "PLLlAbcezVXFM";
export const PLAYLIST_ID =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_YOUTUBE_PLAYLIST_ID) ||
  DEFAULT_PLAYLIST_ID;
export const PLAYLIST_TITLE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_YOUTUBE_PLAYLIST_TITLE) ||
  "Ragnarok Online LoFi Radio";
export const PLAYLIST_SUBTITLE =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_YOUTUBE_PLAYLIST_SUBTITLE) ||
  "Midgard LoFi & Chill Playlist";

interface AudioContextType {
  playlistId: string;
  title: string;
  subtitle: string;
  isPlaying: boolean;
  hasStarted: boolean;
  isOnlineNetwork: boolean;
  isShuffled: boolean;
  isLooped: boolean;
  startRadio: () => void;
  togglePlay: () => void;
  toggleShuffle: () => void;
  toggleLoop: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  closeRadio: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [hasStarted, setHasStarted] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isShuffled, setIsShuffled] = useState<boolean>(true); // Enabled by default
  const [isLooped, setIsLooped] = useState<boolean>(true); // Enabled by default
  const [isOnlineNetwork, setIsOnlineNetwork] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });

  // Network connectivity monitoring
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

  const sendIframeCommand = (cmd: string, args: any[] = []) => {
    const iframe = document.querySelector('iframe[title="Ragnarok LoFi Beats"]') as HTMLIFrameElement | null;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: "command", func: cmd, args }),
        "*"
      );
    }
  };

  const startRadio = () => {
    setHasStarted(true);
    setIsPlaying(true);
    setTimeout(() => {
      sendIframeCommand("setLoop", [true]);
      sendIframeCommand("setShuffle", [true]);
      sendIframeCommand("playVideo");
    }, 200);
  };

  const toggleShuffle = () => {
    setIsShuffled((prev) => {
      const next = !prev;
      sendIframeCommand("setShuffle", [next]);
      return next;
    });
  };

  const toggleLoop = () => {
    setIsLooped((prev) => {
      const next = !prev;
      sendIframeCommand("setLoop", [next]);
      return next;
    });
  };

  const nextTrack = useCallback(() => {
    sendIframeCommand("nextVideo");
    setHasStarted(true);
    setIsPlaying(true);
  }, []);

  const prevTrack = useCallback(() => {
    sendIframeCommand("previousVideo");
    setHasStarted(true);
    setIsPlaying(true);
  }, []);

  const togglePlay = () => {
    if (!hasStarted) {
      startRadio();
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
        playlistId: PLAYLIST_ID,
        title: PLAYLIST_TITLE,
        subtitle: PLAYLIST_SUBTITLE,
        isPlaying,
        hasStarted,
        isOnlineNetwork,
        isShuffled,
        isLooped,
        startRadio,
        togglePlay,
        toggleShuffle,
        toggleLoop,
        nextTrack,
        prevTrack,
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
