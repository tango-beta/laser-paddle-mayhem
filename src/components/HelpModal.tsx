import type React from 'react';
import { X, Hand, RotateCw, Zap, Shield, Sparkles } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-6 select-none overflow-y-auto">
      <div className="cyber-card max-w-xl w-full p-6 rounded-2xl border border-cyber-neonCyan/40 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-cyber-border/80 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="text-cyber-neonYellow" size={20} />
            <h2 className="font-display font-bold text-lg text-slate-100 tracking-wider">
              HOW TO PLAY & GESTURES
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:text-cyber-neonPink text-slate-400 transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-slate-300 text-xs sm:text-sm">
          {/* Gesture 1: Dual Paddles */}
          <div className="p-3 rounded-lg bg-cyber-panel border border-cyber-border flex items-start gap-3">
            <div className="p-2 rounded bg-cyber-neonCyan/10 border border-cyber-neonCyan/30 text-cyber-neonCyan">
              <Hand size={22} />
            </div>
            <div>
              <h4 className="font-display font-bold text-slate-100 text-xs">DUAL-HAND PADDLE CONTROL</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Hold your hands up in view of the webcam. Your <strong>Left hand</strong> moves the Left Paddle (Pink) and <strong>Right hand</strong> moves the Right Paddle (Cyan). Single hand mode is also supported!
              </p>
            </div>
          </div>

          {/* Gesture 2: Wrist Tilt */}
          <div className="p-3 rounded-lg bg-cyber-panel border border-cyber-border flex items-start gap-3">
            <div className="p-2 rounded bg-cyber-neonPink/10 border border-cyber-neonPink/30 text-cyber-neonPink">
              <RotateCw size={22} />
            </div>
            <div>
              <h4 className="font-display font-bold text-slate-100 text-xs">WRIST TILT FOR ANGLE AIM</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Tilt your hand left or right to tilt the laser paddle. Use angled paddles to curve shots and bank balls into hard-to-reach brick clusters.
              </p>
            </div>
          </div>

          {/* Gesture 3: Pinch / Power Smash */}
          <div className="p-3 rounded-lg bg-cyber-panel border border-cyber-border flex items-start gap-3">
            <div className="p-2 rounded bg-cyber-neonYellow/10 border border-cyber-neonYellow/30 text-cyber-neonYellow">
              <Zap size={22} />
            </div>
            <div>
              <h4 className="font-display font-bold text-slate-100 text-xs">PINCH / FIST = POWER SMASH & LASERS</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Pinch your thumb and index finger (or make a fist) right as you hit the ball to trigger a <strong>Power Smash</strong> for speed and kinetic boost. If Laser power-up is active, this also fires rapid laser cannons!
              </p>
            </div>
          </div>

          {/* Gesture 4: Clap Proximity */}
          <div className="p-3 rounded-lg bg-cyber-panel border border-cyber-border flex items-start gap-3">
            <div className="p-2 rounded bg-cyber-neonPurple/10 border border-cyber-neonPurple/30 text-cyber-neonPurple">
              <Shield size={22} />
            </div>
            <div>
              <h4 className="font-display font-bold text-slate-100 text-xs">CLAP / PROXIMITY = EMP SHOCKWAVE</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Bring your hands close together (or clap) to unleash an <strong>EMP Shockwave</strong> that damages low-row bricks and deflects falling balls back into play!
              </p>
            </div>
          </div>

          {/* Power-Up legend */}
          <div className="p-3 rounded-lg bg-black/40 border border-cyber-border">
            <h4 className="font-display font-bold text-slate-200 text-xs mb-2">POWER-UP BADGES</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div>⚡ <strong>Multi-Ball:</strong> Triples laser balls</div>
              <div>🔫 <strong>Lasers:</strong> Cannons shoot bricks</div>
              <div>☄️ <strong>Plasma:</strong> Pierces through bricks</div>
              <div>🛡️ <strong>Wide Shield:</strong> Extends paddle width</div>
              <div>⏱️ <strong>Chrono:</strong> Slow-motion aim</div>
              <div>⚓ <strong>Bottom Barrier:</strong> Floor safety net</div>
            </div>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-cyber-border/80 flex justify-end">
          <button
            onClick={onClose}
            className="py-2 px-5 rounded-lg bg-cyber-neonCyan text-[#070712] font-display font-bold text-xs tracking-wider cyber-btn cursor-pointer"
          >
            GOT IT
          </button>
        </div>
      </div>
    </div>
  );
};
