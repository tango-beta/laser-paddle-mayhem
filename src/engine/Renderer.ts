import type {
  Ball,
  Brick,
  GameState,
  HandData,
  LaserBeam,
  Paddle,
  PowerUpItem,
} from '../types';
import { GAME_CONFIG } from '../config/gameConfig';
import { ParticleSystem } from './ParticleSystem';

export class Renderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gridOffset: number = 0;
  private time: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Could not get CanvasRenderingContext2D');
    this.ctx = context;
  }

  public render(
    state: GameState,
    paddles: { left: Paddle; right: Paddle; primary: Paddle; ai?: Paddle },
    isDualHand: boolean,
    balls: Ball[],
    bricks: Brick[],
    powerUps: PowerUpItem[],
    lasers: LaserBeam[],
    particles: ParticleSystem,
    hands: HandData[],
    bottomShieldActive: boolean,
    countdownTimer: number = 0
  ) {
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    this.time += 0.025;

    // Apply Screen Shake
    ctx.save();
    if (particles.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * particles.screenShake;
      const shakeY = (Math.random() - 0.5) * particles.screenShake;
      ctx.translate(shakeX, shakeY);
    }

    // 1. Cyber Synthwave Background
    this.renderBackground(width, height);

    // 2. Bottom Defensive Shield Barrier (if active power-up)
    if (bottomShieldActive) {
      this.renderBottomShield(width, height);
    }

    // 3. Bricks (Fast Vector Rendering without shadowBlur)
    for (const brick of bricks) {
      if (!brick.isDead) {
        this.renderBrick(brick);
      }
    }

    // 4. Power-Up Items Falling
    for (const item of powerUps) {
      this.renderPowerUpItem(item);
    }

    // 5. Laser Blaster Beams
    for (const laser of lasers) {
      this.renderLaser(laser);
    }

    // 6. Laser Balls & Trails
    for (const ball of balls) {
      this.renderBall(ball);
    }

    // 7. Paddles & Electric Hand Arcs
    if (isDualHand) {
      this.renderPaddle(paddles.left);
      this.renderPaddle(paddles.right);

      // Electric arc between paddles if close (Clap EMP Tether)
      const dist = Math.hypot(paddles.left.x - paddles.right.x, paddles.left.y - paddles.right.y);
      if (dist < 220) {
        this.renderElectricArc(paddles.left.x, paddles.left.y, paddles.right.x, paddles.right.y, dist);
      }
    } else {
      this.renderPaddle(paddles.primary);
    }

    // Render AI Paddle in Duel Mode
    if (paddles.ai) {
      this.renderPaddle(paddles.ai);
    }

    // 8. Visual Hand Tracking Indicators (Energy Gauntlet Rings)
    for (const hand of hands) {
      this.renderHandAura(hand, width, height);
    }

    // 9. Particle System
    particles.render(ctx);

    // 10. In-Game State Overlays (Countdown, etc.)
    if (state === 'countdown') {
      this.renderCountdown(countdownTimer, width, height);
    }

    ctx.restore();
  }

  private renderBackground(width: number, height: number) {
    const ctx = this.ctx;
    
    // Deep dark cyber background fill (fast solid fill)
    ctx.fillStyle = '#070714';
    ctx.fillRect(0, 0, width, height);

    // Dynamic Synthwave Perspective Grid
    this.gridOffset = (this.gridOffset + 1.2) % 32;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.07)';
    ctx.lineWidth = 1;

    // Vertical lines
    ctx.beginPath();
    for (let x = 0; x <= width; x += 48) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }

    // Horizontal moving lines
    for (let y = this.gridOffset; y <= height; y += 32) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();

    // Ambient glow gradient at bottom horizon
    const horizonGlow = ctx.createLinearGradient(0, height - 120, 0, height);
    horizonGlow.addColorStop(0, 'transparent');
    horizonGlow.addColorStop(1, 'rgba(255, 0, 127, 0.12)');
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, height - 120, width, 120);
  }

  private renderPaddle(paddle: Paddle) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(paddle.x, paddle.y);
    ctx.rotate(paddle.angle);

    const w = paddle.width;
    const h = paddle.height;
    const halfW = w / 2;
    const halfH = h / 2;

    // Fast Dual-Layer Neon Glow Outline (0ms CPU cost vs 15ms shadowBlur)
    ctx.strokeStyle = paddle.color;
    ctx.lineWidth = paddle.isBoosting ? 5 : 3;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.roundRect(-halfW - 2, -halfH - 2, w + 4, h + 4, 7);
    ctx.stroke();

    // Solid core body
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = '#0c0f24';
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, w, h, 6);
    ctx.fill();

    // Inner bright neon rim
    ctx.strokeStyle = paddle.isBoosting ? '#ffffff' : paddle.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center Energy Core Line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-halfW + 14, 0);
    ctx.lineTo(halfW - 14, 0);
    ctx.stroke();

    // Laser Cannon Barrels (if laser active)
    if (paddle.laserAmmoTimer > 0) {
      ctx.fillStyle = '#ffe600';
      ctx.fillRect(-halfW + 4, -halfH - 5, 5, 5);
      ctx.fillRect(halfW - 9, -halfH - 5, 5, 5);
    }

    // Paddle label
    ctx.font = 'bold 9px "Orbitron", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    const label = paddle.id === 'left' ? 'L' : paddle.id === 'right' ? 'R' : paddle.id === 'ai' ? 'AI' : 'P1';
    ctx.fillText(label, 0, 3);

    ctx.restore();
  }

  private renderElectricArc(x1: number, y1: number, x2: number, y2: number, dist: number) {
    const ctx = this.ctx;
    ctx.save();
    ctx.strokeStyle = '#ffe600';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(x1, y1);

    const segments = 5;
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const interX = x1 + (x2 - x1) * t;
      const interY = y1 + (y2 - y1) * t;
      const jitter = (Math.random() - 0.5) * (24 * (1 - dist / 220));
      ctx.lineTo(interX, interY + jitter);
    }

    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  private renderBall(ball: Ball) {
    const ctx = this.ctx;
    ctx.save();

    // 1. Render Tail
    for (let i = 0; i < ball.trail.length; i++) {
      const pt = ball.trail[i];
      ctx.beginPath();
      ctx.fillStyle = ball.isPlasma ? `rgba(255, 51, 0, ${pt.alpha})` : `rgba(0, 240, 255, ${pt.alpha})`;
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Outer Glow Ring
    ctx.strokeStyle = ball.isPlasma ? '#ff3300' : ball.color;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius + 2, 0, Math.PI * 2);
    ctx.stroke();

    // 3. Core Ball
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = ball.isPlasma ? '#ff0055' : ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // 4. White hot center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderBrick(brick: Brick) {
    const ctx = this.ctx;
    ctx.save();

    const isBoss = brick.type === 'boss_core';
    const isExplosive = brick.type === 'explosive';
    const isPrism = brick.type === 'prism';

    // Brick Base Fill
    ctx.fillStyle = brick.color;
    ctx.beginPath();
    ctx.roundRect(brick.x, brick.y, brick.width, brick.height, GAME_CONFIG.BRICK.BORDER_RADIUS);
    ctx.fill();

    // High-contrast gloss sheen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.fillRect(brick.x + 1, brick.y + 1, brick.width - 2, Math.floor(brick.height * 0.4));

    // Outer Crisp Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = isBoss ? 2 : 1;
    ctx.stroke();

    // Special Brick Icons / Markings
    if (isExplosive) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('⚡', brick.x + brick.width / 2, brick.y + brick.height / 2 + 4);
    } else if (isPrism) {
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Orbitron", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('◈', brick.x + brick.width / 2, brick.y + brick.height / 2 + 4);
    } else if (brick.type === 'armored') {
      // HP indicators for armored brick
      const pips = brick.hp;
      const pipW = 6;
      const startX = brick.x + (brick.width - (brick.maxHp * 8)) / 2;
      for (let i = 0; i < brick.maxHp; i++) {
        ctx.fillStyle = i < pips ? '#ffffff' : 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(startX + i * 8, brick.y + brick.height - 5, pipW, 2);
      }
    } else if (isBoss) {
      // Boss Core health bar
      const hpPercent = brick.hp / brick.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(brick.x + 8, brick.y + brick.height - 8, brick.width - 16, 4);
      ctx.fillStyle = '#ff0055';
      ctx.fillRect(brick.x + 8, brick.y + brick.height - 8, (brick.width - 16) * hpPercent, 4);
    }

    ctx.restore();
  }

  private renderPowerUpItem(item: PowerUpItem) {
    const ctx = this.ctx;
    ctx.save();

    // Pulsing holographic badge
    const pulse = Math.sin(this.time * 6) * 2;
    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.radius + pulse * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Icon inside badge
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.icon, item.x, item.y);

    ctx.restore();
  }

  private renderLaser(laser: LaserBeam) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = laser.color;
    ctx.fillRect(laser.x - laser.width / 2, laser.y, laser.width, laser.height);
    
    // Core white beam
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(laser.x - 1, laser.y, 2, laser.height);
    ctx.restore();
  }

  private renderBottomShield(width: number, height: number) {
    const ctx = this.ctx;
    ctx.save();
    const y = height - 12;
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 4;

    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, y);
    ctx.lineTo(width - 20, y);
    ctx.stroke();

    ctx.restore();
  }

  private renderHandAura(hand: HandData, width: number, height: number) {
    const ctx = this.ctx;
    ctx.save();
    const screenX = hand.palmCenter.x * width;
    const screenY = hand.palmCenter.y * height;

    const isLeft = hand.handedness === 'Left';
    const color = isLeft ? GAME_CONFIG.PADDLE.COLOR_LEFT : GAME_CONFIG.PADDLE.COLOR_RIGHT;

    // Glowing energy ring around palm
    ctx.strokeStyle = color;
    ctx.lineWidth = hand.isPinching ? 3 : 1.5;
    ctx.beginPath();
    ctx.arc(screenX, screenY, hand.isPinching ? 18 : 24, 0, Math.PI * 2);
    ctx.stroke();

    // Tilt Direction Pointer
    const tiltLen = 28;
    const pointerX = screenX + Math.sin(hand.tilt) * tiltLen;
    const pointerY = screenY - Math.cos(hand.tilt) * tiltLen;

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(screenX, screenY);
    ctx.lineTo(pointerX, pointerY);
    ctx.stroke();

    ctx.restore();
  }

  private renderCountdown(timer: number, width: number, height: number) {
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = 'rgba(7, 7, 18, 0.6)';
    ctx.fillRect(0, 0, width, height);

    ctx.font = '900 72px "Orbitron", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = timer === 0 ? '#00ff66' : '#ffe600';

    const text = timer === 0 ? 'GO!' : timer.toString();
    ctx.fillText(text, width / 2, height / 2);

    ctx.font = '600 20px "Rajdhani", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('MOVE HANDS TO POSITION PADDLES', width / 2, height / 2 + 65);

    ctx.restore();
  }
}
