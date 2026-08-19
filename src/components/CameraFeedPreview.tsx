import { useEffect, useRef, useState } from 'react';
import { Camera, Eye, EyeOff, Sparkles } from 'lucide-react';
import { handTracker } from '../vision/HandTracker';
import type { TrackingState } from '../types';

interface CameraFeedPreviewProps {
  onToggleSettings: () => void;
}

export const CameraFeedPreview: React.FC<CameraFeedPreviewProps> = ({ onToggleSettings }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMinimized, setIsMinimized] = useState(false);
  const [trackingState, setTrackingState] = useState<TrackingState>(handTracker.getState());

  useEffect(() => {
    const unsub = handTracker.subscribe((state) => {
      setTrackingState(state);
      drawSkeleton(state);
    });
    return unsub;
  }, []);

  const drawSkeleton = (state: TrackingState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    // Dark cyber radar background
    ctx.fillStyle = '#0a0c1a';
    ctx.fillRect(0, 0, w, h);

    // Grid radar lines
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, w / 3, 0, Math.PI * 2);
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.moveTo(w / 2, 0);
    ctx.lineTo(w / 2, h);
    ctx.stroke();

    // Landmark connections
    const connections = [
      [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
      [0, 5], [5, 6], [6, 7], [7, 8], // Index
      [5, 9], [9, 10], [10, 11], [11, 12], // Middle
      [9, 13], [13, 14], [14, 15], [15, 16], // Ring
      [13, 17], [17, 18], [18, 19], [19, 20], // Pinky
      [0, 17], // Palm base
    ];

    if (state.hands && state.hands.length > 0) {
      state.hands.forEach((hand) => {
        const isLeft = hand.handedness === 'Left';
        const color = isLeft ? '#ff007f' : '#00f0ff';

        // Draw bone lines
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        for (const [from, to] of connections) {
          const p1 = hand.landmarks[from];
          const p2 = hand.landmarks[to];
          if (p1 && p2) {
            ctx.beginPath();
            ctx.moveTo(p1.x * w, p1.y * h);
            ctx.lineTo(p2.x * w, p2.y * h);
            ctx.stroke();
          }
        }

        // Draw joint points
        hand.landmarks.forEach((lm, idx) => {
          const isTip = [4, 8, 12, 16, 20].includes(idx);
          ctx.fillStyle = isTip ? '#ffffff' : color;
          ctx.beginPath();
          ctx.arc(lm.x * w, lm.y * h, isTip ? 2.5 : 1.5, 0, Math.PI * 2);
          ctx.fill();
        });

        // Palm center ring
        ctx.strokeStyle = hand.isPinching ? '#ffe600' : '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(hand.palmCenter.x * w, hand.palmCenter.y * h, 6, 0, Math.PI * 2);
        ctx.stroke();
      });
    } else {
      // Empty prompt
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.font = '10px "Orbitron", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('NO HANDS DETECTED', w / 2, h / 2 + 4);
    }
  };

  return (
    <div className="absolute top-4 right-4 z-30 select-none">
      <div className="cyber-card rounded-lg p-2 border border-cyber-neonCyan/30 shadow-lg">
        <div className="flex items-center justify-between gap-2 mb-1.5 px-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                trackingState.isDetecting
                  ? 'bg-cyber-neonGreen animate-pulse'
                  : trackingState.isReady
                  ? 'bg-cyber-neonYellow'
                  : 'bg-red-500'
              }`}
            />
            <span className="font-display text-[10px] uppercase font-bold tracking-wider text-slate-300">
              {trackingState.isDetecting
                ? `TRACKING (${trackingState.hands.length} HAND${trackingState.hands.length > 1 ? 'S' : ''})`
                : trackingState.isReady
                ? 'WAITING FOR HANDS'
                : 'MOUSE MODE'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="p-1 hover:text-cyber-neonCyan text-slate-400 transition"
              title={isMinimized ? 'Expand Radar' : 'Minimize Radar'}
            >
              {isMinimized ? <Eye size={13} /> : <EyeOff size={13} />}
            </button>
            <button
              onClick={onToggleSettings}
              className="p-1 hover:text-cyber-neonCyan text-slate-400 transition"
              title="Camera Settings"
            >
              <Camera size={13} />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <div className="relative rounded overflow-hidden border border-cyber-border">
            <canvas ref={canvasRef} width={160} height={120} className="w-[160px] h-[120px] block" />
            <div className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-black/60 font-mono text-[9px] text-cyber-neonCyan">
              {trackingState.fps} FPS
            </div>
            {trackingState.leftHand && trackingState.rightHand && (
              <div className="absolute top-1 left-1 px-1 py-0.5 rounded bg-cyber-neonYellow/20 border border-cyber-neonYellow/40 font-display text-[8px] text-cyber-neonYellow flex items-center gap-1">
                <Sparkles size={8} /> DUAL-HAND
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
