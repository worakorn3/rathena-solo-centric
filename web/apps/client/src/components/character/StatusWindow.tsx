import React from "react";
import { CharacterSummary } from "@rathena/shared";
import { formatZeny, formatExp } from "../../lib/assets";
import { Heart, Zap, MapPin, Compass, Award } from "lucide-react";

interface StatusWindowProps {
  char: CharacterSummary;
}

export const StatusWindow: React.FC<StatusWindowProps> = ({ char }) => {
  const hpPct = char.maxHp > 0 ? (char.hp / char.maxHp) * 100 : 0;
  const spPct = char.maxSp > 0 ? (char.sp / char.maxSp) * 100 : 0;

  return (
    <div className="ro-window flex flex-col h-full">
      {/* Title Bar */}
      <div className="ro-titlebar">
        <div className="flex items-center space-x-2">
          <Award size={14} className="text-ro-gold" />
          <span className="font-cinzel font-bold text-xs tracking-wider text-slate-100 uppercase">
            Character Status
          </span>
        </div>
        <span className="text-[10px] text-slate-300 font-mono">
          ID #{char.charId} {char.online ? "• 🟢 Online" : "• 🔴 Offline"}
        </span>
      </div>

      <div className="p-3.5 space-y-3 bg-[#1a2332]/90 flex-1">
        {/* Name, Class & Level Row */}
        <div className="flex items-center justify-between pb-2 border-b border-ro-borderLight/20">
          <div>
            <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>{char.name}</span>
              <span className="text-[10px] text-slate-400 font-mono">({char.sex === "M" ? "♂" : "♀"})</span>
            </div>
            <div className="text-xs text-ro-gold font-semibold">{char.className}</div>
          </div>
          <div className="text-right font-mono">
            <div className="text-xs text-slate-200">
              Base Lv. <strong className="text-amber-300 text-sm">{char.baseLevel}</strong>
            </div>
            <div className="text-[11px] text-slate-400">
              Job Lv. <strong className="text-sky-300">{char.jobLevel}</strong>
            </div>
          </div>
        </div>

        {/* HP & SP Gauges */}
        <div className="space-y-2">
          {/* HP Bar */}
          <div>
            <div className="flex justify-between text-[11px] font-mono mb-0.5">
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <Heart size={11} className="fill-emerald-400 text-emerald-400" />
                HP
              </span>
              <span className="text-slate-300 font-bold">
                {char.hp.toLocaleString()} / {char.maxHp.toLocaleString()} ({hpPct.toFixed(0)}%)
              </span>
            </div>
            <div className="h-3 w-full bg-[#101722] rounded overflow-hidden border border-[#2d3d52] p-0.5">
              <div
                style={{ width: `${Math.min(100, Math.max(0, hpPct))}%` }}
                className="ro-bar-hp transition-all"
              />
            </div>
          </div>

          {/* SP Bar */}
          <div>
            <div className="flex justify-between text-[11px] font-mono mb-0.5">
              <span className="text-sky-400 flex items-center gap-1 font-semibold">
                <Zap size={11} className="fill-sky-400 text-sky-400" />
                SP
              </span>
              <span className="text-slate-300 font-bold">
                {char.sp.toLocaleString()} / {char.maxSp.toLocaleString()} ({spPct.toFixed(0)}%)
              </span>
            </div>
            <div className="h-3 w-full bg-[#101722] rounded overflow-hidden border border-[#2d3d52] p-0.5">
              <div
                style={{ width: `${Math.min(100, Math.max(0, spPct))}%` }}
                className="ro-bar-sp transition-all"
              />
            </div>
          </div>
        </div>

        {/* 6 Base Stats Grid */}
        <div className="ro-inset p-2.5">
          <div className="text-[10px] uppercase font-mono text-slate-400 mb-1.5 font-bold tracking-wider">
            Base Attributes
          </div>
          <div className="grid grid-cols-3 gap-2 text-center font-mono">
            <div className="bg-[#0f151f] p-1.5 rounded border border-[#2b394b]">
              <div className="text-[10px] text-red-400 font-bold">STR</div>
              <div className="text-sm font-bold text-slate-100">{char.str}</div>
            </div>
            <div className="bg-[#0f151f] p-1.5 rounded border border-[#2b394b]">
              <div className="text-[10px] text-green-400 font-bold">AGI</div>
              <div className="text-sm font-bold text-slate-100">{char.agi}</div>
            </div>
            <div className="bg-[#0f151f] p-1.5 rounded border border-[#2b394b]">
              <div className="text-[10px] text-yellow-400 font-bold">VIT</div>
              <div className="text-sm font-bold text-slate-100">{char.vit}</div>
            </div>
            <div className="bg-[#0f151f] p-1.5 rounded border border-[#2b394b]">
              <div className="text-[10px] text-blue-400 font-bold">INT</div>
              <div className="text-sm font-bold text-slate-100">{char.int}</div>
            </div>
            <div className="bg-[#0f151f] p-1.5 rounded border border-[#2b394b]">
              <div className="text-[10px] text-purple-400 font-bold">DEX</div>
              <div className="text-sm font-bold text-slate-100">{char.dex}</div>
            </div>
            <div className="bg-[#0f151f] p-1.5 rounded border border-[#2b394b]">
              <div className="text-[10px] text-teal-400 font-bold">LUK</div>
              <div className="text-sm font-bold text-slate-100">{char.luk}</div>
            </div>
          </div>
        </div>

        {/* Zeny & Location Info */}
        <div className="space-y-1 text-xs pt-1 border-t border-ro-borderLight/20">
          <div className="flex justify-between items-center font-mono">
            <span className="text-slate-400">Liquid Zeny:</span>
            <span className="text-ro-zeny font-bold">
              {formatZeny(char.zeny)} <span className="text-amber-200 text-[10px]">Z</span>
            </span>
          </div>

          <div className="flex justify-between items-center font-mono text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <MapPin size={11} className="text-slate-400" />
              Location:
            </span>
            <span className="text-slate-200">
              {char.lastMap} ({char.lastX}, {char.lastY})
            </span>
          </div>

          <div className="flex justify-between items-center font-mono text-[11px]">
            <span className="text-slate-400">Status / Skill Pts:</span>
            <span className="text-sky-300">
              {char.statusPoint} / {char.skillPoint}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
