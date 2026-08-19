import React from 'react';
import type { ActivePowerUp, GameMode, GameStats } from '../types';
import { Heart, Pause, Play, Volume2, VolumeX, Settings, Zap } from 'lucide-react';

interface ScoreHUDProps {
  stats: GameStats;
  mode: GameMode;
  isPaused: boolean;
  isMuted: boolean;
  activePowerUps: ActivePowerUp[];
  onTogglePause: () => void;
  onToggleMute: () => void;
  onOpenSettings: () => void;
}

export const ScoreHUD: React.FC<ScoreHUDProps> = ({
  stats,
  mode,
  isPaused,
  isMuted,
  activePowerUps,
  onTogglePause,
  onToggleMute,
  onOpenSettings,
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 px-6 py-3 pointer-events-none select-none flex items-start justify-between">
      {/* Left Section: Mode, Stage & Lives */}
      <div className="flex items-center gap-4 pointer-events-auto">
        <div className="cyber-card px-4 py-2 rounded-lg border border-cyber-neonCyan/30">
          <div className="flex items-center gap-2">
            <span className="font-display font-bold text-xs uppercase tracking-wider text-cyber-neonCyan">
              {mode === 'arcade'
                ? `STAGE ${stats.stage} / ${stats.totalStages}`
                : mode === 'endless'
                ? `WAVE ${stats.stage}`
                : 'CYBER DUEL'}
            </span>
          </div>

          <div className="flex items-center gap-1 mt-1.5">
            {Array.from({ length: stats.maxLives }).map((_, i) => (
              <Heart
                key={i}
                size={16}
                className={`transition-all ${
                  i < stats.lives
                    ? 'text-cyber-neonPink fill-cyber-neonPink filter drop-shadow-[0_0_6px_#ff007f]'
                    : 'text-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Bricks remaining or Duel score */}
        {mode !== 'duel' ? (
          <div className="cyber-card px-3 py-2 rounded-lg border border-cyber-border hidden sm:block">
            <span className="text-[10px] font-display uppercase tracking-widest text-slate-400 block">
              NODES LEFT
            </span>
            <span className="font-mono text-base font-bold text-slate-200">
              {stats.bricksRemaining}
            </span>
          </div>
        ) : (
          <div className="cyber-card px-3 py-2 rounded-lg border border-cyber-border flex gap-3">
            <div>
              <span className="text-[10px] font-display uppercase text-cyber-neonCyan block">YOU</span>
              <span className="font-mono text-base font-bold text-cyber-neonCyan">{stats.playerScore || 0}</span>
            </div>
            <div className="text-slate-600 font-bold self-center">:</div>
            <div>
              <span className="text-[10px] font-display uppercase text-cyber-neonPurple block">AI</span>
              <span className="font-mono text-base font-bold text-cyber-neonPurple">{stats.aiScore || 0}</span>
            </div>
          </div>
        )}
      </div>

      {/* Center Section: Score & Combo Multiplier */}
      <div className="flex flex-col items-center pointer-events-auto">
        <div className="cyber-card px-6 py-2 rounded-xl border border-cyber-neonCyan/40 text-center shadow-neon-cyan">
          <span className="text-[10px] font-display uppercase tracking-widest text-slate-400 block">
            SCORE
          </span>
          <span className="font-display text-2xl sm:text-3xl font-extrabold tracking-wider neon-text-cyan">
            {stats.score.toLocaleString()}
          </span>
        </div>

        {/* Combo Multiplier Banner */}
        {stats.combo > 1 && (
          <div className="mt-1.5 px-3 py-0.5 rounded-full bg-cyber-neonYellow/20 border border-cyber-neonYellow/60 animate-bounce flex items-center gap-1.5">
            <Zap size={12} className="text-cyber-neonYellow" />
            <span className="font-display text-xs font-bold text-cyber-neonYellow tracking-wide">
              COMBO x{stats.multiplier} ({stats.combo} HITS)
            </span>
          </div>
        )}
      </div>

      {/* Right Section: Active Power-Ups & Action Buttons */}
      <div className="flex flex-col items-end gap-2 pointer-events-auto">
        {/* Controls Toolbar */}
        <div className="flex items-center gap-1.5 cyber-card p-1.5 rounded-lg border border-cyber-border mr-48">
          <button
            onClick={onTogglePause}
            className="p-1.5 hover:text-cyber-neonCyan text-slate-300 transition rounded hover:bg-white/5 cursor-pointer"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            {isPaused ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            onClick={onToggleMute}
            className="p-1.5 hover:text-cyber-neonCyan text-slate-300 transition rounded hover:bg-white/5 cursor-pointer"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 hover:text-cyber-neonCyan text-slate-300 transition rounded hover:bg-white/5 cursor-pointer"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>

        {/* Active Power-Up Badges with Timers */}
        <div className="flex flex-col gap-1.5 items-end mr-48">
          {activePowerUps.map((p) => {
            const percent = Math.max(0, Math.min(100, (p.timeLeft / p.duration) * 100));
            return (
              <div
                key={p.type}
                className="cyber-card px-2.5 py-1 rounded border text-[11px] font-display tracking-wider flex flex-col gap-1 w-32 shadow-sm"
                style={{ borderColor: p.color }}
              >
                <div className="flex justify-between items-center text-slate-200">
                  <span className="font-bold text-[10px]" style={{ color: p.color }}>
                    {p.name}
                  </span>
                  <span className="font-mono text-[9px] text-slate-400">
                    {(p.timeLeft / 1000).toFixed(1)}s
                  </span>
                </div>
                <div className="w-full bg-slate-800/80 h-1 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-100"
                    style={{ width: `${percent}%`, backgroundColor: p.color }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
