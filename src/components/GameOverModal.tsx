import type React from 'react';
import type { GameState, GameStats } from '../types';
import { RotateCcw, Trophy, Home, Sparkles, Zap } from 'lucide-react';

interface GameOverModalProps {
  state: GameState;
  stats: GameStats;
  onRestart: () => void;
  onHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  state,
  stats,
  onRestart,
  onHome,
}) => {
  const isVictory = state === 'victory';
  const isNewHighScore = stats.score >= stats.highScore && stats.score > 0;

  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-md p-6 select-none">
      <div className="cyber-card max-w-md w-full p-6 sm:p-8 rounded-2xl border border-cyber-neonCyan/40 text-center shadow-2xl relative overflow-hidden">
        
        {/* Glow effect header */}
        <div className="mb-4">
          {isVictory ? (
            <>
              <div className="inline-flex p-3 rounded-full bg-cyber-neonGreen/20 border border-cyber-neonGreen/40 mb-2">
                <Sparkles size={32} className="text-cyber-neonGreen animate-pulse" />
              </div>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-cyber-neonGreen drop-shadow-[0_0_15px_rgba(0,255,102,0.6)]">
                CAMPAIGN CLEARED!
              </h2>
              <p className="text-xs text-slate-300 mt-1">You conquered all 10 Cyber Sectors!</p>
            </>
          ) : (
            <>
              <h2 className="font-display text-3xl sm:text-4xl font-black text-cyber-neonPink drop-shadow-[0_0_15px_rgba(255,0,127,0.6)]">
                GAME OVER
              </h2>
              <p className="text-xs text-slate-400 mt-1">Energy depleted in Sector {stats.stage}</p>
            </>
          )}
        </div>

        {/* New High Score Badge */}
        {isNewHighScore && (
          <div className="mb-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyber-neonYellow/20 border border-cyber-neonYellow animate-bounce text-cyber-neonYellow font-display text-xs font-bold">
            <Trophy size={14} /> NEW HIGH SCORE!
          </div>
        )}

        {/* Score & Stats Breakdown */}
        <div className="cyber-card p-4 rounded-xl border border-cyber-border mb-6 flex flex-col gap-3 bg-[#0a0d22]/80">
          <div className="flex justify-between items-center border-b border-cyber-border/50 pb-2">
            <span className="font-display text-xs text-slate-400">FINAL SCORE</span>
            <span className="font-display text-2xl font-black text-cyber-neonCyan">
              {stats.score.toLocaleString()}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">STAGE REACHED</span>
            <span className="font-mono font-bold text-slate-200">{stats.stage}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">MAX COMBO STREAK</span>
            <span className="font-mono font-bold text-cyber-neonYellow flex items-center gap-1">
              <Zap size={12} /> {stats.maxCombo} HITS
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-400">SURVIVAL TIME</span>
            <span className="font-mono font-bold text-slate-200">
              {Math.floor(stats.timeElapsed)}s
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3">
          <button
            onClick={onRestart}
            className="w-full py-3.5 px-6 rounded-lg bg-gradient-to-r from-cyber-neonPink to-cyber-neonCyan text-white font-display font-extrabold text-sm tracking-wider cyber-btn shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            <RotateCcw size={18} /> PLAY AGAIN
          </button>

          <button
            onClick={onHome}
            className="w-full py-3 px-6 rounded-lg bg-cyber-panel hover:bg-cyber-border border border-cyber-border text-slate-300 font-display font-bold text-xs tracking-wider cyber-btn flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home size={16} /> MAIN MENU
          </button>
        </div>

      </div>
    </div>
  );
};
