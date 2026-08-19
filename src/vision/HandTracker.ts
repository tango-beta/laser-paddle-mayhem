import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { HandData, HandLandmark, TrackingState } from '../types';
import { GestureRecognizer } from './GestureRecognizer';

export type TrackingCallback = (state: TrackingState) => void;

export class HandTracker {
  private video: HTMLVideoElement | null = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;
  private landmarker: HandLandmarker | null = null;
  private stream: MediaStream | null = null;
  private isRunning: boolean = false;
  private isInitializing: boolean = false;
  private isProcessing: boolean = false;
  private lastVideoTime: number = -1;
  private timerId: number | null = null;
  private listeners: Set<TrackingCallback> = new Set();
  
  // Smoothing buffers for Left and Right hands
  private smoothedLeft: HandData | null = null;
  private smoothedRight: HandData | null = null;
  private smoothingFactor: number = 0.4;

  // Performance & FPS tracking
  private lastFpsUpdate: number = performance.now();
  private frameCount: number = 0;
  private currentFps: number = 0;

  // Configuration (Ultra-lightweight dimensions for Chromebooks)
  private mirror: boolean = true;
  private downscaleWidth: number = 240;
  private downscaleHeight: number = 180;
  private ecoMode: boolean = true; // Default to eco mode for high performance

  private state: TrackingState = {
    hands: [],
    leftHand: null,
    rightHand: null,
    isReady: false,
    isDetecting: false,
    fps: 0,
    activeInput: 'webcam',
    error: null,
  };

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.downscaleWidth;
    this.offscreenCanvas.height = this.downscaleHeight;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
  }

  public setEcoMode(eco: boolean) {
    this.ecoMode = eco;
    if (eco) {
      this.downscaleWidth = 192;
      this.downscaleHeight = 144;
    } else {
      this.downscaleWidth = 240;
      this.downscaleHeight = 180;
    }
    if (this.offscreenCanvas) {
      this.offscreenCanvas.width = this.downscaleWidth;
      this.offscreenCanvas.height = this.downscaleHeight;
    }
  }

  public setMirror(mirror: boolean) {
    this.mirror = mirror;
  }

  public subscribe(cb: TrackingCallback): () => void {
    this.listeners.add(cb);
    cb(this.state);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) => cb(this.state));
  }

  public async initialize(deviceId?: string): Promise<boolean> {
    if (this.isInitializing) return false;
    this.isInitializing = true;

    try {
      // 1. Initialize MediaPipe Vision Tasks Resolver
      if (!this.landmarker) {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );

        this.landmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numHands: 2,
          minHandDetectionConfidence: 0.4,
          minHandPresenceConfidence: 0.4,
          minTrackingConfidence: 0.4,
        });
      }

      // 2. Initialize Camera Stream with low resolution to save CPU
      await this.startCamera(deviceId);

      this.state.isReady = true;
      this.state.error = null;
      this.notify();
      this.startLoop();
      return true;
    } catch (err: unknown) {
      console.warn('MediaPipe / Camera init error:', err);
      const errMsg = err instanceof Error ? err.message : 'Webcam access failed';
      this.state.error = errMsg;
      this.state.isReady = false;
      this.state.activeInput = 'mouse';
      this.notify();
      return false;
    } finally {
      this.isInitializing = false;
    }
  }

  public async startCamera(deviceId?: string): Promise<void> {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }

    // Request low resolution from camera directly (huge CPU saving on low-end hardware)
    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 320, max: 480 },
        height: { ideal: 240, max: 360 },
        frameRate: { ideal: 24, max: 30 },
        facingMode: 'user',
      },
      audio: false,
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    this.stream = stream;

    if (!this.video) {
      this.video = document.createElement('video');
      this.video.setAttribute('playsinline', 'true');
      this.video.setAttribute('muted', 'true');
      this.video.muted = true;
    }

    this.video.srcObject = stream;
    await this.video.play();
  }

  public async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'videoinput');
    } catch {
      return [];
    }
  }

  public startLoop() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.scheduleNextInference(0);
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }

  private scheduleNextInference(delayMs: number) {
    if (!this.isRunning) return;
    this.timerId = window.setTimeout(this.runInference, delayMs);
  }

  // Non-blocking asynchronous inference loop
  private runInference = () => {
    if (!this.isRunning) return;

    const tStart = performance.now();
    let nextDelay = this.ecoMode ? 50 : 35; // Target 20-28 Hz tracking

    if (
      this.video &&
      this.video.readyState >= 2 &&
      this.landmarker &&
      this.offscreenCtx &&
      this.offscreenCanvas &&
      !this.isProcessing
    ) {
      this.isProcessing = true;

      try {
        // Downscale video frame to offscreen canvas
        this.offscreenCtx.drawImage(
          this.video,
          0,
          0,
          this.downscaleWidth,
          this.downscaleHeight
        );

        const videoTime = this.video.currentTime;
        if (videoTime !== this.lastVideoTime) {
          this.lastVideoTime = videoTime;
          const results = this.landmarker.detectForVideo(
            this.offscreenCanvas,
            tStart
          );
          this.handleDetectionResults(results);
        }

        // Measure time spent in inference to adaptively throttle
        const elapsed = performance.now() - tStart;
        // Keep CPU usage below ~35% by sleeping at least 1.5x of inference duration
        nextDelay = Math.max(nextDelay, Math.round(elapsed * 1.5));

        // Track Tracking FPS
        this.frameCount++;
        if (tStart - this.lastFpsUpdate >= 1000) {
          this.currentFps = Math.round((this.frameCount * 1000) / (tStart - this.lastFpsUpdate));
          this.state.fps = this.currentFps;
          this.frameCount = 0;
          this.lastFpsUpdate = tStart;
        }
      } catch {
        // Ignore transient errors
      } finally {
        this.isProcessing = false;
      }
    }

    this.scheduleNextInference(nextDelay);
  };

  private handleDetectionResults(results: {
    landmarks: Array<Array<{ x: number; y: number; z: number }>>;
    handedness: Array<Array<{ displayName?: string; categoryName?: string; score?: number }>>;
  }) {
    const rawHands: HandData[] = [];
    const hasLandmarks = results.landmarks && results.landmarks.length > 0;

    if (hasLandmarks) {
      for (let i = 0; i < results.landmarks.length; i++) {
        const rawLandmarks = results.landmarks[i];
        const handednessCategory = results.handedness?.[i]?.[0];
        
        let detectedHand = (handednessCategory?.categoryName || handednessCategory?.displayName || (i === 0 ? 'Right' : 'Left')) as 'Left' | 'Right';
        
        if (this.mirror) {
          detectedHand = detectedHand === 'Left' ? 'Right' : 'Left';
        }

        const landmarks: HandLandmark[] = rawLandmarks.map((lm) => ({
          x: this.mirror ? 1.0 - lm.x : lm.x,
          y: lm.y,
          z: lm.z,
        }));

        const scale = GestureRecognizer.calculateHandScale(landmarks);
        const palmCenter = GestureRecognizer.getPalmCenter(landmarks);
        const tilt = GestureRecognizer.calculateTilt(landmarks);
        const { isPinching, distance: pinchDistance } = GestureRecognizer.detectPinch(landmarks, scale);
        const isFist = GestureRecognizer.detectFist(landmarks, scale);

        rawHands.push({
          handedness: detectedHand,
          landmarks,
          palmCenter,
          indexTip: { x: landmarks[8].x, y: landmarks[8].y },
          thumbTip: { x: landmarks[4].x, y: landmarks[4].y },
          wrist: { x: landmarks[0].x, y: landmarks[0].y },
          tilt,
          isPinching,
          isFist,
          pinchDistance,
          velocity: { x: 0, y: 0 },
          rawScore: handednessCategory?.score ?? 0.9,
        });
      }
    }

    // Separate into Left and Right Hand slots & apply EMA smoothing
    let leftRaw: HandData | null = null;
    let rightRaw: HandData | null = null;

    if (rawHands.length === 1) {
      const h = rawHands[0];
      if (h.handedness === 'Left' || h.palmCenter.x < 0.45) {
        leftRaw = h;
      } else {
        rightRaw = h;
      }
    } else if (rawHands.length >= 2) {
      const sorted = [...rawHands].sort((a, b) => a.palmCenter.x - b.palmCenter.x);
      leftRaw = sorted[0];
      rightRaw = sorted[1];
      leftRaw.handedness = 'Left';
      rightRaw.handedness = 'Right';
    }

    this.smoothedLeft = this.smoothHandData(this.smoothedLeft, leftRaw);
    this.smoothedRight = this.smoothHandData(this.smoothedRight, rightRaw);

    const activeHands: HandData[] = [];
    if (this.smoothedLeft) activeHands.push(this.smoothedLeft);
    if (this.smoothedRight) activeHands.push(this.smoothedRight);

    this.state.hands = activeHands;
    this.state.leftHand = this.smoothedLeft;
    this.state.rightHand = this.smoothedRight;
    this.state.isDetecting = activeHands.length > 0;
    this.notify();
  }

  private smoothHandData(prev: HandData | null, next: HandData | null): HandData | null {
    if (!next) return null;
    if (!prev) return { ...next };

    const alpha = this.smoothingFactor;
    const smoothPt = (p1: { x: number; y: number }, p2: { x: number; y: number }) => ({
      x: p1.x * (1 - alpha) + p2.x * alpha,
      y: p1.y * (1 - alpha) + p2.y * alpha,
    });

    const smoothedPalm = smoothPt(prev.palmCenter, next.palmCenter);
    const smoothedIndex = smoothPt(prev.indexTip, next.indexTip);
    const smoothedThumb = smoothPt(prev.thumbTip, next.thumbTip);
    const smoothedWrist = smoothPt(prev.wrist, next.wrist);
    const smoothedTilt = prev.tilt * (1 - alpha) + next.tilt * alpha;

    const velocity = {
      x: (smoothedPalm.x - prev.palmCenter.x) * 60,
      y: (smoothedPalm.y - prev.palmCenter.y) * 60,
    };

    return {
      ...next,
      palmCenter: smoothedPalm,
      indexTip: smoothedIndex,
      thumbTip: smoothedThumb,
      wrist: smoothedWrist,
      tilt: smoothedTilt,
      velocity,
    };
  }

  public getState(): TrackingState {
    return this.state;
  }
}

export const handTracker = new HandTracker();
