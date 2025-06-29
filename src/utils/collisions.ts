// FILE: src/utils/collisions.ts
// FINAL FIX: Proper "moving away" detection for paddle collisions + Anti-farming wall collision fix

import { Ball, Enemy, Paddle } from '../types/game';
import { getDifficultySettings, BASE_BALL_SPEED } from './difficulty';

export interface CollisionResult {
  vx: number;
  vy: number;
  x?: number;
  y?: number;
}

export interface BallCollisionResult {
  ball1: { vx: number; vy: number };
  ball2: { vx: number; vy: number };
}

export interface BallSeparationResult {
  ball1: { x: number; y: number };
  ball2: { x: number; y: number };
}

/**
 * FIXED: Checks if a ball collides with the game walls and prevents easy farming mode.
 * When ball hits wall at ~90 degrees (±5 degrees), trajectory is changed by 45 degrees.
 */
export function checkBallWallCollision(
    ball: Ball,
    gameWidth: number,
    gameHeight: number
): CollisionResult | null {
  const nextX = ball.x + ball.vx;
  const nextY = ball.y + ball.vy;
  let newVx = ball.vx;
  let newVy = ball.vy;
  let hasCollision = false;

  // Check horizontal walls (left/right)
  if (nextX - ball.radius <= 0 || nextX + ball.radius >= gameWidth) {
    newVx = -ball.vx;
    hasCollision = true;

    // ANTI-FARMING FIX: Check if ball is hitting wall at ~90 degrees (±5 degrees)
    const angle = Math.atan2(Math.abs(ball.vy), Math.abs(ball.vx));
    const angleInDegrees = (angle * 180) / Math.PI;

    // If angle is close to 90 degrees (very vertical trajectory)
    if (angleInDegrees >= 85 && angleInDegrees <= 95) {
      // Add 45-degree deflection to prevent easy bouncing
      const speed = Math.sqrt(newVx * newVx + newVy * newVy);
      const deflectionAngle = Math.PI / 4; // 45 degrees

      // Apply deflection based on which wall was hit
      if (nextX - ball.radius <= 0) {
        // Left wall - deflect towards bottom-right
        newVx = Math.cos(deflectionAngle) * speed;
        newVy = ball.vy > 0 ? Math.sin(deflectionAngle) * speed : -Math.sin(deflectionAngle) * speed;
      } else {
        // Right wall - deflect towards bottom-left
        newVx = -Math.cos(deflectionAngle) * speed;
        newVy = ball.vy > 0 ? Math.sin(deflectionAngle) * speed : -Math.sin(deflectionAngle) * speed;
      }
    }
  }

  // Check vertical walls (top only - bottom is handled by game over)
  if (nextY - ball.radius <= 0) {
    newVy = -ball.vy;
    hasCollision = true;

    // ANTI-FARMING FIX: Check if ball is hitting top wall at ~90 degrees (±5 degrees)
    const angle = Math.atan2(Math.abs(ball.vx), Math.abs(ball.vy));
    const angleInDegrees = (angle * 180) / Math.PI;

    // If angle is close to 90 degrees (very horizontal trajectory)
    if (angleInDegrees >= 85 && angleInDegrees <= 95) {
      // Add 45-degree deflection to prevent easy bouncing
      const speed = Math.sqrt(newVx * newVx + newVy * newVy);
      const deflectionAngle = Math.PI / 4; // 45 degrees

      // Top wall - deflect downward at an angle
      newVy = Math.sin(deflectionAngle) * speed;
      newVx = ball.vx > 0 ? Math.cos(deflectionAngle) * speed : -Math.cos(deflectionAngle) * speed;
    }
  }

  return hasCollision ? { vx: newVx, vy: newVy } : null;
}

/**
 * FIXED: Ball-paddle collision with proper "moving away" detection.
 */
export function checkBallPaddleCollision(
    ball: Ball,
    paddle: Paddle,
    gameHeight: number,
    gameStartTime?: number
): CollisionResult | null {
  const paddleTop = gameHeight - 80;

  // FIXED: Only check for collisions if the ball is moving downwards
  if (ball.vy <= 0) {
    return null;
  }

  // FIXED: If ball is already significantly below paddle, it's "moving away"
  const ballTop = ball.y - ball.radius;
  const ballBottom = ball.y + ball.radius;

  // If the ball's TOP is already below the paddle's TOP, it's moving away
  if (ballTop > paddleTop) {
    return null;
  }

  // Method 1: Current position overlap check
  const ballLeft = ball.x - ball.radius;
  const ballRight = ball.x + ball.radius;
  const paddleLeft = paddle.x;
  const paddleRight = paddle.x + paddle.width;

  // If ball is already overlapping paddle vertically and horizontally
  if (ballBottom >= paddleTop &&
      ballRight >= paddleLeft &&
      ballLeft <= paddleRight) {

    // Calculate collision response
    const hitLocationOnPaddle = ball.x - paddle.x;
    const normalizedHitPos = Math.max(0, Math.min(1, hitLocationOnPaddle / paddle.width));
    const angleEffect = (normalizedHitPos - 0.5) * 6;

    // Get minimum speed based on current difficulty
    const difficulty = getDifficultySettings(gameStartTime || Date.now());
    const minSpeed = BASE_BALL_SPEED * difficulty.phase.ballSpeedMultiplier;

    // Calculate new velocity maintaining minimum speed
    const newVy = -Math.max(minSpeed * 0.7, Math.abs(ball.vy) * 0.9);
    const newVx = ball.vx + angleEffect;

    // Normalize to maintain target speed
    const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
    const targetSpeed = Math.max(minSpeed, currentSpeed * 0.9);
    const newSpeed = Math.sqrt(newVx * newVx + newVy * newVy);
    const speedRatio = targetSpeed / newSpeed;

    return {
      vx: newVx * speedRatio,
      vy: newVy * speedRatio,
    };
  }

  // Method 2: Trajectory intersection check (for high-speed balls)
  const ballBottomPrev = ball.y + ball.radius;
  const ballBottomNext = ball.y + ball.vy + ball.radius;

  // Check if ball's trajectory crosses paddle plane this frame
  if (ballBottomPrev <= paddleTop && ballBottomNext >= paddleTop) {
    // Calculate time to collision
    const timeToCollision = Math.max(0, Math.min(1, (paddleTop - ballBottomPrev) / ball.vy));
    const collisionX = ball.x + ball.vx * timeToCollision;

    const ballLeftAtCollision = collisionX - ball.radius;
    const ballRightAtCollision = collisionX + ball.radius;

    if (ballRightAtCollision >= paddleLeft && ballLeftAtCollision <= paddleRight) {
      // Collision detected!
      const hitLocationOnPaddle = collisionX - paddle.x;
      const normalizedHitPos = Math.max(0, Math.min(1, hitLocationOnPaddle / paddle.width));
      const angleEffect = (normalizedHitPos - 0.5) * 6;

      // Get minimum speed based on current difficulty
      const difficulty = getDifficultySettings(gameStartTime || Date.now());
      const minSpeed = BASE_BALL_SPEED * difficulty.phase.ballSpeedMultiplier;

      // Calculate new velocity maintaining minimum speed
      const newVy = -Math.max(minSpeed * 0.7, Math.abs(ball.vy) * 0.9);
      const newVx = ball.vx + angleEffect;

      // Normalize to maintain target speed
      const currentSpeed = Math.sqrt(ball.vx * ball.vx + ball.vy * ball.vy);
      const targetSpeed = Math.max(minSpeed, currentSpeed * 0.9);
      const newSpeed = Math.sqrt(newVx * newVx + newVy * newVy);
      const speedRatio = targetSpeed / newSpeed;

      return {
        vx: newVx * speedRatio,
        vy: newVy * speedRatio,
      };
    }
  }

  // Method 3: Emergency catch for extreme speeds (failsafe)
  if (ball.y >= paddleTop - ball.radius - 5 && // Very close to paddle
      ball.x >= paddleLeft - ball.radius &&
      ball.x <= paddleRight + ball.radius) {

    // Force collision for extreme cases
    const difficulty = getDifficultySettings(gameStartTime || Date.now());
    const minSpeed = BASE_BALL_SPEED * difficulty.phase.ballSpeedMultiplier;

    return {
      vx: ball.vx * 0.9,
      vy: -Math.max(minSpeed * 0.8, Math.abs(ball.vy) * 0.9),
    };
  }

  return null;
}

/**
 * Checks if a ball collides with an enemy.
 */
export function checkBallEnemyCollision(ball: Ball, enemy: Enemy): boolean {
  const enemyWidth = 80;
  const enemyHeight = 30;
  const enemyLeft = enemy.x - enemyWidth / 2;
  const enemyRight = enemy.x + enemyWidth / 2;
  const enemyTop = enemy.y - enemyHeight / 2;
  const enemyBottom = enemy.y + enemyHeight / 2;
  const ballLeft = ball.x - ball.radius;
  const ballRight = ball.x + ball.radius;
  const ballTop = ball.y - ball.radius;
  const ballBottom = ball.y + ball.radius;

  return ballRight > enemyLeft && ballLeft < enemyRight && ballBottom > enemyTop && ballTop < enemyBottom;
}

/**
 * Checks if an enemy collides with the paddle.
 */
export function checkEnemyPaddleCollision(
    enemy: Enemy,
    paddle: Paddle,
    gameHeight: number
): boolean {
  const paddleTop = gameHeight - 80;
  const paddleBottom = paddleTop + paddle.height;
  const enemyWidth = 80;
  const enemyHeight = 30;
  const enemyLeft = enemy.x - enemyWidth / 2;
  const enemyRight = enemy.x + enemyWidth / 2;
  const enemyTop = enemy.y - enemyHeight / 2;
  const enemyBottom = enemy.y + enemyHeight / 2;
  const paddleLeft = paddle.x;
  const paddleRight = paddle.x + paddle.width;

  return enemyRight > paddleLeft && enemyLeft < paddleRight && enemyBottom >= paddleTop && enemyTop <= paddleBottom;
}

/**
 * FIXED: Ball-to-ball collision that ensures velocity changes.
 */
export function checkBallToBallCollision(ball1: Ball, ball2: Ball): BallCollisionResult | null {
  const dx = ball2.x - ball1.x;
  const dy = ball2.y - ball1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = ball1.radius + ball2.radius;

  if (distance > minDistance) {
    return null;
  }

  // Handle case where balls are at exactly the same position
  if (distance === 0) {
    return {
      ball1: { vx: -ball1.vx * 1.5, vy: -ball1.vy * 1.5 },
      ball2: { vx: -ball2.vx * 1.5, vy: -ball2.vy * 1.5 },
    };
  }

  // Calculate collision normal
  const nx = dx / distance;
  const ny = dy / distance;

  // Calculate relative velocity
  const relativeVx = ball1.vx - ball2.vx;
  const relativeVy = ball1.vy - ball2.vy;

  // Calculate relative velocity in collision normal direction
  const approachingSpeed = relativeVx * nx + relativeVy * ny;

  // FIXED: Always process collision if balls are overlapping, regardless of approach speed
  // This ensures we always get velocity changes for overlapping balls

  // ULTRA-DRAMATIC: Create spectacular bounces with energy boost
  const energyBoost = 1.4; // 40% energy increase for maximum drama

  // FIXED: Use a minimum impulse to ensure velocity changes
  const minImpulse = 2.0; // Minimum impulse for guaranteed velocity change
  const impulse = Math.max(minImpulse, 2 * Math.abs(approachingSpeed) / 2);

  // Apply impulse with energy boost and ensure direction change
  const newVx1 = ball1.vx - impulse * nx * energyBoost;
  const newVy1 = ball1.vy - impulse * ny * energyBoost;
  const newVx2 = ball2.vx + impulse * nx * energyBoost;
  const newVy2 = ball2.vy + impulse * ny * energyBoost;

  return {
    ball1: { vx: newVx1, vy: newVy1 },
    ball2: { vx: newVx2, vy: newVy2 },
  };
}

/**
 * Separates two overlapping balls to prevent them from getting stuck.
 */
export function separateOverlappingBalls(ball1: Ball, ball2: Ball): BallSeparationResult {
  const dx = ball2.x - ball1.x;
  const dy = ball2.y - ball1.y;
  const distance = Math.sqrt(dx * dx + dy * dy);
  const minDistance = ball1.radius + ball2.radius;

  if (distance < minDistance) {
    const overlap = (minDistance - distance) / 2;
    const nx = distance === 0 ? 1 : dx / distance;
    const ny = distance === 0 ? 0 : dy / distance;

    return {
      ball1: { x: ball1.x - overlap * nx, y: ball1.y - overlap * ny },
      ball2: { x: ball2.x + overlap * nx, y: ball2.y + overlap * ny },
    };
  }

  return {
    ball1: { x: ball1.x, y: ball1.y },
    ball2: { x: ball2.x, y: ball2.y },
  };
}