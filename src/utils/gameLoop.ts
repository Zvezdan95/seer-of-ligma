// FILE: src/utils/gameLoop.ts
// FIXED: Pass gameStartTime to paddle collision for speed maintenance

import { GameState, Ball } from '../types/game';
import { 
  checkBallWallCollision,
  checkBallPaddleCollision,
  checkBallEnemyCollision,
  checkEnemyPaddleCollision,
  checkBallToBallCollision,
  separateOverlappingBalls
} from './collisions';
import { getDifficultySettings, getEnemySpeed } from './difficulty';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PHYSICS_ITERATIONS = 8;

/**
 * FIXED: Game tick with proper speed maintenance and dramatic ball collisions.
 */
export function runGameTick(
  gameState: GameState,
  playBounce: () => void,
  playExplosion: () => void,
  setExplodingPunchlines: (fn: (prev: any[]) => any[]) => void,
  ENEMY_PUNCHLINES: Record<string, string>
): GameState {
  let newState = { ...gameState };
  const difficulty = getDifficultySettings(newState.gameStartTime || Date.now());
  const speedMultiplier = difficulty.phase.ballSpeedMultiplier;

  const bouncedThisFrame = new Set<string>();

  // Iterative collision resolution loop for stability
  for (let i = 0; i < PHYSICS_ITERATIONS; i++) {
    // 1. Update positions by a fraction of the frame's movement
    newState.balls = newState.balls.map(ball => ({
      ...ball,
      x: ball.x + (ball.vx * speedMultiplier) / PHYSICS_ITERATIONS,
      y: ball.y + (ball.vy * speedMultiplier) / PHYSICS_ITERATIONS,
    }));

    // 2. Resolve Ball-to-Ball Collisions
    for (let j = 0; j < newState.balls.length; j++) {
      for (let k = j + 1; k < newState.balls.length; k++) {
        const ball1 = newState.balls[j];
        const ball2 = newState.balls[k];
        
        const separation = separateOverlappingBalls(ball1, ball2);
        newState.balls[j] = { ...ball1, ...separation.ball1 };
        newState.balls[k] = { ...ball2, ...separation.ball2 };

        const collision = checkBallToBallCollision(newState.balls[j], newState.balls[k]);
        if (collision) {
          newState.balls[j] = { ...newState.balls[j], ...collision.ball1 };
          newState.balls[k] = { ...newState.balls[k], ...collision.ball2 };
          if (!bouncedThisFrame.has(ball1.id) || !bouncedThisFrame.has(ball2.id)) {
            playBounce();
            bouncedThisFrame.add(ball1.id);
            bouncedThisFrame.add(ball2.id);
          }
        }
      }
    }

    // 3. Resolve Boundary (Wall and Paddle) Collisions
    newState.balls = newState.balls.map((ball, index) => {
      let currentBall = { ...ball };
      const originalBallForPaddleCheck = gameState.balls[index];

      const wallCollision = checkBallWallCollision(currentBall, GAME_WIDTH, GAME_HEIGHT);
      if (wallCollision) {
        currentBall = { ...currentBall, ...wallCollision };
        if (!bouncedThisFrame.has(currentBall.id)) {
            playBounce();
            bouncedThisFrame.add(currentBall.id);
        }
      }
      
      // FIXED: Pass gameStartTime to maintain minimum speed
      const paddleCollision = checkBallPaddleCollision(
        originalBallForPaddleCheck, 
        newState.paddle, 
        GAME_HEIGHT,
        newState.gameStartTime
      );
      if (paddleCollision) {
        currentBall = { ...currentBall, ...paddleCollision };
        if (!bouncedThisFrame.has(currentBall.id)) {
            playBounce();
            bouncedThisFrame.add(currentBall.id);
        }
      }
      
      return currentBall;
    });
  }

  // Clamp positions to prevent sinking into walls after all physics are resolved
  newState.balls = newState.balls.map(ball => ({
    ...ball,
    x: Math.max(ball.radius, Math.min(GAME_WIDTH - ball.radius, ball.x)),
    y: Math.max(ball.radius, ball.y)
  }));

  // Handle Ball Removal
  newState.balls = newState.balls.filter(ball => {
    if (ball.y > GAME_HEIGHT + 50) {
      newState.lives -= 1;
      return false;
    }
    return true;
  });

  // Update Enemies and check for collisions
  const remainingEnemies: Ball[] = [];
  newState.enemies.forEach(enemy => {
    let enemyRemoved = false;
    
    if (checkEnemyPaddleCollision(enemy, newState.paddle, GAME_HEIGHT)) {
      newState.paddle.shrinkTime = Date.now() + 4000;
      enemyRemoved = true;
    }

    newState.balls.forEach(ball => {
      if (!enemyRemoved && checkBallEnemyCollision(ball, enemy)) {
        const punchline = ENEMY_PUNCHLINES[enemy.text];
        setExplodingPunchlines(prev => [...prev, { id: `punchline-${Date.now()}-${Math.random()}`, text: punchline, x: enemy.x, y: enemy.y }]);
        newState.score += 100;
        playExplosion();
        enemyRemoved = true;
      }
    });

    if (!enemyRemoved && enemy.y < GAME_HEIGHT + 50) {
      remainingEnemies.push({
        ...enemy,
        y: enemy.y + getEnemySpeed(enemy.speed, difficulty.phase.enemySpeedMultiplier),
      });
    }
  });
  newState.enemies = remainingEnemies;

  // Update Paddle State
  if (Date.now() > (newState.paddle.shrinkTime || 0)) {
    newState.paddle.width = 120;
  } else {
    newState.paddle.width = 60;
  }
  
  return newState;
}