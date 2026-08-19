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
  private lastVideoTime: number = -1;
  private animFrameId: number | null = null;
  private listeners: Set<TrackingCallback> = new Set();
  
  // Smoothing buffers for Left and Right hands
  private smoothedLeft: HandData | null = null;
  private smoothedRight: HandData | null = null;
  private smoothingFactor: number = 0.45; // Balance between instant response & smooth stability

  // Performance & FPS tracking
  private lastFpsUpdate: number = performance.now();
  private frameCount: number = 0;
  private currentFps: number = 0;

  // Configuration
  private mirror: boolean = true;
  private downscaleWidth: number = 320;
  private downscaleHeight: number = 240;
  private ecoMode: boolean = false;
  private lastInferenceTime: number = 0;

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
      this.downscaleWidth = 256;
      this.downscaleHeight = 192;
    } else {
      this.downscaleWidth = 320;
      this.downscaleHeight = 240;
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
          minHandDetectionConfidence: 0.45,
          minHandPresenceConfidence: 0.45,
          minTrackingConfidence: 0.45,
        });
      }

      // 2. Initialize Camera Stream
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

    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: deviceId ? { exact: deviceId } : undefined,
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30, max: 30 },
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
    this.lastInferenceTime = performance.now();
    this.processFrame();
  }

  public stop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
  }

  private processFrame = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    const minInterval = this.ecoMode ? 40 : 25; // Throttling: 25fps normal, 20fps eco

    if (
      this.video &&
      this.video.readyState >= 2 &&
      this.landmarker &&
      this.offscreenCtx &&
      this.offscreenCanvas &&
      now - this.lastInferenceTime >= minInterval
    ) {
      this.lastInferenceTime = now;

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
        try {
          const results = this.landmarker.detectForVideo(
            this.offscreenCanvas,
            now
          );
          this.handleDetectionResults(results);
        } catch {
          // Ignore transient detection errors
        }
      }

      // Track FPS
      this.frameCount++;
      if (now - this.lastFpsUpdate >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
        this.state.fps = this.currentFps;
        this.frameCount = 0;
        this.lastFpsUpdate = now;
      }
    }

    this.animFrameId = requestAnimationFrame(this.processFrame);
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
        
        // MediaPipe reports from camera perspective. In selfie/mirror mode, left is right.
        let detectedHand = (handednessCategory?.categoryName || handednessCategory?.displayName || (i === 0 ? 'Right' : 'Left')) as 'Left' | 'Right';
        
        if (this.mirror) {
          detectedHand = detectedHand === 'Left' ? 'Right' : 'Left';
        }

        // Apply mirror to X coordinates if needed
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
      // Single hand detected: if on left half of screen, treat as left, else right (or primary)
      const h = rawHands[0];
      if (h.handedness === 'Left' || h.palmCenter.x < 0.45) {
        leftRaw = h;
      } else {
        rightRaw = h;
      }
    } else if (rawHands.length >= 2) {
      // Sort by X position: leftmost is Left, rightmost is Right
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
