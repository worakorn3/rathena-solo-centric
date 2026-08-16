import React from "react";
import { X, Minus } from "lucide-react";

interface RoWindowProps {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  onClose?: () => void;
}

export const RoWindow: React.FC<RoWindowProps> = ({
  title,
  icon,
  children,
  className = "",
  onClose,
}) => {
  return (
    <div className={`ro-window flex flex-col ${className}`}>
      {/* Title Bar */}
      <div className="ro-titlebar">
        <div className="flex items-center space-x-2">
          {icon && <span className="text-ro-gold">{icon}</span>}
          <span className="font-cinzel font-bold text-xs tracking-wider text-slate-100 uppercase drop-shadow-sm">
            {title}
          </span>
        </div>
        <div className="flex items-center space-x-1">
          <button className="w-4 h-4 rounded bg-[#2a3c50] hover:bg-[#3b5370] text-slate-300 flex items-center justify-center border border-ro-borderLight/30 text-[10px]">
            <Minus size={10} />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="w-4 h-4 rounded bg-[#2a3c50] hover:bg-red-900/80 hover:text-red-200 text-slate-300 flex items-center justify-center border border-ro-borderLight/30 text-[10px]"
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="p-3 bg-[#1e2736]/90 flex-1">{children}</div>
    </div>
  );
};
