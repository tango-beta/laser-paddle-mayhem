import type { HandData } from '../types';

export class MotionTracker {
  private width: number = 80;
  private height: number = 60;
  private prevFrame: Uint8ClampedArray | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // Smoothed single hand centroid (0.0 to 1.0)
  private handX: number = 0.5;
  private handY: number = 0.65;
  private isActive: boolean = false;
  private isPinching: boolean = false;
  private lastMotionTime: number = 0;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.width;
    this.canvas.height = this.height;
    const context = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!context) throw new Error('Failed to get 2d context for MotionTracker');
    this.ctx = context;
  }

  public processVideo(video: HTMLVideoElement, mirror: boolean = true): {
    hands: HandData[];
    primaryHand: HandData | null;
  } {
    const w = this.width;
    const h = this.height;

    // Draw downscaled frame
    this.ctx.drawImage(video, 0, 0, w, h);
    const frame = this.ctx.getImageData(0, 0, w, h);
    const data = frame.data;

    if (!this.prevFrame || this.prevFrame.length !== data.length) {
      this.prevFrame = new Uint8ClampedArray(data);
      return { hands: [], primaryHand: null };
    }

    let sumX = 0;
    let sumY = 0;
    let totalWeight = 0;

    const threshold = 26; // motion sensitivity

    for (let y = 3; y < h - 3; y++) {
      for (let x = 3; x < w - 3; x++) {
        const idx = (y * w + x) * 4;

        // Color diff
        const rDiff = Math.abs(data[idx] - this.prevFrame[idx]);
        const gDiff = Math.abs(data[idx + 1] - this.prevFrame[idx + 1]);
        const bDiff = Math.abs(data[idx + 2] - this.prevFrame[idx + 2]);
        const diff = (rDiff + gDiff + bDiff) / 3;

        // Skin/warmth preference
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const isWarm = r > 55 && g > 35 && b > 20 && r > b;
        const weight = diff > threshold ? (isWarm ? diff * 1.6 : diff) : 0;

        if (weight > threshold) {
          const mappedX = mirror ? w - 1 - x : x;
          sumX += mappedX * weight;
          sumY += y * weight;
          totalWeight += weight;
        }
      }
    }

    // Store frame
    this.prevFrame.set(data);

    const minWeightThreshold = 320;
    const now = performance.now();

    if (totalWeight > minWeightThreshold) {
      this.isActive = true;
      this.lastMotionTime = now;

      const targetX = sumX / totalWeight / w;
      const targetY = sumY / totalWeight / h;

      // Smooth exponential decay towards target
      const lerp = 0.45;
      this.handX += (targetX - this.handX) * lerp;
      this.handY += (targetY - this.handY) * lerp;

      // High motion burst = Power smash & lasers
      this.isPinching = totalWeight > 3200;
    } else if (now - this.lastMotionTime > 1500) {
      this.isActive = false;
      this.isPinching = false;
    }

    if (!this.isActive) {
      return { hands: [], primaryHand: null };
    }

    const hand = this.createSyntheticHand(this.handX, this.handY, this.isPinching);
    return { hands: [hand], primaryHand: hand };
  }

  private createSyntheticHand(
    normX: number,
    normY: number,
    isPinching: boolean
  ): HandData {
    const palm = { x: normX, y: normY };
    const tilt = (normX - 0.5) * (Math.PI / 4.5); // Natural tilt toward center/edges

    const landmarks = Array.from({ length: 21 }, (_, i) => {
      const angle = (i / 21) * Math.PI * 2;
      const rad = i === 0 ? 0 : 0.04;
      return {
        x: normX + Math.cos(angle) * rad,
        y: normY + Math.sin(angle) * rad,
        z: 0,
      };
    });

    return {
      handedness: 'Right',
      landmarks,
      palmCenter: palm,
      indexTip: { x: normX, y: normY - 0.05 },
      thumbTip: { x: normX - 0.03, y: normY - 0.02 },
      wrist: { x: normX, y: normY + 0.05 },
      tilt,
      isPinching,
      isFist: isPinching,
      pinchDistance: isPinching ? 0.1 : 0.8,
      velocity: { x: 0, y: 0 },
      rawScore: 0.95,
    };
  }

  public reset() {
    this.prevFrame = null;
    this.isActive = false;
  }
}

export const motionTracker = new MotionTracker();
