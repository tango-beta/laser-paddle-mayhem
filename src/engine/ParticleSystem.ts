import type { Particle } from '../types';

export class ParticleSystem {
  private pool: Particle[] = [];
  private poolSize: number = 60;
  public screenShake: number = 0;

  constructor(size: number = 60) {
    this.poolSize = size;
    for (let i = 0; i < this.poolSize; i++) {
      this.pool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 3,
        color: '#00f0ff',
        shape: 'circle',
        alpha: 1,
        decay: 0.02,
      });
    }
  }

  public setPoolSize(size: number) {
    this.poolSize = size;
    while (this.pool.length < size) {
      this.pool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        life: 0,
        maxLife: 1,
        size: 3,
        color: '#00f0ff',
        shape: 'circle',
        alpha: 1,
        decay: 0.02,
      });
    }
  }

  private getFreeParticle(): Particle | null {
    for (let i = 0; i < this.poolSize; i++) {
      if (!this.pool[i].active) {
        return this.pool[i];
      }
    }
    return null;
  }

  public triggerScreenShake(amount: number = 6) {
    this.screenShake = Math.max(this.screenShake, amount);
  }

  public emitSparks(x: number, y: number, color: string, count: number = 8, speed: number = 3.5) {
    for (let i = 0; i < count; i++) {
      const p = this.getFreeParticle();
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const velocity = (Math.random() * 0.7 + 0.3) * speed;

      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * velocity;
      p.vy = Math.sin(angle) * velocity;
      p.size = Math.random() * 2.5 + 1.5;
      p.color = color;
      p.shape = 'circle';
      p.life = 1.0;
      p.maxLife = 1.0;
      p.decay = Math.random() * 0.04 + 0.03;
      p.gravity = 0.06;
    }
  }

  public emitShockwave(x: number, y: number, color: string, maxRadius: number = 30) {
    const p = this.getFreeParticle();
    if (!p) return;

    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = 0;
    p.size = 2;
    p.maxLife = maxRadius;
    p.life = 0;
    p.color = color;
    p.shape = 'ring';
    p.decay = 2.0;
    p.gravity = 0;
  }

  public emitScorePopup(x: number, y: number, text: string, color: string = '#ffe600') {
    const p = this.getFreeParticle();
    if (!p) return;

    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = -1.2;
    p.size = 13;
    p.color = color;
    p.shape = 'text';
    p.text = text;
    p.life = 1.0;
    p.maxLife = 1.0;
    p.decay = 0.025;
    p.gravity = 0;
  }

  public emitLaserTrail(x: number, y: number, color: string) {
    const p = this.getFreeParticle();
    if (!p) return;

    p.active = true;
    p.x = x;
    p.y = y;
    p.vx = 0;
    p.vy = 0.5;
    p.size = 2;
    p.color = color;
    p.shape = 'circle';
    p.life = 1.0;
    p.maxLife = 1.0;
    p.decay = 0.1;
    p.gravity = 0;
  }

  public update() {
    if (this.screenShake > 0) {
      this.screenShake *= 0.85;
      if (this.screenShake < 0.2) this.screenShake = 0;
    }

    for (let i = 0; i < this.poolSize; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      if (p.shape === 'ring') {
        p.size += p.decay;
        p.life = p.size / p.maxLife;
        if (p.size >= p.maxLife) {
          p.active = false;
        }
      } else {
        p.x += p.vx;
        p.y += p.vy;
        if (p.gravity) {
          p.vy += p.gravity;
        }
        p.life -= p.decay;
        if (p.life <= 0) {
          p.active = false;
        }
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    for (let i = 0; i < this.poolSize; i++) {
      const p = this.pool[i];
      if (!p.active) continue;

      ctx.save();
      if (p.shape === 'circle') {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.shape === 'ring') {
        const alpha = Math.max(0, 1 - p.life);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.stroke();
      } else if (p.shape === 'text' && p.text) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.font = 'bold 12px "Orbitron", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(p.text, p.x, p.y);
      }
      ctx.restore();
    }
  }

  public clear() {
    for (let i = 0; i < this.poolSize; i++) {
      this.pool[i].active = false;
    }
    this.screenShake = 0;
  }
}
