import type React from 'react';
import { X, Hand, RotateCw, Zap, Smartphone, Sparkles } from 'lucide-react';

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
              HOW TO PLAY & CONTROLS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:text-cyber-neonPink text-slate-400 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4 text-slate-300 text-xs sm:text-sm">
          {/* Control 1: Hand Movement */}
          <div className="p-3 rounded-lg bg-cyber-panel border border-cyber-border flex items-start gap-3">
            <div className="p-2 rounded bg-cyber-neonCyan/10 border border-cyber-neonCyan/30 text-cyber-neonCyan">
              <Hand size={22} />
            </div>
            <div>
              <h4 className="font-display font-bold text-slate-100 text-xs">WEBCAM HAND TRACKING</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Wave your hand in view of the webcam. The laser paddle will smoothly track your hand position across the screen at a locked 60 FPS.
              </p>
            </div>
          </div>

          {/* Control 2: Wrist Tilt */}
          <div className="p-3 rounded-lg bg-cyber-panel border border-cyber-border flex items-start gap-3">
            <div className="p-2 rounded bg-cyber-neonPink/10 border border-cyber-neonPink/30 text-cyber-neonPink">
              <RotateCw size={22} />
            </div>
            <div>
              <h4 className="font-display font-bold text-slate-100 text-xs">WRIST TILT FOR PRECISION ANGLES</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Tilt your hand left or right to tilt the paddle. Use angled deflections to bank balls into tricky corners and avoid hazards.
              </p>
            </div>
          </div>

          {/* Control 3: Pinch / Fast Motion */}
          <div className="p-3 rounded-lg bg-cyber-panel border border-cyber-border flex items-start gap-3">
            <div className="p-2 rounded bg-cyber-neonYellow/10 border border-cyber-neonYellow/30 text-cyber-neonYellow">
              <Zap size={22} />
            </div>
            <div>
              <h4 className="font-display font-bold text-slate-100 text-xs">PINCH / FIST = POWER SMASH & LASERS</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                Pinch your fingers or make a fast motion burst to trigger a <strong>Power Smash</strong> for kinetic velocity boost and fire laser cannons!
              </p>
            </div>
          </div>

          {/* Control 4: Touchscreen & Mouse */}
          <div className="p-3 rounded-lg bg-cyber-panel border border-cyber-border flex items-start gap-3">
            <div className="p-2 rounded bg-cyber-neonGreen/10 border border-cyber-neonGreen/30 text-cyber-neonGreen">
              <Smartphone size={22} />
            </div>
            <div>
              <h4 className="font-display font-bold text-slate-100 text-xs">TOUCHSCREEN & MOUSE SUPPORT</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                On touchscreen Chromebooks, drag directly on the screen. With a mouse or trackpad, guide the cursor and click to fire.
              </p>
            </div>
          </div>

          {/* Power-Up legend */}
          <div className="p-3 rounded-lg bg-black/40 border border-cyber-border">
            <h4 className="font-display font-bold text-slate-200 text-xs mb-2">POWER-UP BADGES</h4>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div>⚡ <strong>Multi-Ball:</strong> Triples active laser balls</div>
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
