import React, { useState, useEffect } from "react";
import { CharacterSummary } from "@rathena/shared";
import { Compass, CheckCircle2, ShieldAlert, Heart, Zap, Sparkles } from "lucide-react";

interface StatusWindowProps {
  char: CharacterSummary;
}

export const StatusWindow: React.FC<StatusWindowProps> = ({ char }) => {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  // Live second ticker for offline expedition accrual
  useEffect(() => {
    setNow(Math.floor(Date.now() / 1000));
    if (char.online) return;
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [char.online, char.lastLogoutTime]);

  const hpPct = char.maxHp > 0 ? (char.hp / char.maxHp) * 100 : 0;
  const spPct = char.maxSp > 0 ? (char.sp / char.maxSp) * 100 : 0;
  const maxAp = char.maxAp || 0;
  const ap = char.ap || 0;
  const apPct = maxAp > 0 ? (ap / maxAp) * 100 : 0;

  // Offline Rest & Expedition metrics (48h ceiling = 172,800s = 2880m):
  const isOffline = !char.online;
  const logoutTs =
    char.lastLogoutTime && char.lastLogoutTime > 0 ? char.lastLogoutTime : now;
  const elapsedSec = isOffline ? Math.max(0, now - logoutTs) : 0;

  // Cumulative offline minutes combining banked unclaimed time + active offline session
  const totalAccruedMin =
    (char.unclaimedRestMin || 0) + (isOffline ? Math.floor(elapsedSec / 60) : 0);
  const cappedMin = Math.min(2880, totalAccruedMin);
  const progressPct = Math.min(100, (cappedMin / 2880) * 100);

  const displayHours = Math.floor(cappedMin / 60);
  const displayMins = cappedMin % 60;
  const displaySecs = isOffline ? elapsedSec % 60 : 0;
  const pad = (n: number) => String(n).padStart(2, "0");
  const timeDisplay = `${pad(displayHours)}h ${pad(displayMins)}m ${pad(displaySecs)}s`;

  // Base EXP & Job EXP Yield (Zero Zeny)
  const estBaseExp = Math.floor(char.baseLevel * 10 * cappedMin);
  const estJobExp = Math.floor(char.baseLevel * 5 * cappedMin);

  // 4th Class Traits & Detection
  const has4thTraits =
    (char.maxAp !== undefined && char.maxAp > 0) ||
    (char.traitPoint !== undefined && char.traitPoint > 0) ||
    (char.pow !== undefined && char.pow > 0) ||
    (char.classId >= 4252 && char.classId <= 4271);

  const pow = char.pow || 0;
  const sta = char.sta || 0;
  const wis = char.wis || 0;
  const spl = char.spl || 0;
  const con = char.con || 0;
  const crt = char.crt || 0;
  const traitPoints = char.traitPoint || 0;

  // Calculated secondary combat ratings from base stats
  const atkBase = char.str + Math.floor(char.dex / 5) + Math.floor(char.luk / 5);
  const defBase = char.vit;
  const hitBase = char.baseLevel + char.dex;
  const critBase = Math.floor(1 + char.luk * 0.3);
  const matkMin = char.int + Math.floor(char.int / 7) ** 2;
  const matkMax = char.int + Math.floor(char.int / 5) ** 2;
  const mdefBase = char.int;
  const fleeBase = char.baseLevel + char.agi;
  const aspdBase = (150 + char.agi * 0.4 + char.dex * 0.1).toFixed(1);

  // 4th Class Sub-Ratings
  const pAtkBonus = pow * 5 + Math.floor(con / 5);
  const sMatkBonus = spl * 5 + Math.floor(con / 5);
  const resBonus = sta;
  const mresBonus = wis;
  const cRateBonus = Math.floor(crt / 3);

  return (
    <div className="flex flex-col gap-3 min-h-0 h-full">
      {/* Vitals & Combat Matrix Card */}
      <div className="bento-card p-4 flex-1 min-h-0 flex flex-col justify-between overflow-y-auto">
        <div className="space-y-3">
          {/* HP / SP / AP Gauges */}
          <div className="space-y-2">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-success text-[11px] flex items-center gap-1">
                  <Heart className="w-3.5 h-3.5" /> HP (Health)
                </span>
                <span className="font-mono text-[11px] text-primary">
                  {char.hp.toLocaleString()} / {char.maxHp.toLocaleString()}{" "}
                  <span className="text-success text-[10px]">
                    ({Math.round(hpPct)}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-surface2 rounded-full h-2 overflow-hidden shadow-inner">
                <div
                  className="bg-success h-2 rounded-full shadow-[0_0_8px_rgba(74,222,128,0.5)] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, hpPct))}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-info text-[11px] flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5" /> SP (Mana)
                </span>
                <span className="font-mono text-[11px] text-primary">
                  {char.sp.toLocaleString()} / {char.maxSp.toLocaleString()}{" "}
                  <span className="text-info text-[10px]">
                    ({Math.round(spPct)}%)
                  </span>
                </span>
              </div>
              <div className="w-full bg-surface2 rounded-full h-2 overflow-hidden shadow-inner">
                <div
                  className="bg-info h-2 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.5)] transition-all duration-300"
                  style={{ width: `${Math.min(100, Math.max(0, spPct))}%` }}
                />
              </div>
            </div>

            {/* AP (Activity Points) Gauge for 4th Class */}
            {has4thTraits && (
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span className="text-accent text-[11px] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> AP (Activity Points)
                  </span>
                  <span className="font-mono text-[11px] text-accent">
                    {ap} / {maxAp || 200}{" "}
                    <span className="text-[10px]">
                      ({Math.round(apPct || 0)}%)
                    </span>
                  </span>
                </div>
                <div className="w-full bg-surface2 rounded-full h-2 overflow-hidden shadow-inner">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-yellow-300 h-2 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.6)] transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(0, apPct))}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* 6 Primary Attributes Grid */}
          <div>
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5 flex justify-between">
              <span>Primary Attributes</span>
              <span className="text-accent font-mono text-[10px]">
                Status Pts: {char.statusPoint}
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center text-xs">
              <div className="p-2 rounded-lg bg-surface2/40 border border-border">
                <span className="text-[9px] font-bold text-ro-str block">STR</span>
                <span className="font-mono font-bold text-sm text-primary">
                  {char.str}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface2/40 border border-border">
                <span className="text-[9px] font-bold text-ro-agi block">AGI</span>
                <span className="font-mono font-bold text-sm text-primary">
                  {char.agi}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface2/40 border border-border">
                <span className="text-[9px] font-bold text-ro-vit block">VIT</span>
                <span className="font-mono font-bold text-sm text-primary">
                  {char.vit}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface2/40 border border-border">
                <span className="text-[9px] font-bold text-ro-int block">INT</span>
                <span className="font-mono font-bold text-sm text-primary">
                  {char.int}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface2/40 border border-border">
                <span className="text-[9px] font-bold text-ro-dex block">DEX</span>
                <span className="font-mono font-bold text-sm text-primary">
                  {char.dex}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-surface2/40 border border-border">
                <span className="text-[9px] font-bold text-ro-luk block">LUK</span>
                <span className="font-mono font-bold text-sm text-primary">
                  {char.luk}
                </span>
              </div>
            </div>
          </div>

          {/* 6 Trait Attributes Matrix (4th Job) */}
          {has4thTraits && (
            <div className="p-2.5 rounded-xl bg-surface2/30 border border-border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent animate-ping" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                    4th Class Trait Status
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-accent bg-accent/15 px-2 py-0.5 rounded border border-accent/30">
                  Trait Pts: {traitPoints}
                </span>
              </div>

              <div className="grid grid-cols-6 gap-1.5 text-center text-xs">
                <div
                  className="p-1.5 rounded-lg bg-danger/10 border border-danger/30"
                  title="Power: Physical DMG & P.Atk"
                >
                  <span className="text-[9px] font-bold text-danger block">
                    POW
                  </span>
                  <span className="font-mono font-bold text-sm text-primary">
                    {pow}
                  </span>
                </div>
                <div
                  className="p-1.5 rounded-lg bg-success/10 border border-success/30"
                  title="Stamina: Physical DEF & Res"
                >
                  <span className="text-[9px] font-bold text-success block">
                    STA
                  </span>
                  <span className="font-mono font-bold text-sm text-primary">
                    {sta}
                  </span>
                </div>
                <div
                  className="p-1.5 rounded-lg bg-info/10 border border-info/30"
                  title="Wisdom: Magic DEF & Mres"
                >
                  <span className="text-[9px] font-bold text-info block">
                    WIS
                  </span>
                  <span className="font-mono font-bold text-sm text-primary">
                    {wis}
                  </span>
                </div>
                <div
                  className="p-1.5 rounded-lg bg-purple/10 border border-purple/30"
                  title="Spell: Magic DMG & S.Matk"
                >
                  <span className="text-[9px] font-bold text-purple block">
                    SPL
                  </span>
                  <span className="font-mono font-bold text-sm text-primary">
                    {spl}
                  </span>
                </div>
                <div
                  className="p-1.5 rounded-lg bg-accent/10 border border-accent/30"
                  title="Concentration: Hit, Flee, P.Atk, S.Matk"
                >
                  <span className="text-[9px] font-bold text-accent block">
                    CON
                  </span>
                  <span className="font-mono font-bold text-sm text-primary">
                    {con}
                  </span>
                </div>
                <div
                  className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/30"
                  title="Critical: Critical Rate & C.Rate"
                >
                  <span className="text-[9px] font-bold text-pink-400 block">
                    CRT
                  </span>
                  <span className="font-mono font-bold text-sm text-primary">
                    {crt}
                  </span>
                </div>
              </div>

              {/* Secondary Trait Combat Ratings */}
              <div className="grid grid-cols-5 gap-1.5 pt-0.5 text-center font-mono text-[9px]">
                <div className="bg-surface p-1 rounded border border-border">
                  <span className="text-[8px] text-muted uppercase block">
                    P.ATK
                  </span>
                  <span className="font-bold text-danger">+{pAtkBonus}</span>
                </div>
                <div className="bg-surface p-1 rounded border border-border">
                  <span className="text-[8px] text-muted uppercase block">
                    S.MATK
                  </span>
                  <span className="font-bold text-purple">+{sMatkBonus}</span>
                </div>
                <div className="bg-surface p-1 rounded border border-border">
                  <span className="text-[8px] text-muted uppercase block">
                    RES
                  </span>
                  <span className="font-bold text-success">{resBonus}</span>
                </div>
                <div className="bg-surface p-1 rounded border border-border">
                  <span className="text-[8px] text-muted uppercase block">
                    MRES
                  </span>
                  <span className="font-bold text-info">{mresBonus}</span>
                </div>
                <div className="bg-surface p-1 rounded border border-border">
                  <span className="text-[8px] text-muted uppercase block">
                    C.RATE
                  </span>
                  <span className="font-bold text-pink-400">+{cRateBonus}</span>
                </div>
              </div>
            </div>
          )}

          {/* Combat Performance Sub-Ratings */}
          <div>
            <div className="text-[10px] font-bold text-muted uppercase tracking-wider mb-1.5">
              Combat Ratings
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-mono">
              <div className="p-2 rounded bg-surface2/20 border border-border">
                <div className="text-[8px] text-muted font-sans font-bold uppercase">
                  ATK
                </div>
                <div className="font-bold text-primary">{atkBase}</div>
              </div>
              <div className="p-2 rounded bg-surface2/20 border border-border">
                <div className="text-[8px] text-muted font-sans font-bold uppercase">
                  DEF
                </div>
                <div className="font-bold text-primary">{defBase}</div>
              </div>
              <div className="p-2 rounded bg-surface2/20 border border-border">
                <div className="text-[8px] text-muted font-sans font-bold uppercase">
                  HIT
                </div>
                <div className="font-bold text-primary">{hitBase}</div>
              </div>
              <div className="p-2 rounded bg-surface2/20 border border-border">
                <div className="text-[8px] text-muted font-sans font-bold uppercase">
                  CRIT
                </div>
                <div className="font-bold text-accent">{critBase}%</div>
              </div>

              <div className="p-2 rounded bg-surface2/20 border border-border">
                <div className="text-[8px] text-muted font-sans font-bold uppercase">
                  MATK
                </div>
                <div className="font-bold text-primary">
                  {matkMin}~{matkMax}
                </div>
              </div>
              <div className="p-2 rounded bg-surface2/20 border border-border">
                <div className="text-[8px] text-muted font-sans font-bold uppercase">
                  MDEF
                </div>
                <div className="font-bold text-primary">{mdefBase}</div>
              </div>
              <div className="p-2 rounded bg-surface2/20 border border-border">
                <div className="text-[8px] text-muted font-sans font-bold uppercase">
                  FLEE
                </div>
                <div className="font-bold text-primary">{fleeBase}</div>
              </div>
              <div className="p-2 rounded bg-surface2/20 border border-border">
                <div className="text-[8px] text-muted font-sans font-bold uppercase">
                  ASPD
                </div>
                <div className="font-bold text-accent">{aspdBase}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Footer */}
        <div className="flex justify-between text-[10px] text-muted border-t border-border pt-2 font-mono mt-2">
          <span>
            Skill Points: <strong className="text-primary">{char.skillPoint}</strong>
          </span>
          <span>
            Solo Auto-Heal:{" "}
            <strong className="text-success">Active (+15% On Kill)</strong>
          </span>
        </div>
      </div>

      {/* 48-Hour Offline Rest & Expedition Console (Zero Zeny) */}
      <div className="bento-card p-3.5 shrink-0 flex flex-col justify-between">
        <div className="flex items-center justify-between border-b border-border pb-2 mb-2">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">
              Offline Rest & Expedition Yields
            </h3>
          </div>
          {isOffline ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              {timeDisplay} (48h Cap)
            </span>
          ) : totalAccruedMin > 0 ? (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-accent/20 text-accent border border-accent/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              {Math.floor(totalAccruedMin / 60)}h {totalAccruedMin % 60}m Ready
            </span>
          ) : (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface2 text-muted border border-border">
              In-Game Active
            </span>
          )}
        </div>

        {isOffline || totalAccruedMin > 0 ? (
          <div className="space-y-2">
            {/* Live Progress Track */}
            <div>
              <div className="flex justify-between text-[10px] font-mono text-muted mb-1">
                <span>
                  Expedition Progress:{" "}
                  <strong className="text-primary">{Math.round(progressPct)}%</strong>
                </span>
                <span className="text-accent font-semibold">
                  Rate: ~{char.baseLevel * 10} Base EXP/min
                </span>
              </div>
              <div className="w-full bg-surface2 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-accent h-1.5 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.5)] transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Accrued Rewards Summary (Base EXP and Job EXP only) */}
            <div className="grid grid-cols-2 gap-2 text-center pt-1">
              <div className="p-2 rounded-lg bg-surface2/40 border border-border">
                <div className="text-[9px] uppercase font-bold text-muted">
                  Base EXP
                </div>
                <div className="font-mono text-sm font-bold text-primary mt-0.5">
                  +{estBaseExp.toLocaleString()}
                </div>
              </div>
              <div className="p-2 rounded-lg bg-surface2/40 border border-border">
                <div className="text-[9px] uppercase font-bold text-muted">
                  Job EXP
                </div>
                <div className="font-mono text-sm font-bold text-info mt-0.5">
                  +{estJobExp.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="text-[10px] text-muted flex items-center gap-1.5 justify-center border-t border-border pt-2 mt-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
              <span>
                Rewards accumulate safely while offline. Claim your earned Base and Job EXP anytime in-game via the System Tablet without losing accrued progress.
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-surface2/40 border border-border/40 text-xs text-muted">
            <ShieldAlert className="w-4 h-4 text-info shrink-0 mt-0.5" />
            <span>
              Character is currently active in-game. Offline expedition progress begins automatically upon logging out.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
