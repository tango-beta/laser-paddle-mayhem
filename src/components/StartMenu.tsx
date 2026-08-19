import type React from 'react';
import type { GameMode } from '../types';
import { Sparkles, Trophy, Video, MousePointer, Info } from 'lucide-react';

interface StartMenuProps {
  highScore: number;
  isCameraReady: boolean;
  isInitializingCamera: boolean;
  selectedMode: GameMode;
  onSelectMode: (mode: GameMode) => void;
  onStartGame: (withWebcam: boolean) => void;
  onOpenHelp: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  highScore,
  isCameraReady: _isCameraReady,
  isInitializingCamera,
  selectedMode,
  onSelectMode,
  onStartGame,
  onOpenHelp,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-[#070712]/90 backdrop-blur-md p-6 overflow-y-auto select-none">
      <div className="max-w-3xl w-full flex flex-col items-center text-center">
        
        {/* Glowing Title & Subheading */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-neonCyan/10 border border-cyber-neonCyan/30 mb-3">
            <Sparkles size={14} className="text-cyber-neonCyan animate-spin" />
            <span className="font-display text-xs uppercase tracking-widest text-cyber-neonCyan">
              Webcam Gesture Breakout & Pong
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-6xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyber-neonPink via-cyber-neonCyan to-cyber-neonYellow drop-shadow-[0_0_20px_rgba(0,240,255,0.4)]">
            LASER PADDLE
          </h1>
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-widest text-cyber-neonYellow drop-shadow-[0_0_15px_rgba(255,230,0,0.5)] -mt-1">
            MAYHEM
          </h2>
          <p className="font-sans text-sm text-slate-400 mt-2 max-w-md mx-auto">
            Control laser paddles with your hands. Angle shots by tilting your wrists, catch power-ups, and blast through neon firewalls.
          </p>
        </div>

        {/* High Score Banner */}
        {highScore > 0 && (
          <div className="cyber-card px-4 py-1.5 rounded-full border border-cyber-neonYellow/40 mb-6 flex items-center gap-2">
            <Trophy size={14} className="text-cyber-neonYellow" />
            <span className="font-display text-xs text-slate-300">HIGH SCORE:</span>
            <span className="font-mono text-sm font-bold text-cyber-neonYellow">{highScore.toLocaleString()}</span>
          </div>
        )}

        {/* Game Mode Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-8">
          {/* Arcade Mode */}
          <button
            onClick={() => onSelectMode('arcade')}
            className={`p-4 rounded-xl text-left transition-all relative overflow-hidden border cursor-pointer ${
              selectedMode === 'arcade'
                ? 'cyber-card-pink border-cyber-neonPink shadow-neon-pink scale-[1.02]'
                : 'cyber-card border-cyber-border hover:border-slate-600 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🕹️</span>
              <span className="font-display text-[10px] uppercase font-bold text-cyber-neonPink">10 STAGES</span>
            </div>
            <h3 className="font-display text-lg font-bold text-slate-100">CAMPAIGN</h3>
            <p className="text-xs text-slate-400 mt-1">
              Battle through 10 progressive defense sectors and defeat the Cyber Core Boss.
            </p>
          </button>

          {/* Endless Mode */}
          <button
            onClick={() => onSelectMode('endless')}
            className={`p-4 rounded-xl text-left transition-all relative overflow-hidden border cursor-pointer ${
              selectedMode === 'endless'
                ? 'cyber-card border-cyber-neonCyan shadow-neon-cyan scale-[1.02]'
                : 'cyber-card border-cyber-border hover:border-slate-600 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">⚡</span>
              <span className="font-display text-[10px] uppercase font-bold text-cyber-neonCyan">ENDLESS</span>
            </div>
            <h3 className="font-display text-lg font-bold text-slate-100">SURVIVAL</h3>
            <p className="text-xs text-slate-400 mt-1">
              Infinite scaling waves, multiplier combos, and high-velocity neon chaos.
            </p>
          </button>

          {/* Cyber Duel Mode */}
          <button
            onClick={() => onSelectMode('duel')}
            className={`p-4 rounded-xl text-left transition-all relative overflow-hidden border cursor-pointer ${
              selectedMode === 'duel'
                ? 'cyber-card border-cyber-neonYellow shadow-neon-yellow scale-[1.02]'
                : 'cyber-card border-cyber-border hover:border-slate-600 opacity-80 hover:opacity-100'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">🏓</span>
              <span className="font-display text-[10px] uppercase font-bold text-cyber-neonYellow">1V1 VS AI</span>
            </div>
            <h3 className="font-display text-lg font-bold text-slate-100">CYBER DUEL</h3>
            <p className="text-xs text-slate-400 mt-1">
              Dual-hand pong battle: smash past the AI defender while clearing the arena.
            </p>
          </button>
        </div>

        {/* Launch Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md mb-6">
          <button
            onClick={() => onStartGame(true)}
            disabled={isInitializingCamera}
            className="w-full py-4 px-6 rounded-lg bg-gradient-to-r from-cyber-neonPink to-cyber-neonCyan text-white font-display font-extrabold text-base tracking-wider cyber-btn shadow-lg hover:shadow-neon-cyan flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            <Video size={20} />
            {isInitializingCamera ? 'INITIALIZING WEBCAM...' : 'START WITH WEBCAM'}
          </button>

          <button
            onClick={() => onStartGame(false)}
            className="w-full py-4 px-6 rounded-lg bg-cyber-panel hover:bg-cyber-border border border-cyber-border text-slate-300 font-display font-bold text-sm tracking-wider cyber-btn flex items-center justify-center gap-2 transition cursor-pointer"
          >
            <MousePointer size={18} />
            PLAY WITH MOUSE
          </button>
        </div>

        {/* Hand Gesture Cheatsheet bar */}
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1.5 hover:text-cyber-neonCyan transition underline cursor-pointer"
          >
            <Info size={14} /> How to play & Gestures
          </button>
          <span>•</span>
          <span className="text-slate-500">Optimized for Chromebooks & low-spec laptops</span>
        </div>

      </div>
    </div>
  );
};
