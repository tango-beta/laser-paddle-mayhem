import type {
  ActivePowerUp,
  Ball,
  Brick,
  GameMode,
  GameState,
  GameStats,
  HandData,
  InputSource,
  LaserBeam,
  Paddle,
  PowerUpItem,
  PowerUpType,
} from '../types';
import { GAME_CONFIG } from '../config/gameConfig';
import { handTracker } from '../vision/HandTracker';
import { soundSynth } from '../audio/SoundSynth';
import { musicSynth } from '../audio/MusicSynth';
import { Physics } from './Physics';
import { ParticleSystem } from './ParticleSystem';
import { LevelManager } from './Levels';
import { Renderer } from './Renderer';

export type GameEngineCallback = (
  stats: GameStats,
  state: GameState,
  activePowerUps: ActivePowerUp[],
  activeInput: InputSource
) => void;

export class GameEngine {
  private renderer: Renderer;
  private particles: ParticleSystem;
  private animFrameId: number | null = null;
  private lastTime: number = 0;
  private accumulator: number = 0;
  private readonly FIXED_TIMESTEP: number = 1 / 60; // Locked 60Hz physics (0.01666s)
  private isRunning: boolean = false;

  // Game States
  public state: GameState = 'menu';
  public mode: GameMode = 'arcade';
  public activeInput: InputSource = 'webcam';
  private lastDirectInputTime: number = 0;
  private countdownTimer: number = 3;
  private countdownInterval: number | null = null;

  // Stats & Progress
  public stats: GameStats = {
    score: 0,
    highScore: 0,
    lives: 3,
    maxLives: 3,
    combo: 0,
    maxCombo: 0,
    multiplier: 1,
    stage: 1,
    totalStages: LevelManager.TOTAL_CAMPAIGN_STAGES,
    bricksRemaining: 0,
    timeElapsed: 0,
    ballsInPlay: 0,
    aiScore: 0,
    playerScore: 0,
  };

  private lastHitTime: number = 0;
  private comboTimeout: number = GAME_CONFIG.SCORING.COMBO_TIMEOUT_MS;

  // Entities (1 Primary Paddle + optional AI paddle in duel)
  private paddles: { left: Paddle; right: Paddle; primary: Paddle; ai?: Paddle };
  private balls: Ball[] = [];
  private bricks: Brick[] = [];
  private powerUps: PowerUpItem[] = [];
  private lasers: LaserBeam[] = [];
  private activePowerUps: Map<PowerUpType, ActivePowerUp> = new Map();

  // Special ability states
  private bottomShieldActive: boolean = false;
  private bottomShieldTimer: number = 0;
  private laserFireCooldown: number = 0;

  // Listeners
  private listeners: Set<GameEngineCallback> = new Set();
  private unsubscribeTracker: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.particles = new ParticleSystem(60);

    // Initialize Paddles (Primary Player Paddle centered)
    this.paddles = {
      primary: {
        id: 'primary',
        x: GAME_CONFIG.CANVAS_WIDTH * 0.5,
        y: GAME_CONFIG.PADDLE.Y_POSITION,
        width: 140, // Generous single paddle width
        height: GAME_CONFIG.PADDLE.HEIGHT,
        targetX: GAME_CONFIG.CANVAS_WIDTH * 0.5,
        targetY: GAME_CONFIG.PADDLE.Y_POSITION,
        angle: 0,
        targetAngle: 0,
        color: GAME_CONFIG.PADDLE.COLOR_PRIMARY,
        isShooting: false,
        isBoosting: false,
        boostTimer: 0,
        laserCooldown: 0,
        powerWideTimer: 0,
        laserAmmoTimer: 0,
      },
      left: {
        id: 'left',
        x: GAME_CONFIG.CANVAS_WIDTH * 0.5,
        y: GAME_CONFIG.PADDLE.Y_POSITION,
        width: 140,
        height: GAME_CONFIG.PADDLE.HEIGHT,
        targetX: GAME_CONFIG.CANVAS_WIDTH * 0.5,
        targetY: GAME_CONFIG.PADDLE.Y_POSITION,
        angle: 0,
        targetAngle: 0,
        color: GAME_CONFIG.PADDLE.COLOR_PRIMARY,
        isShooting: false,
        isBoosting: false,
        boostTimer: 0,
        laserCooldown: 0,
        powerWideTimer: 0,
        laserAmmoTimer: 0,
      },
      right: {
        id: 'right',
        x: GAME_CONFIG.CANVAS_WIDTH * 0.5,
        y: GAME_CONFIG.PADDLE.Y_POSITION,
        width: 140,
        height: GAME_CONFIG.PADDLE.HEIGHT,
        targetX: GAME_CONFIG.CANVAS_WIDTH * 0.5,
        targetY: GAME_CONFIG.PADDLE.Y_POSITION,
        angle: 0,
        targetAngle: 0,
        color: GAME_CONFIG.PADDLE.COLOR_PRIMARY,
        isShooting: false,
        isBoosting: false,
        boostTimer: 0,
        laserCooldown: 0,
        powerWideTimer: 0,
        laserAmmoTimer: 0,
      },
    };

    // Load High Score
    try {
      const savedHigh = localStorage.getItem('laser_paddle_high_score');
      if (savedHigh) this.stats.highScore = parseInt(savedHigh, 10) || 0;
    } catch {
      // Ignore storage errors
    }

    // Subscribe to hand tracking
    this.unsubscribeTracker = handTracker.subscribe((state) => {
      this.handleHandTrackingUpdate(state.hands);
    });
  }

  public subscribe(cb: GameEngineCallback): () => void {
    this.listeners.add(cb);
    cb(this.stats, this.state, Array.from(this.activePowerUps.values()), this.activeInput);
    return () => this.listeners.delete(cb);
  }

  private notify() {
    this.listeners.forEach((cb) =>
      cb(this.stats, this.state, Array.from(this.activePowerUps.values()), this.activeInput)
    );
  }

  // Touchscreen Input Handler
  public setTouchInput(touches: Array<{ x: number; y: number }>) {
    this.activeInput = 'touch';
    this.lastDirectInputTime = performance.now();
    const width = GAME_CONFIG.CANVAS_WIDTH;

    if (touches.length > 0) {
      const touch = touches[0];
      this.paddles.primary.targetX = Math.max(
        this.paddles.primary.width / 2,
        Math.min(width - this.paddles.primary.width / 2, touch.x)
      );
    }
    this.notify();
  }

  // Mouse / Trackpad Input Handler
  public setMouseInput(x: number, _y: number, isDown: boolean) {
    this.activeInput = 'mouse';
    this.lastDirectInputTime = performance.now();

    if (this.state === 'playing') {
      this.paddles.primary.targetX = Math.max(
        this.paddles.primary.width / 2,
        Math.min(GAME_CONFIG.CANVAS_WIDTH - this.paddles.primary.width / 2, x)
      );

      if (isDown) {
        this.fireLasers();
      }
    }
    this.notify();
  }

  private handleHandTrackingUpdate(hands: HandData[]) {
    // If user touched screen or moved mouse recently (<1.2s), prioritize direct touch/mouse
    if (performance.now() - this.lastDirectInputTime < 1200) {
      return;
    }

    if (hands.length === 0) {
      return;
    }

    this.activeInput = 'webcam';
    const width = GAME_CONFIG.CANVAS_WIDTH;
    const hand = hands[0];

    const posX = hand.palmCenter.x * width;
    this.paddles.primary.targetX = Math.max(
      this.paddles.primary.width / 2,
      Math.min(width - this.paddles.primary.width / 2, posX)
    );
    this.paddles.primary.targetAngle = hand.tilt;

    if (hand.isPinching || hand.isFist) {
      this.paddles.primary.isBoosting = true;
      this.paddles.primary.boostTimer = 0.25;
      this.fireLaserFromPaddle(this.paddles.primary);
    }

    this.notify();
  }

  public startGame(mode: GameMode = 'arcade', stage: number = 1) {
    this.mode = mode;
    this.stats.stage = stage;
    this.stats.score = 0;
    this.stats.lives = 3;
    this.stats.combo = 0;
    this.stats.multiplier = 1;
    this.stats.timeElapsed = 0;
    this.stats.aiScore = 0;
    this.stats.playerScore = 0;

    this.activePowerUps.clear();
    this.bottomShieldActive = false;
    this.powerUps = [];
    this.lasers = [];
    this.particles.clear();
    this.accumulator = 0;

    this.loadStage(stage);
    this.startCountdown();
    this.startLoop();
  }

  private loadStage(stage: number) {
    this.powerUps = [];
    this.lasers = [];
    this.activePowerUps.clear();

    if (this.mode === 'arcade') {
      const level = LevelManager.getCampaignLevel(stage);
      this.bricks = LevelManager.createBricksFromLayout(level, GAME_CONFIG.CANVAS_WIDTH);
      this.paddles.ai = undefined;
    } else if (this.mode === 'endless') {
      this.bricks = LevelManager.generateEndlessWave(stage, GAME_CONFIG.CANVAS_WIDTH);
      this.paddles.ai = undefined;
    } else if (this.mode === 'duel') {
      this.bricks = LevelManager.generateDuelArena(GAME_CONFIG.CANVAS_WIDTH);
      this.paddles.ai = {
        id: 'ai',
        x: GAME_CONFIG.CANVAS_WIDTH / 2,
        y: GAME_CONFIG.PADDLE.AI_Y_POSITION,
        width: 140,
        height: GAME_CONFIG.PADDLE.HEIGHT,
        targetX: GAME_CONFIG.CANVAS_WIDTH / 2,
        targetY: GAME_CONFIG.PADDLE.AI_Y_POSITION,
        angle: 0,
        targetAngle: 0,
        color: GAME_CONFIG.PADDLE.COLOR_AI,
        isShooting: false,
        isBoosting: false,
        boostTimer: 0,
        laserCooldown: 0,
        powerWideTimer: 0,
        laserAmmoTimer: 0,
      };
    }

    this.stats.bricksRemaining = this.bricks.filter((b) => !b.isDead).length;
    this.spawnBall();
  }

  private spawnBall() {
    this.balls = [];
    const baseSpeed = GAME_CONFIG.BALL.INITIAL_SPEED + (this.stats.stage - 1) * 0.25;

    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.5;
    this.balls.push({
      id: `ball_${Date.now()}`,
      x: GAME_CONFIG.CANVAS_WIDTH / 2,
      y: GAME_CONFIG.PADDLE.Y_POSITION - 30,
      vx: Math.cos(angle) * baseSpeed,
      vy: Math.sin(angle) * baseSpeed,
      radius: GAME_CONFIG.BALL.RADIUS,
      speed: baseSpeed,
      baseSpeed,
      color: GAME_CONFIG.BALL.COLOR_DEFAULT,
      trail: [],
      isPlasma: false,
      plasmaTimer: 0,
      isMagnetized: false,
      magnetPaddle: null,
      magnetOffset: 0,
      lastHitBy: 'player',
    });

    this.stats.ballsInPlay = this.balls.length;
    this.notify();
  }

  private startCountdown() {
    this.state = 'countdown';
    this.countdownTimer = 3;
    soundSynth.playCountdown(3);
    this.notify();

    if (this.countdownInterval) clearInterval(this.countdownInterval);

    this.countdownInterval = window.setInterval(() => {
      this.countdownTimer--;
      soundSynth.playCountdown(this.countdownTimer);

      if (this.countdownTimer < 0) {
        if (this.countdownInterval) clearInterval(this.countdownInterval);
        this.countdownInterval = null;
        this.state = 'playing';
        musicSynth.start();
        this.notify();
      } else {
        this.notify();
      }
    }, 850);
  }

  public togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      musicSynth.stop();
    } else if (this.state === 'paused') {
      this.state = 'playing';
      musicSynth.start();
    }
    this.notify();
  }

  public restart() {
    this.startGame(this.mode, 1);
  }

  public nextStage() {
    if (this.mode === 'arcade') {
      if (this.stats.stage >= LevelManager.TOTAL_CAMPAIGN_STAGES) {
        this.state = 'victory';
        soundSynth.playVictory();
        this.saveHighScore();
        this.notify();
        return;
      }
      this.stats.stage++;
      this.loadStage(this.stats.stage);
      this.startCountdown();
    } else if (this.mode === 'endless') {
      this.stats.stage++;
      this.loadStage(this.stats.stage);
      this.startCountdown();
    }
  }

  public fireLasers() {
    this.fireLaserFromPaddle(this.paddles.primary);
  }

  private fireLaserFromPaddle(paddle: Paddle) {
    if (this.laserFireCooldown > 0 || paddle.laserCooldown > 0) return;

    const hasLaserPower = this.activePowerUps.has('laser');
    if (!hasLaserPower && paddle.laserAmmoTimer <= 0) return;

    paddle.laserCooldown = 0.15;
    this.laserFireCooldown = 0.12;

    soundSynth.playLaserShot();

    const halfW = paddle.width / 2;
    this.lasers.push({
      id: `laser_${Date.now()}_1`,
      x: paddle.x - halfW + 8,
      y: paddle.y - paddle.height,
      vy: -GAME_CONFIG.LASER.SPEED,
      width: GAME_CONFIG.LASER.WIDTH,
      height: GAME_CONFIG.LASER.HEIGHT,
      color: GAME_CONFIG.LASER.COLOR,
    });

    this.lasers.push({
      id: `laser_${Date.now()}_2`,
      x: paddle.x + halfW - 8,
      y: paddle.y - paddle.height,
      vy: -GAME_CONFIG.LASER.SPEED,
      width: GAME_CONFIG.LASER.WIDTH,
      height: GAME_CONFIG.LASER.HEIGHT,
      color: GAME_CONFIG.LASER.COLOR,
    });
  }

  public startLoop() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.loop();
  }

  public stopLoop() {
    this.isRunning = false;
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    musicSynth.stop();
  }

  // Fixed Timestep Game Loop (Locked 60Hz Physics across all displays 60Hz, 120Hz, 144Hz, 240Hz)
  private loop = () => {
    if (!this.isRunning) return;

    const now = performance.now();
    let frameTime = (now - this.lastTime) / 1000;
    if (frameTime > 0.1) frameTime = 0.1; // clamp to prevent spiral of death on tab freeze
    this.lastTime = now;

    if (this.state === 'playing') {
      this.accumulator += frameTime;
      while (this.accumulator >= this.FIXED_TIMESTEP) {
        this.update(this.FIXED_TIMESTEP);
        this.accumulator -= this.FIXED_TIMESTEP;
      }
    } else {
      this.accumulator = 0;
    }

    // Always render canvas at native display refresh rate
    const activeHands = handTracker.getState().hands;
    this.renderer.render(
      this.state,
      this.paddles,
      false, // Single hand paddle mode
      this.balls,
      this.bricks,
      this.powerUps,
      this.lasers,
      this.particles,
      activeHands,
      this.bottomShieldActive,
      this.countdownTimer
    );

    this.animFrameId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.stats.timeElapsed += dt;

    if (this.laserFireCooldown > 0) this.laserFireCooldown -= dt;

    // 1. Smooth Primary Paddle towards target
    this.updatePaddles(dt);

    // 2. AI Paddle Logic (Duel Mode)
    if (this.paddles.ai) {
      this.updateAIPaddle();
    }

    // 3. Update Active Power-Ups
    this.updateActivePowerUps(dt);

    // 4. Update Lasers
    this.updateLasers();

    // 5. Update Falling Power-Ups
    this.updateFallingPowerUps();

    // 6. Update Bricks
    this.updateBricks();

    // 7. Update Balls & Collisions
    this.updateBalls(dt);

    // 8. Update Particles
    this.particles.update();

    // 9. Check Combo decay
    if (this.stats.combo > 0 && performance.now() - this.lastHitTime > this.comboTimeout) {
      this.stats.combo = 0;
      this.stats.multiplier = 1;
      this.notify();
    }

    // 10. Check Level Completion
    this.checkStageProgress();
  }

  private updatePaddles(dt: number) {
    const lerpAlpha = 1 - Math.exp(-22 * dt);
    const p = this.paddles.primary;
    
    p.x += (p.targetX - p.x) * lerpAlpha;
    p.angle += (p.targetAngle - p.angle) * lerpAlpha;
    if (p.boostTimer > 0) {
      p.boostTimer -= dt;
      if (p.boostTimer <= 0) p.isBoosting = false;
    }
    if (p.laserCooldown > 0) p.laserCooldown -= dt;
    if (p.powerWideTimer > 0) {
      p.powerWideTimer -= dt;
      p.width = 190;
    } else {
      p.width = 140;
    }
  }

  private updateAIPaddle() {
    const ai = this.paddles.ai;
    if (!ai) return;

    let targetBall = this.balls[0];
    for (const b of this.balls) {
      if (b.vy < 0 && (!targetBall || b.y < targetBall.y)) {
        targetBall = b;
      }
    }

    if (targetBall) {
      ai.targetX = Math.max(
        ai.width / 2,
        Math.min(GAME_CONFIG.CANVAS_WIDTH - ai.width / 2, targetBall.x)
      );
    }

    ai.x += (ai.targetX - ai.x) * 0.08;
  }

  private updateActivePowerUps(dt: number) {
    let powerUpChanged = false;
    this.activePowerUps.forEach((power, type) => {
      power.timeLeft -= dt * 1000;
      if (power.timeLeft <= 0) {
        this.activePowerUps.delete(type);
        powerUpChanged = true;

        if (type === 'wide') {
          this.paddles.primary.powerWideTimer = 0;
        } else if (type === 'shield') {
          this.bottomShieldActive = false;
        }
      }
    });

    if (this.bottomShieldActive) {
      this.bottomShieldTimer -= dt;
      if (this.bottomShieldTimer <= 0) {
        this.bottomShieldActive = false;
      }
    }

    if (powerUpChanged) this.notify();
  }

  private updateLasers() {
    for (let i = this.lasers.length - 1; i >= 0; i--) {
      const laser = this.lasers[i];
      laser.y += laser.vy;

      let hit = false;
      for (const brick of this.bricks) {
        if (!brick.isDead && Physics.checkLaserBrickCollision(laser, brick)) {
          hit = true;
          brick.hp--;
          soundSynth.playBrickHit(brick.type);
          this.particles.emitSparks(laser.x, laser.y, brick.color, 4);

          if (brick.hp <= 0) {
            this.destroyBrick(brick);
          }
          break;
        }
      }

      if (hit || laser.y < 0) {
        this.lasers.splice(i, 1);
      }
    }
  }

  private updateFallingPowerUps() {
    for (let i = this.powerUps.length - 1; i >= 0; i--) {
      const item = this.powerUps[i];
      item.y += item.vy;

      const pad = this.paddles.primary;
      if (Physics.checkPowerUpPaddleCollision(item, pad)) {
        this.activatePowerUp(item.type, pad);
        this.particles.emitShockwave(item.x, item.y, item.color, 35);
        this.particles.emitScorePopup(item.x, item.y - 15, item.name, item.color);
        this.powerUps.splice(i, 1);
      } else if (item.y > GAME_CONFIG.CANVAS_HEIGHT + 30) {
        this.powerUps.splice(i, 1);
      }
    }
  }

  private activatePowerUp(type: PowerUpType, paddle: Paddle) {
    soundSynth.playPowerUpCollect(type);
    const cfg = GAME_CONFIG.POWERUPS.TYPES[type];

    if (type === 'multiball') {
      const newBalls: Ball[] = [];
      this.balls.forEach((ball) => {
        for (let i = -1; i <= 1; i += 2) {
          const speed = ball.speed;
          const angle = Math.atan2(ball.vy, ball.vx) + i * 0.4;
          newBalls.push({
            id: `ball_multi_${Date.now()}_${Math.random()}`,
            x: ball.x,
            y: ball.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: ball.radius,
            speed,
            baseSpeed: ball.baseSpeed,
            color: ball.color,
            trail: [],
            isPlasma: ball.isPlasma,
            plasmaTimer: ball.plasmaTimer,
            isMagnetized: false,
            magnetPaddle: null,
            magnetOffset: 0,
            lastHitBy: 'player',
          });
        }
      });
      this.balls.push(...newBalls);
      this.stats.ballsInPlay = this.balls.length;
    } else if (type === 'extralife') {
      this.stats.lives = Math.min(this.stats.maxLives + 1, this.stats.lives + 1);
      this.particles.emitScorePopup(paddle.x, paddle.y - 40, '+1 LIFE!', '#ec4899');
    } else if (type === 'wide') {
      this.paddles.primary.powerWideTimer = GAME_CONFIG.POWERUPS.DURATION / 1000;
    } else if (type === 'plasma') {
      this.balls.forEach((b) => {
        b.isPlasma = true;
        b.plasmaTimer = GAME_CONFIG.POWERUPS.DURATION / 1000;
      });
    } else if (type === 'chrono') {
      this.balls.forEach((b) => {
        b.vx *= 0.55;
        b.vy *= 0.55;
      });
    } else if (type === 'shield') {
      this.bottomShieldActive = true;
      this.bottomShieldTimer = GAME_CONFIG.POWERUPS.DURATION / 1000;
    } else if (type === 'laser') {
      paddle.laserAmmoTimer = GAME_CONFIG.POWERUPS.DURATION / 1000;
    }

    this.activePowerUps.set(type, {
      type,
      name: cfg.name,
      color: cfg.color,
      timeLeft: GAME_CONFIG.POWERUPS.DURATION,
      duration: GAME_CONFIG.POWERUPS.DURATION,
    });

    this.notify();
  }

  private updateBricks() {
    for (const brick of this.bricks) {
      if (brick.isDead) continue;

      if (brick.vx !== undefined && brick.minX !== undefined && brick.maxX !== undefined) {
        brick.x += brick.vx;
        if (brick.x <= brick.minX || brick.x >= brick.maxX) {
          brick.vx = -brick.vx;
        }
      }
    }
  }

  private updateBalls(dt: number) {
    const width = GAME_CONFIG.CANVAS_WIDTH;
    const height = GAME_CONFIG.CANVAS_HEIGHT;

    for (let i = this.balls.length - 1; i >= 0; i--) {
      const ball = this.balls[i];

      if (ball.isPlasma) {
        ball.plasmaTimer -= dt;
        if (ball.plasmaTimer <= 0) ball.isPlasma = false;
      }

      ball.trail.push({ x: ball.x, y: ball.y, alpha: 0.7, radius: ball.radius * 0.9 });
      if (ball.trail.length > 6) ball.trail.shift();
      ball.trail.forEach((pt) => (pt.alpha *= 0.8));

      ball.x += ball.vx;
      ball.y += ball.vy;

      // 1. Wall Collisions
      if (ball.x - ball.radius <= 0) {
        ball.x = ball.radius;
        ball.vx = Math.abs(ball.vx);
        soundSynth.playPaddleBounce(true);
        this.particles.emitSparks(ball.x, ball.y, '#00f0ff', 4);
      } else if (ball.x + ball.radius >= width) {
        ball.x = width - ball.radius;
        ball.vx = -Math.abs(ball.vx);
        soundSynth.playPaddleBounce(false);
        this.particles.emitSparks(ball.x, ball.y, '#ff007f', 4);
      }

      // 2. Ceiling Collision
      if (ball.y - ball.radius <= 0) {
        ball.y = ball.radius;
        ball.vy = Math.abs(ball.vy);
        soundSynth.playPaddleBounce(true);
        this.particles.emitSparks(ball.x, ball.y, '#00f0ff', 4);

        if (this.mode === 'duel') {
          this.stats.playerScore = (this.stats.playerScore || 0) + 1;
          this.addScore(1000);
          this.particles.emitScorePopup(ball.x, 60, 'GOAL!', '#00ff66');
          this.notify();
        }
      }

      // 3. Paddle Collisions
      const testPaddles = [this.paddles.primary];
      if (this.paddles.ai) {
        testPaddles.push(this.paddles.ai);
      }

      for (const pad of testPaddles) {
        const col = Physics.checkBallPaddleCollision(ball, pad);
        if (col && col.collided) {
          Physics.resolvePaddleBounce(ball, pad, col);
          ball.lastHitBy = pad.id === 'ai' ? 'ai' : 'player';

          soundSynth.playPaddleBounce(pad.id === 'primary', pad.isBoosting);
          this.particles.emitSparks(ball.x, ball.y, pad.color, pad.isBoosting ? 10 : 5);
          this.particles.emitShockwave(ball.x, ball.y, pad.color, 20);

          if (pad.isBoosting) {
            this.particles.triggerScreenShake(4);
            this.particles.emitScorePopup(pad.x, pad.y - 25, 'POWER SMASH!', '#ffe600');
          }
          break;
        }
      }

      // 4. Brick Collisions
      for (const brick of this.bricks) {
        if (brick.isDead) continue;

        const brickCol = Physics.checkBallBrickCollision(ball, brick);
        if (brickCol && brickCol.collided) {
          if (!ball.isPlasma) {
            if (brickCol.side === 'top' || brickCol.side === 'bottom') {
              ball.vy = -ball.vy;
            } else {
              ball.vx = -ball.vx;
            }
          }

          brick.hp--;
          soundSynth.playBrickHit(brick.type);
          this.particles.emitSparks(ball.x, ball.y, brick.color, 5);

          if (brick.hp <= 0) {
            this.destroyBrick(brick);
          }
          break;
        }
      }

      // 5. Bottom Floor Handling
      if (ball.y + ball.radius >= height) {
        if (this.bottomShieldActive) {
          ball.y = height - ball.radius - 14;
          ball.vy = -Math.abs(ball.vy);
          soundSynth.playPaddleBounce(true, true);
          this.particles.emitShockwave(ball.x, height - 10, '#a855f7', 30);
        } else {
          this.balls.splice(i, 1);
          this.stats.ballsInPlay = this.balls.length;

          if (this.balls.length === 0) {
            this.handleLifeLost();
          }
        }
      }
    }
  }

  private destroyBrick(brick: Brick) {
    brick.isDead = true;
    this.stats.bricksRemaining = this.bricks.filter((b) => !b.isDead).length;

    this.stats.combo++;
    this.stats.maxCombo = Math.max(this.stats.maxCombo, this.stats.combo);
    this.stats.multiplier = Math.min(
      GAME_CONFIG.SCORING.MAX_MULTIPLIER,
      1 + Math.floor(this.stats.combo / 3)
    );
    this.lastHitTime = performance.now();

    const earnedPoints = brick.points * this.stats.multiplier;
    this.addScore(earnedPoints);

    soundSynth.playBrickDestroy(brick.type === 'explosive');
    soundSynth.playCombo(this.stats.combo);

    this.particles.emitSparks(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 8);
    this.particles.emitShockwave(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color, 25);
    this.particles.emitScorePopup(
      brick.x + brick.width / 2,
      brick.y,
      `+${earnedPoints}${this.stats.multiplier > 1 ? ` (x${this.stats.multiplier})` : ''}`,
      brick.color
    );

    if (brick.type === 'explosive') {
      this.particles.triggerScreenShake(8);
      const blastRadius = 85;
      this.bricks.forEach((other) => {
        if (!other.isDead) {
          const dx = other.x + other.width / 2 - (brick.x + brick.width / 2);
          const dy = other.y + other.height / 2 - (brick.y + brick.height / 2);
          if (Math.hypot(dx, dy) <= blastRadius) {
            other.hp--;
            if (other.hp <= 0) {
              this.destroyBrick(other);
            }
          }
        }
      });
    }

    if (brick.powerupDrop) {
      const pCfg = GAME_CONFIG.POWERUPS.TYPES[brick.powerupDrop];
      this.powerUps.push({
        id: `powerup_${Date.now()}_${Math.random()}`,
        x: brick.x + brick.width / 2,
        y: brick.y + brick.height / 2,
        vy: GAME_CONFIG.POWERUPS.FALL_SPEED,
        type: brick.powerupDrop,
        radius: GAME_CONFIG.POWERUPS.RADIUS,
        color: pCfg.color,
        icon: pCfg.icon,
        name: pCfg.name,
        duration: GAME_CONFIG.POWERUPS.DURATION,
      });
    }
  }

  private handleLifeLost() {
    this.stats.lives--;
    this.stats.combo = 0;
    this.stats.multiplier = 1;
    soundSynth.playLifeLost();
    this.particles.triggerScreenShake(8);

    if (this.stats.lives <= 0) {
      this.state = 'gameover';
      musicSynth.stop();
      this.saveHighScore();
      this.notify();
    } else {
      this.spawnBall();
      this.startCountdown();
    }
  }

  private addScore(points: number) {
    this.stats.score += points;
    if (this.stats.score > this.stats.highScore) {
      this.stats.highScore = this.stats.score;
    }
    this.notify();
  }

  private saveHighScore() {
    try {
      localStorage.setItem('laser_paddle_high_score', this.stats.highScore.toString());
    } catch {
      // Ignore storage errors
    }
  }

  private checkStageProgress() {
    if (this.bricks.every((b) => b.isDead)) {
      this.state = 'stage_cleared';
      soundSynth.playVictory();
      this.particles.triggerScreenShake(6);
      this.notify();

      setTimeout(() => {
        if (this.state === 'stage_cleared') {
          this.nextStage();
        }
      }, 2000);
    }
  }

  public destroy() {
    this.stopLoop();
    if (this.unsubscribeTracker) {
      this.unsubscribeTracker();
    }
  }
}
