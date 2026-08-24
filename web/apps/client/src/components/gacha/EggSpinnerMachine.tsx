import React, { useState } from "react";

interface EggSpinnerMachineProps {
  onPullStart?: () => void;
  isSpinning?: boolean;
}

export const EggSpinnerMachine: React.FC<EggSpinnerMachineProps> = ({ isSpinning }) => {
  return (
    <div className="my-2 flex flex-col items-center justify-center relative w-full max-w-[240px]">
      {/* Glass Capsule Dome */}
      <div className="w-44 h-44 rounded-full bg-gradient-to-b from-sky-400/20 via-surface2/60 to-surface2 border-2 border-sky-400/40 relative flex items-center justify-center shadow-inner shadow-sky-400/20 overflow-hidden">
        {/* Internal Glowing Eggs */}
        <div className="absolute inset-0 flex flex-wrap items-center justify-center p-4 gap-2 animate-float">
          <div className="w-6 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 border border-amber-200 shadow-md shadow-amber-500/50 transform rotate-12" />
          <div className="w-6 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-purple-400 border border-purple-200 shadow-md shadow-purple-500/50 transform -rotate-12" />
          <div className="w-6 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-sky-300 border border-sky-200 shadow-md shadow-sky-500/50 transform rotate-45" />
          <div className="w-6 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-emerald-300 border border-emerald-200 shadow-md shadow-emerald-500/50 transform -rotate-45" />
          <div className="w-6 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 border border-amber-200 shadow-md shadow-amber-500/50 transform rotate-6" />
        </div>
        {/* Specular Highlight Reflection */}
        <div className="absolute top-2 left-5 w-7 h-3.5 bg-white/25 rounded-full blur-[1px] transform -rotate-30 pointer-events-none" />
      </div>

      {/* Machine Base & Dispenser Mechanism */}
      <div className="w-52 h-26 bg-surface2 border-2 border-border rounded-b-2xl shadow-xl flex flex-col items-center justify-between p-2.5 relative -mt-4 z-10">
        {/* Coin Slot & Crank Handle */}
        <div className="w-full flex items-center justify-around px-3">
          {/* Coin Slot */}
          <div className="flex flex-col items-center">
            <div className="w-2.5 h-6 bg-background border border-border rounded-sm shadow-inner relative flex items-center justify-center">
              <div
                className={`w-2 h-4 bg-accent rounded-sm transition-all duration-500 ${
                  isSpinning ? "translate-y-2 opacity-100" : "opacity-0"
                }`}
              />
            </div>
            <span className="text-[9px] text-muted font-mono mt-0.5">COIN</span>
          </div>

          {/* Turning Crank */}
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full bg-surface border-2 border-accent/60 flex items-center justify-center shadow-lg transition-transform ${
                isSpinning ? "rotate-[720deg] duration-1000 border-accent" : "hover:border-accent"
              }`}
            >
              <div className="w-2 h-6 bg-accent rounded-full transform -rotate-45" />
            </div>
            <span className="text-[9px] text-muted font-mono mt-0.5">CRANK</span>
          </div>
        </div>

        {/* Output Chute with Dropped Egg Container */}
        <div className="w-14 h-7 bg-background border border-border rounded-t-lg shadow-inner flex items-center justify-center relative overflow-hidden">
          <div
            className={`w-5 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-amber-300 border border-amber-200 shadow-md transition-all duration-500 ${
              isSpinning ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          />
        </div>
      </div>
    </div>
  );
};
