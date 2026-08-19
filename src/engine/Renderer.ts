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

    // 3. Bricks
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

    // 9. Particle System (Sparks, Rings, Popups)
    particles.render(ctx);

    // 10. In-Game State Overlays (Countdown, etc.)
    if (state === 'countdown') {
      this.renderCountdown(countdownTimer, width, height);
    }

    ctx.restore();
  }

  private renderBackground(width: number, height: number) {
    const ctx = this.ctx;
    
    // Deep dark cyber background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#070714');
    bgGrad.addColorStop(0.5, '#0a0d22');
    bgGrad.addColorStop(1, '#110d29');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Dynamic Synthwave Perspective Grid
    this.gridOffset = (this.gridOffset + 1.2) % 32;
    ctx.save();
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.08)';
    ctx.lineWidth = 1;

    // Vertical lines
    for (let x = 0; x <= width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Horizontal moving lines
    for (let y = this.gridOffset; y <= height; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Ambient glow at bottom horizon
    const horizonGlow = ctx.createRadialGradient(
      width / 2,
      height,
      50,
      width / 2,
      height,
      width / 1.5
    );
    horizonGlow.addColorStop(0, 'rgba(255, 0, 127, 0.15)');
    horizonGlow.addColorStop(0.5, 'rgba(0, 240, 255, 0.08)');
    horizonGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = horizonGlow;
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
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

    // Outer Glow
    ctx.shadowColor = paddle.color;
    ctx.shadowBlur = paddle.isBoosting ? 20 : 12;

    // Paddle Base Gradient
    const grad = ctx.createLinearGradient(-halfW, 0, halfW, 0);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
    grad.addColorStop(0.5, paddle.color);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.2)');

    ctx.fillStyle = grad;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;

    // Beveled curved paddle
    ctx.beginPath();
    ctx.roundRect(-halfW, -halfH, w, h, 6);
    ctx.fill();
    ctx.stroke();

    // Inner energetic core line
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-halfW + 12, 0);
    ctx.lineTo(halfW - 12, 0);
    ctx.stroke();

    // Laser Cannon Barrels (if laser active)
    if (paddle.laserAmmoTimer > 0) {
      ctx.fillStyle = '#ffe600';
      ctx.fillRect(-halfW + 4, -halfH - 6, 6, 6);
      ctx.fillRect(halfW - 10, -halfH - 6, 6, 6);
    }

    // Hand label or ID indicator
    ctx.shadowBlur = 0;
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
    ctx.shadowColor = '#ff007f';
    ctx.shadowBlur = 14;

    ctx.beginPath();
    ctx.moveTo(x1, y1);

    const segments = 6;
    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const interX = x1 + (x2 - x1) * t;
      const interY = y1 + (y2 - y1) * t;
      const jitter = (Math.random() - 0.5) * (30 * (1 - dist / 220));
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
      ctx.fillStyle = ball.isPlasma ? 'rgba(255, 51, 0, ' + pt.alpha + ')' : 'rgba(0, 240, 255, ' + pt.alpha + ')';
      ctx.arc(pt.x, pt.y, pt.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Ball Outer Glow
    ctx.shadowColor = ball.isPlasma ? '#ff3300' : ball.color;
    ctx.shadowBlur = ball.isPlasma ? 20 : 14;

    // 3. Core Ball
    ctx.fillStyle = ball.isPlasma ? '#ff0055' : ball.color;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();

    // 4. White hot center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private renderBrick(brick: Brick) {
    const ctx = this.ctx;
    ctx.save();

    const isBoss = brick.type === 'boss_core';
    const isExplosive = brick.type === 'explosive';
    const isPrism = brick.type === 'prism';

    // Shadow & Glow
    ctx.shadowColor = brick.color;
    ctx.shadowBlur = isBoss || isExplosive ? 14 : 8;

    // Brick Base Fill
    ctx.fillStyle = brick.color;
    ctx.beginPath();
    ctx.roundRect(brick.x, brick.y, brick.width, brick.height, GAME_CONFIG.BRICK.BORDER_RADIUS);
    ctx.fill();

    // High-tech inner gradient overlay
    const grad = ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.1)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0.5)');
    ctx.fillStyle = grad;
    ctx.fill();

    // Border
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = isBoss ? 2 : 1;
    ctx.stroke();

    // Special Brick Icons / Markings
    ctx.shadowBlur = 0;
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
        ctx.fillStyle = i < pips ? '#ffffff' : 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(startX + i * 8, brick.y + brick.height - 5, pipW, 2);
      }
    } else if (isBoss) {
      // Boss Core pulsating health
      const hpPercent = brick.hp / brick.maxHp;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
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
    const pulse = Math.sin(this.time * 6) * 3;
    ctx.shadowColor = item.color;
    ctx.shadowBlur = 12;

    ctx.fillStyle = item.color;
    ctx.beginPath();
    ctx.arc(item.x, item.y, item.radius + pulse * 0.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Icon inside badge
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(item.icon, item.x, item.y);

    ctx.restore();
  }

  private renderLaser(laser: LaserBeam) {
    const ctx = this.ctx;
    ctx.save();
    ctx.shadowColor = laser.color;
    ctx.shadowBlur = 10;
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
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 16;
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
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    ctx.lineWidth = hand.isPinching ? 3 : 1.5;
    ctx.beginPath();
    ctx.arc(screenX, screenY, hand.isPinching ? 18 : 24, 0, Math.PI * 2);
    ctx.stroke();

    // Tilt Direction Pointer
    const tiltLen = 30;
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
    ctx.shadowColor = ctx.fillStyle;
    ctx.shadowBlur = 24;

    const text = timer === 0 ? 'GO!' : timer.toString();
    ctx.fillText(text, width / 2, height / 2);

    ctx.font = '600 20px "Rajdhani", sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.fillText('MOVE HANDS TO POSITION PADDLES', width / 2, height / 2 + 65);

    ctx.restore();
  }
}
