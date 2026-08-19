import type { Ball, Brick, LaserBeam, Paddle, PowerUpItem } from '../types';

export class Physics {
  // Check collision between a ball and a tilted paddle
  public static checkBallPaddleCollision(
    ball: Ball,
    paddle: Paddle
  ): { collided: boolean; normalX: number; normalY: number; impactOffset: number } | null {
    // Transform ball coordinate into paddle's local rotated space
    const cos = Math.cos(-paddle.angle);
    const sin = Math.sin(-paddle.angle);

    const relX = ball.x - paddle.x;
    const relY = ball.y - paddle.y;

    const localX = relX * cos - relY * sin;
    const localY = relX * sin + relY * cos;

    const halfW = paddle.width / 2;
    const halfH = paddle.height / 2;

    // Closest point in paddle AABB in local space
    const closestX = Math.max(-halfW, Math.min(halfW, localX));
    const closestY = Math.max(-halfH, Math.min(halfH, localY));

    const distX = localX - closestX;
    const distY = localY - closestY;
    const distSq = distX * distX + distY * distY;

    if (distSq <= ball.radius * ball.radius) {
      // Collision detected! Calculate normal in local space
      let localNormX = distX;
      let localNormY = distY;
      const len = Math.sqrt(localNormX * localNormX + localNormY * localNormY);

      if (len > 0) {
        localNormX /= len;
        localNormY /= len;
      } else {
        localNormY = -1; // Default upwards
      }

      // Transform normal back to world space
      const worldNormX = localNormX * Math.cos(paddle.angle) - localNormY * Math.sin(paddle.angle);
      const worldNormY = localNormX * Math.sin(paddle.angle) + localNormY * Math.cos(paddle.angle);

      // Impact offset across paddle (-1.0 left, 0.0 center, +1.0 right)
      const impactOffset = Math.max(-1, Math.min(1, closestX / halfW));

      return {
        collided: true,
        normalX: worldNormX,
        normalY: worldNormY,
        impactOffset,
      };
    }

    return null;
  }

  // Resolve bounce reflection on paddle
  public static resolvePaddleBounce(
    ball: Ball,
    paddle: Paddle,
    collision: { normalX: number; normalY: number; impactOffset: number }
  ) {
    const isPlayerPaddle = paddle.id !== 'ai';
    
    // Calculate launch angle based on paddle angle and impact offset
    const steerAngle = paddle.angle + (collision.impactOffset * (Math.PI / 3.2));
    const currentSpeed = Math.min(ball.speed * (paddle.isBoosting ? 1.25 : 1.02), 16);
    ball.speed = currentSpeed;

    if (isPlayerPaddle) {
      // Upward launch angle
      const targetAngle = -Math.PI / 2 + steerAngle * 0.75;
      // Clamp launch angle to avoid purely horizontal bouncing
      const clampedAngle = Math.max(-Math.PI * 0.85, Math.min(-Math.PI * 0.15, targetAngle));

      ball.vx = Math.cos(clampedAngle) * ball.speed;
      ball.vy = Math.sin(clampedAngle) * ball.speed;
      ball.y = paddle.y - paddle.height - ball.radius - 2;
    } else {
      // AI Paddle downwards launch
      const targetAngle = Math.PI / 2 + steerAngle * 0.75;
      const clampedAngle = Math.max(Math.PI * 0.15, Math.min(Math.PI * 0.85, targetAngle));

      ball.vx = Math.cos(clampedAngle) * ball.speed;
      ball.vy = Math.sin(clampedAngle) * ball.speed;
      ball.y = paddle.y + paddle.height + ball.radius + 2;
    }

    // Ensure minimum vertical velocity
    const minVy = ball.speed * 0.35;
    if (Math.abs(ball.vy) < minVy) {
      ball.vy = (ball.vy < 0 ? -1 : 1) * minVy;
    }
  }

  // Check collision between ball and brick
  public static checkBallBrickCollision(
    ball: Ball,
    brick: Brick
  ): { collided: boolean; side: 'top' | 'bottom' | 'left' | 'right' } | null {
    const halfW = brick.width / 2;
    const halfH = brick.height / 2;
    const brickCenterX = brick.x + halfW;
    const brickCenterY = brick.y + halfH;

    const distX = Math.abs(ball.x - brickCenterX);
    const distY = Math.abs(ball.y - brickCenterY);

    if (distX > halfW + ball.radius) return null;
    if (distY > halfH + ball.radius) return null;

    if (distX <= halfW) {
      return {
        collided: true,
        side: ball.y < brickCenterY ? 'top' : 'bottom',
      };
    }

    if (distY <= halfH) {
      return {
        collided: true,
        side: ball.x < brickCenterX ? 'left' : 'right',
      };
    }

    const cornerDistSq = Math.pow(distX - halfW, 2) + Math.pow(distY - halfH, 2);
    if (cornerDistSq <= ball.radius * ball.radius) {
      const isTop = ball.y < brickCenterY;
      const isLeft = ball.x < brickCenterX;
      return {
        collided: true,
        side: Math.abs(distX - halfW) > Math.abs(distY - halfH) ? (isLeft ? 'left' : 'right') : (isTop ? 'top' : 'bottom'),
      };
    }

    return null;
  }

  // Check laser beam vs brick collision
  public static checkLaserBrickCollision(laser: LaserBeam, brick: Brick): boolean {
    return (
      laser.x + laser.width / 2 >= brick.x &&
      laser.x - laser.width / 2 <= brick.x + brick.width &&
      laser.y <= brick.y + brick.height &&
      laser.y + laser.height >= brick.y
    );
  }

  // Check powerup item vs paddle collision
  public static checkPowerUpPaddleCollision(item: PowerUpItem, paddle: Paddle): boolean {
    const halfW = paddle.width / 2;
    const halfH = paddle.height / 2;
    const distX = Math.abs(item.x - paddle.x);
    const distY = Math.abs(item.y - paddle.y);

    if (distX > halfW + item.radius) return false;
    if (distY > halfH + item.radius) return false;

    if (distX <= halfW || distY <= halfH) return true;

    const cornerDistSq = Math.pow(distX - halfW, 2) + Math.pow(distY - halfH, 2);
    return cornerDistSq <= item.radius * item.radius;
  }
}
