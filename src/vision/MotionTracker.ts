import type { HandData } from '../types';

export class MotionTracker {
  private width: number = 80;
  private height: number = 60;
  private prevFrame: Uint8ClampedArray | null = null;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  
  // Smoothed centroid positions (0.0 to 1.0)
  private leftX: number = 0.25;
  private leftY: number = 0.7;
  private rightX: number = 0.75;
  private rightY: number = 0.7;

  private leftActive: boolean = false;
  private rightActive: boolean = false;

  private leftPinch: boolean = false;
  private rightPinch: boolean = false;

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
    leftHand: HandData | null;
    rightHand: HandData | null;
  } {
    const w = this.width;
    const h = this.height;

    // Draw downscaled frame
    this.ctx.drawImage(video, 0, 0, w, h);
    const frame = this.ctx.getImageData(0, 0, w, h);
    const data = frame.data;

    if (!this.prevFrame || this.prevFrame.length !== data.length) {
      this.prevFrame = new Uint8ClampedArray(data);
      return { hands: [], leftHand: null, rightHand: null };
    }

    let leftSumX = 0;
    let leftSumY = 0;
    let leftCount = 0;

    let rightSumX = 0;
    let rightSumY = 0;
    let rightCount = 0;

    const threshold = 28; // motion sensitivity
    const halfW = Math.floor(w / 2);

    for (let y = 4; y < h - 4; y++) {
      for (let x = 4; x < w - 4; x++) {
        const idx = (y * w + x) * 4;

        // Grayscale diff
        const rDiff = Math.abs(data[idx] - this.prevFrame[idx]);
        const gDiff = Math.abs(data[idx + 1] - this.prevFrame[idx + 1]);
        const bDiff = Math.abs(data[idx + 2] - this.prevFrame[idx + 2]);
        const diff = (rDiff + gDiff + bDiff) / 3;

        // Skin-tone / brightness weight (optional boost for human hands)
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const isWarm = r > 60 && g > 40 && b > 20 && r > b;
        const motionWeight = diff > threshold ? (isWarm ? diff * 1.5 : diff) : 0;

        if (motionWeight > threshold) {
          // X position in mirror space
          const mappedX = mirror ? w - 1 - x : x;

          if (mappedX < halfW) {
            leftSumX += mappedX * motionWeight;
            leftSumY += y * motionWeight;
            leftCount += motionWeight;
          } else {
            rightSumX += mappedX * motionWeight;
            rightSumY += y * motionWeight;
            rightCount += motionWeight;
          }
        }
      }
    }

    // Save current frame for next diff
    this.prevFrame.set(data);

    // Minimum motion threshold to consider hand active
    const minMotionCount = 280;
    const lerpRate = 0.35;

    let leftHand: HandData | null = null;
    let rightHand: HandData | null = null;
    const activeHands: HandData[] = [];

    // Process Left Hand Centroid
    if (leftCount > minMotionCount) {
      this.leftActive = true;
      const targetX = leftSumX / leftCount / w;
      const targetY = leftSumY / leftCount / h;

      this.leftX += (targetX - this.leftX) * lerpRate;
      this.leftY += (targetY - this.leftY) * lerpRate;
      this.leftPinch = leftCount > 2500; // Large fast burst triggers smash
    }

    if (this.leftActive) {
      leftHand = this.createSyntheticHand('Left', this.leftX, this.leftY, this.leftPinch);
      activeHands.push(leftHand);
    }

    // Process Right Hand Centroid
    if (rightCount > minMotionCount) {
      this.rightActive = true;
      const targetX = rightSumX / rightCount / w;
      const targetY = rightSumY / rightCount / h;

      this.rightX += (targetX - this.rightX) * lerpRate;
      this.rightY += (targetY - this.rightY) * lerpRate;
      this.rightPinch = rightCount > 2500;
    }

    if (this.rightActive) {
      rightHand = this.createSyntheticHand('Right', this.rightX, this.rightY, this.rightPinch);
      activeHands.push(rightHand);
    }

    return { hands: activeHands, leftHand, rightHand };
  }

  private createSyntheticHand(
    handedness: 'Left' | 'Right',
    normX: number,
    normY: number,
    isPinching: boolean
  ): HandData {
    const palm = { x: normX, y: normY };
    // Generate synthetic 21-joint skeleton points around the centroid for visual HUD radar
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
      handedness,
      landmarks,
      palmCenter: palm,
      indexTip: { x: normX, y: normY - 0.05 },
      thumbTip: { x: normX - 0.03, y: normY - 0.02 },
      wrist: { x: normX, y: normY + 0.05 },
      tilt: (normX - (handedness === 'Left' ? 0.25 : 0.75)) * 0.8, // Tilt follows reach
      isPinching,
      isFist: isPinching,
      pinchDistance: isPinching ? 0.1 : 0.8,
      velocity: { x: 0, y: 0 },
      rawScore: 0.95,
    };
  }

  public reset() {
    this.prevFrame = null;
    this.leftActive = false;
    this.rightActive = false;
  }
}

export const motionTracker = new MotionTracker();
