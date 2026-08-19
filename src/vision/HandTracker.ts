import { FilesetResolver, HandLandmarker } from '@mediapipe/tasks-vision';
import type { HandData, HandLandmark, TrackingMode, TrackingState } from '../types';
import { GestureRecognizer } from './GestureRecognizer';
import { motionTracker } from './MotionTracker';

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
  private animFrameId: number | null = null;
  private listeners: Set<TrackingCallback> = new Set();
  
  // Tracking Mode: 'turbo' (ultra-fast 60 FPS motion centroid) or 'mediapipe' (21-landmark mesh)
  private trackingMode: TrackingMode = 'turbo';

  // Smoothing buffer for Primary hand
  private smoothedHand: HandData | null = null;
  private smoothingFactor: number = 0.45;

  // Performance & FPS tracking
  private lastFpsUpdate: number = performance.now();
  private frameCount: number = 0;
  private currentFps: number = 60;

  // Configuration
  private mirror: boolean = true;
  private downscaleWidth: number = 240;
  private downscaleHeight: number = 180;

  private state: TrackingState = {
    hands: [],
    leftHand: null,
    rightHand: null,
    isReady: false,
    isDetecting: false,
    fps: 0,
    activeInput: 'webcam',
    trackingMode: 'turbo',
    error: null,
  };

  constructor() {
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.downscaleWidth;
    this.offscreenCanvas.height = this.downscaleHeight;
    this.offscreenCtx = this.offscreenCanvas.getContext('2d', { willReadFrequently: true });
  }

  public setTrackingMode(mode: TrackingMode) {
    this.trackingMode = mode;
    this.state.trackingMode = mode;
    this.notify();

    if (mode === 'mediapipe' && !this.landmarker) {
      this.initMediaPipe();
    }
  }

  public setEcoMode(eco: boolean) {
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

  private async initMediaPipe(): Promise<boolean> {
    try {
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
          numHands: 1, // Single primary hand
          minHandDetectionConfidence: 0.35,
          minHandPresenceConfidence: 0.35,
          minTrackingConfidence: 0.35,
        });
      }
      return true;
    } catch (e) {
      console.warn('MediaPipe init fallback to Turbo tracker:', e);
      this.trackingMode = 'turbo';
      this.state.trackingMode = 'turbo';
      return false;
    }
  }

  public async initialize(deviceId?: string): Promise<boolean> {
    if (this.isInitializing) return false;
    this.isInitializing = true;

    try {
      // 1. Initialize camera stream
      await this.startCamera(deviceId);

      this.state.isReady = true;
      this.state.error = null;
      this.notify();
      this.startLoop();
      return true;
    } catch (err: unknown) {
      console.warn('Camera access failed:', err);
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
        width: { ideal: 320, max: 480 },
        height: { ideal: 240, max: 360 },
        frameRate: { ideal: 30, max: 60 },
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
    this.processLoop();
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

  private processLoop = () => {
    if (!this.isRunning) return;

    const now = performance.now();

    if (this.video && this.video.readyState >= 2 && !this.isProcessing) {
      if (this.trackingMode === 'turbo') {
        const result = motionTracker.processVideo(this.video, this.mirror);
        this.state.hands = result.hands;
        this.state.leftHand = null;
        this.state.rightHand = result.primaryHand;
        this.state.isDetecting = result.hands.length > 0;
        this.notify();
      } else if (this.trackingMode === 'mediapipe' && this.landmarker && this.offscreenCtx && this.offscreenCanvas) {
        this.isProcessing = true;
        try {
          this.offscreenCtx.drawImage(this.video, 0, 0, this.downscaleWidth, this.downscaleHeight);
          const videoTime = this.video.currentTime;
          if (videoTime !== this.lastVideoTime) {
            this.lastVideoTime = videoTime;
            const results = this.landmarker.detectForVideo(this.offscreenCanvas, now);
            this.handleMediaPipeResults(results);
          }
        } catch {
          // Ignore
        } finally {
          this.isProcessing = false;
        }
      }

      // Track Tracking FPS
      this.frameCount++;
      if (now - this.lastFpsUpdate >= 1000) {
        this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
        this.state.fps = this.currentFps;
        this.frameCount = 0;
        this.lastFpsUpdate = now;
      }
    }

    this.animFrameId = requestAnimationFrame(this.processLoop);
  };

  private handleMediaPipeResults(results: {
    landmarks: Array<Array<{ x: number; y: number; z: number }>>;
    handedness: Array<Array<{ displayName?: string; categoryName?: string; score?: number }>>;
  }) {
    const hasLandmarks = results.landmarks && results.landmarks.length > 0;

    if (hasLandmarks) {
      const rawLandmarks = results.landmarks[0];
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

      const rawHand: HandData = {
        handedness: 'Right',
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
        rawScore: 0.95,
      };

      this.smoothedHand = this.smoothHandData(this.smoothedHand, rawHand);
    } else {
      this.smoothedHand = null;
    }

    const activeHands: HandData[] = this.smoothedHand ? [this.smoothedHand] : [];
    this.state.hands = activeHands;
    this.state.leftHand = null;
    this.state.rightHand = this.smoothedHand;
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

    return {
      ...next,
      palmCenter: smoothPt(prev.palmCenter, next.palmCenter),
      indexTip: smoothPt(prev.indexTip, next.indexTip),
      thumbTip: smoothPt(prev.thumbTip, next.thumbTip),
      wrist: smoothPt(prev.wrist, next.wrist),
      tilt: prev.tilt * (1 - alpha) + next.tilt * alpha,
      velocity: { x: 0, y: 0 },
    };
  }

  public getState(): TrackingState {
    return this.state;
  }
}

export const handTracker = new HandTracker();
