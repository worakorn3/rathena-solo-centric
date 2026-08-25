import React, { useMemo } from "react";

interface EggSpinnerMachineProps {
  onPullStart?: () => void;
  isSpinning?: boolean;
}

interface DomeCapsule {
  id: number;
  left: string;
  top: string;
  rot: number;
  gradient: string;
  borderColor: string;
  shadowColor: string;
  spinClass: string;
  spinDelay: string;
  idleDelay: string;
  size: string;
}

export const EggSpinnerMachine: React.FC<EggSpinnerMachineProps> = ({ isSpinning }) => {
  // 22 Dense gashapon capsules filling the dome naturally
  const capsules: DomeCapsule[] = useMemo(() => [
    // Bottom Base Layer (Dense resting foundation)
    { id: 1, left: "20%", top: "72%", rot: -15, gradient: "from-amber-400 to-amber-600", borderColor: "border-amber-200", shadowColor: "shadow-amber-500/50", spinClass: "animate-gacha-spin-1", spinDelay: "0s", idleDelay: "0s", size: "w-6 h-7.5" },
    { id: 2, left: "38%", top: "76%", rot: 25, gradient: "from-purple-400 to-purple-700", borderColor: "border-purple-200", shadowColor: "shadow-purple-500/50", spinClass: "animate-gacha-spin-2", spinDelay: "0.1s", idleDelay: "0.4s", size: "w-6.5 h-8" },
    { id: 3, left: "56%", top: "74%", rot: -30, gradient: "from-sky-400 to-sky-600", borderColor: "border-sky-200", shadowColor: "shadow-sky-500/50", spinClass: "animate-gacha-spin-3", spinDelay: "0.2s", idleDelay: "0.8s", size: "w-6 h-7.5" },
    { id: 4, left: "72%", top: "68%", rot: 40, gradient: "from-emerald-400 to-emerald-600", borderColor: "border-emerald-200", shadowColor: "shadow-emerald-500/50", spinClass: "animate-gacha-spin-1", spinDelay: "0.15s", idleDelay: "1.2s", size: "w-6 h-7.5" },
    { id: 5, left: "8%", top: "64%", rot: -45, gradient: "from-rose-400 to-rose-600", borderColor: "border-rose-200", shadowColor: "shadow-rose-500/50", spinClass: "animate-gacha-spin-2", spinDelay: "0.25s", idleDelay: "0.6s", size: "w-5.5 h-7" },

    // Mid-Lower Layer (Interlocked pile)
    { id: 6, left: "26%", top: "58%", rot: 12, gradient: "from-amber-400 to-amber-600", borderColor: "border-amber-200", shadowColor: "shadow-amber-500/50", spinClass: "animate-gacha-spin-3", spinDelay: "0.05s", idleDelay: "0.3s", size: "w-6.5 h-8" },
    { id: 7, left: "46%", top: "62%", rot: -18, gradient: "from-rose-400 to-rose-600", borderColor: "border-rose-200", shadowColor: "shadow-rose-500/50", spinClass: "animate-gacha-spin-1", spinDelay: "0.3s", idleDelay: "0.9s", size: "w-6 h-7.5" },
    { id: 8, left: "64%", top: "56%", rot: 22, gradient: "from-purple-400 to-purple-700", borderColor: "border-purple-200", shadowColor: "shadow-purple-500/50", spinClass: "animate-gacha-spin-2", spinDelay: "0.12s", idleDelay: "1.5s", size: "w-6 h-7.5" },
    { id: 9, left: "14%", top: "50%", rot: -28, gradient: "from-sky-400 to-sky-600", borderColor: "border-sky-200", shadowColor: "shadow-sky-500/50", spinClass: "animate-gacha-spin-3", spinDelay: "0.22s", idleDelay: "0.2s", size: "w-6 h-7.5" },
    { id: 10, left: "78%", top: "52%", rot: 35, gradient: "from-amber-400 to-amber-600", borderColor: "border-amber-200", shadowColor: "shadow-amber-500/50", spinClass: "animate-gacha-spin-1", spinDelay: "0.18s", idleDelay: "1.1s", size: "w-6 h-7.5" },

    // Middle Layer (Abundant volume filling bowl center)
    { id: 11, left: "34%", top: "45%", rot: -10, gradient: "from-emerald-400 to-emerald-600", borderColor: "border-emerald-200", shadowColor: "shadow-emerald-500/50", spinClass: "animate-gacha-spin-2", spinDelay: "0.08s", idleDelay: "0.5s", size: "w-6 h-7.5" },
    { id: 12, left: "52%", top: "48%", rot: 15, gradient: "from-purple-400 to-purple-700", borderColor: "border-purple-200", shadowColor: "shadow-purple-500/50", spinClass: "animate-gacha-spin-3", spinDelay: "0.28s", idleDelay: "1.3s", size: "w-6.5 h-8" },
    { id: 13, left: "22%", top: "36%", rot: 30, gradient: "from-amber-400 to-amber-600", borderColor: "border-amber-200", shadowColor: "shadow-amber-500/50", spinClass: "animate-gacha-spin-1", spinDelay: "0.14s", idleDelay: "0.7s", size: "w-6 h-7.5" },
    { id: 14, left: "68%", top: "40%", rot: -25, gradient: "from-sky-400 to-sky-600", borderColor: "border-sky-200", shadowColor: "shadow-sky-500/50", spinClass: "animate-gacha-spin-2", spinDelay: "0.32s", idleDelay: "1.4s", size: "w-6 h-7.5" },
    { id: 15, left: "42%", top: "32%", rot: -5, gradient: "from-rose-400 to-rose-600", borderColor: "border-rose-200", shadowColor: "shadow-rose-500/50", spinClass: "animate-gacha-spin-3", spinDelay: "0.02s", idleDelay: "0.1s", size: "w-6 h-7.5" },

    // Upper Peak Tier (Crowning the dome bowl)
    { id: 16, left: "58%", top: "34%", rot: 28, gradient: "from-emerald-400 to-emerald-600", borderColor: "border-emerald-200", shadowColor: "shadow-emerald-500/50", spinClass: "animate-gacha-spin-1", spinDelay: "0.26s", idleDelay: "1.0s", size: "w-5.5 h-7" },
    { id: 17, left: "30%", top: "24%", rot: -32, gradient: "from-purple-400 to-purple-700", borderColor: "border-purple-200", shadowColor: "shadow-purple-500/50", spinClass: "animate-gacha-spin-2", spinDelay: "0.16s", idleDelay: "0.8s", size: "w-6 h-7.5" },
    { id: 18, left: "48%", top: "20%", rot: 18, gradient: "from-amber-400 to-amber-600", borderColor: "border-amber-200", shadowColor: "shadow-amber-500/50", spinClass: "animate-gacha-spin-3", spinDelay: "0.2s", idleDelay: "1.6s", size: "w-6.5 h-8" },
    { id: 19, left: "66%", top: "26%", rot: -14, gradient: "from-sky-400 to-sky-600", borderColor: "border-sky-200", shadowColor: "shadow-sky-500/50", spinClass: "animate-gacha-spin-1", spinDelay: "0.1s", idleDelay: "0.4s", size: "w-6 h-7.5" },
    { id: 20, left: "38%", top: "12%", rot: 8, gradient: "from-amber-400 to-amber-600", borderColor: "border-amber-200", shadowColor: "shadow-amber-500/50", spinClass: "animate-gacha-spin-2", spinDelay: "0.24s", idleDelay: "1.2s", size: "w-5.5 h-7" },
    { id: 21, left: "54%", top: "14%", rot: -22, gradient: "from-rose-400 to-rose-600", borderColor: "border-rose-200", shadowColor: "shadow-rose-500/50", spinClass: "animate-gacha-spin-3", spinDelay: "0.06s", idleDelay: "0.2s", size: "w-5.5 h-7" },
    { id: 22, left: "18%", top: "42%", rot: 42, gradient: "from-emerald-400 to-emerald-600", borderColor: "border-emerald-200", shadowColor: "shadow-emerald-500/50", spinClass: "animate-gacha-spin-1", spinDelay: "0.34s", idleDelay: "0.9s", size: "w-5.5 h-7" },
  ], []);

  return (
    <div className="my-2 flex flex-col items-center justify-center relative w-full max-w-[240px]">
      {/* Glass Capsule Dome */}
      <div className="w-48 h-48 rounded-full bg-gradient-to-b from-sky-400/20 via-surface2/60 to-surface2 border-2 border-sky-400/50 relative flex items-center justify-center shadow-2xl shadow-sky-400/15 overflow-hidden">
        {/* Internal 22-Capsule Reservoir */}
        <div className="absolute inset-0 w-full h-full pointer-events-none">
          {capsules.map((cap) => (
            <div
              key={cap.id}
              className={`absolute rounded-full bg-gradient-to-tr ${cap.gradient} border ${cap.borderColor} shadow-md ${cap.shadowColor} ${cap.size} ${
                isSpinning ? cap.spinClass : "animate-gacha-idle"
              }`}
              style={{
                left: cap.left,
                top: cap.top,
                animationDelay: isSpinning ? cap.spinDelay : cap.idleDelay,
                ["--rot" as any]: `${cap.rot}deg`,
                transform: isSpinning ? undefined : `rotate(${cap.rot}deg)`,
              }}
            >
              {/* Capsule Two-Tone Glass Sheen & Highlight Cap */}
              <div className="absolute top-0.5 left-0.5 right-0.5 h-1/2 bg-white/35 rounded-t-full pointer-events-none" />
              <div className="absolute top-1 left-1.5 w-1.5 h-1.5 bg-white/70 rounded-full blur-[0.5px] pointer-events-none" />
            </div>
          ))}
        </div>

        {/* Specular Highlight Reflections on Glass Surface */}
        <div className="absolute top-3 left-6 w-9 h-4 bg-white/30 rounded-full blur-[1px] transform -rotate-30 pointer-events-none" />
        <div className="absolute bottom-5 right-6 w-5 h-2.5 bg-sky-300/20 rounded-full blur-[1px] transform rotate-30 pointer-events-none" />
      </div>

      {/* Machine Base & Dispenser Mechanism */}
      <div className="w-56 h-28 bg-surface2 border-2 border-border rounded-b-2xl shadow-xl flex flex-col items-center justify-between p-2.5 relative -mt-4 z-10">
        {/* Coin Slot & Crank Handle */}
        <div className="w-full flex items-center justify-around px-4">
          {/* Coin Slot */}
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-6 bg-background border border-border rounded-sm shadow-inner relative flex items-center justify-center overflow-hidden">
              <div
                className={`w-2 h-4 bg-accent rounded-sm transition-all duration-500 ${
                  isSpinning ? "translate-y-2 opacity-100 shadow-sm shadow-accent/50" : "opacity-0"
                }`}
              />
            </div>
            <span className="text-[9px] text-muted font-mono mt-0.5">COIN</span>
          </div>

          {/* Turning Crank */}
          <div className="flex flex-col items-center">
            <div
              className={`w-11 h-11 rounded-full bg-surface border-2 border-accent/60 flex items-center justify-center shadow-lg transition-transform cursor-pointer ${
                isSpinning ? "rotate-[1080deg] duration-1000 border-accent shadow-accent/30" : "hover:border-accent"
              }`}
            >
              <div className="w-2.5 h-7 bg-accent rounded-full transform -rotate-45 shadow-sm" />
            </div>
            <span className="text-[9px] text-muted font-mono mt-0.5">CRANK</span>
          </div>
        </div>

        {/* Output Chute with Dropped Egg Container */}
        <div className="w-16 h-8 bg-background border border-border rounded-t-lg shadow-inner flex items-center justify-center relative overflow-hidden">
          <div
            className={`w-5.5 h-7 rounded-full bg-gradient-to-tr from-amber-400 to-amber-600 border border-amber-200 shadow-md shadow-amber-500/50 transition-all duration-500 relative ${
              isSpinning ? "translate-y-0 opacity-100 scale-100" : "translate-y-6 opacity-0 scale-75"
            }`}
          >
            <div className="absolute top-0.5 left-0.5 right-0.5 h-1/2 bg-white/40 rounded-t-full" />
            <div className="absolute top-1 left-1 w-1 h-1 bg-white/80 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

