export type GameMode = 'arcade' | 'endless' | 'duel';

export type GameState =
  | 'menu'
  | 'countdown'
  | 'playing'
  | 'paused'
  | 'gameover'
  | 'victory'
  | 'stage_cleared';

export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface HandData {
  handedness: 'Left' | 'Right';
  landmarks: HandLandmark[];
  palmCenter: { x: number; y: number };
  indexTip: { x: number; y: number };
  thumbTip: { x: number; y: number };
  wrist: { x: number; y: number };
  tilt: number; // in radians (-PI/4 to +PI/4)
  isPinching: boolean;
  isFist: boolean;
  pinchDistance: number;
  velocity: { x: number; y: number };
  rawScore: number;
}

export interface TrackingState {
  hands: HandData[];
  leftHand: HandData | null;
  rightHand: HandData | null;
  isReady: boolean;
  isDetecting: boolean;
  fps: number;
  activeInput: 'webcam' | 'mouse';
  error: string | null;
}

export interface Paddle {
  id: 'left' | 'right' | 'primary' | 'ai';
  x: number;
  y: number;
  width: number;
  height: number;
  targetX: number;
  targetY: number;
  angle: number;
  targetAngle: number;
  color: string;
  isShooting: boolean;
  isBoosting: boolean;
  boostTimer: number;
  laserCooldown: number;
  powerWideTimer: number;
  laserAmmoTimer: number;
}

export interface BallTrailPoint {
  x: number;
  y: number;
  alpha: number;
  radius: number;
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  speed: number;
  baseSpeed: number;
  color: string;
  trail: BallTrailPoint[];
  isPlasma: boolean;
  plasmaTimer: number;
  isMagnetized: boolean;
  magnetPaddle: 'left' | 'right' | 'primary' | null;
  magnetOffset: number;
  lastHitBy: 'player' | 'ai' | null;
}

export type BrickType =
  | 'standard'
  | 'armored'
  | 'explosive'
  | 'prism'
  | 'boss_shield'
  | 'boss_core'
  | 'moving';

export type PowerUpType =
  | 'multiball'
  | 'laser'
  | 'plasma'
  | 'wide'
  | 'chrono'
  | 'shield'
  | 'extralife';

export interface Brick {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: BrickType;
  hp: number;
  maxHp: number;
  color: string;
  points: number;
  powerupDrop: PowerUpType | null;
  vx?: number;
  minX?: number;
  maxX?: number;
  pulsePhase?: number;
  isDead: boolean;
}

export interface PowerUpItem {
  id: string;
  x: number;
  y: number;
  vy: number;
  type: PowerUpType;
  radius: number;
  color: string;
  icon: string;
  name: string;
  duration: number;
}

export interface ActivePowerUp {
  type: PowerUpType;
  name: string;
  color: string;
  timeLeft: number;
  duration: number;
}

export interface LaserBeam {
  id: string;
  x: number;
  y: number;
  vy: number;
  width: number;
  height: number;
  color: string;
}

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  shape: 'circle' | 'spark' | 'ring' | 'text' | 'square';
  text?: string;
  alpha: number;
  decay: number;
  gravity?: number;
}

export interface GameStats {
  score: number;
  highScore: number;
  lives: number;
  maxLives: number;
  combo: number;
  maxCombo: number;
  multiplier: number;
  stage: number;
  totalStages: number;
  bricksRemaining: number;
  timeElapsed: number;
  ballsInPlay: number;
  aiScore?: number;
  playerScore?: number;
}

export interface GameSettings {
  chromebookEcoMode: boolean;
  mirrorCamera: boolean;
  sensitivity: number;
  soundVolume: number;
  musicVolume: number;
  soundEnabled: boolean;
  musicEnabled: boolean;
  selectedDeviceId: string;
}

export interface LevelDefinition {
  stage: number;
  title: string;
  subtitle: string;
  gridCols: number;
  gridRows: number;
  layout: (BrickType | null)[][];
  special?: 'boss' | 'moving_hazards' | 'speed_zone';
  ballBaseSpeed: number;
  aiOpponent?: boolean;
}
