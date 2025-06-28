import { DifficultyPhase, DifficultySettings } from '../types/game';

// Base speeds for scaling
export const BASE_BALL_SPEED = 3.5;
export const BASE_ENEMY_SPEED = 1.5;

// Difficulty phases configuration
export const DIFFICULTY_PHASES: DifficultyPhase[] = [
  {
    name: "The Welcome Zone",
    ballSpeedMultiplier: 1.0,
    enemySpeedMultiplier: 1.0,
    spawnInterval: 3000, // 3 seconds
    doubleSpawnChance: 0
  },
  {
    name: "Things Are Heating Up", 
    ballSpeedMultiplier: 1.5,
    enemySpeedMultiplier: 1.25,
    spawnInterval: 2000, // 2 seconds
    doubleSpawnChance: 0
  },
  {
    name: "The Panic Zone",
    ballSpeedMultiplier: 2,
    enemySpeedMultiplier: 1.5,
    spawnInterval: 1500, // 1.5 seconds
    doubleSpawnChance: 0.15 // 15% chance of double spawn
  },
  {
    name: "The Proving Grounds",
    ballSpeedMultiplier: 3,
    enemySpeedMultiplier: 2.0,
    spawnInterval: 800, // Very frequent spawning
    doubleSpawnChance: 0.4 // 40% chance of double spawn
  }
];

/**
 * Calculate current difficulty settings based on elapsed game time
 */
export function getDifficultySettings(gameStartTime: number): DifficultySettings {
  const elapsedTime = Date.now() - gameStartTime;
  const elapsedSeconds = elapsedTime / 1000;

  let phase: DifficultyPhase;
  
  if (elapsedSeconds < 45) {
    // Phase 1: 0-45 seconds
    phase = DIFFICULTY_PHASES[0];
  } else if (elapsedSeconds < 120) {
    // Phase 2: 45 seconds - 2 minutes
    phase = DIFFICULTY_PHASES[1];
  } else if (elapsedSeconds < 300) {
    // Phase 3: 2-5 minutes
    phase = DIFFICULTY_PHASES[2];
  } else {
    // Phase 4: 5+ minutes with progressive scaling
    const basePhase = DIFFICULTY_PHASES[3];
    const minutesOver5 = (elapsedSeconds - 300) / 60;
    const additionalSpeedBoost = Math.min(minutesOver5 * 0.1, 0.5); // Cap at +0.5x
    
    phase = {
      ...basePhase,
      ballSpeedMultiplier: basePhase.ballSpeedMultiplier + additionalSpeedBoost,
      spawnInterval: Math.max(500, basePhase.spawnInterval - (minutesOver5 * 50)) // Minimum 0.5s
    };
  }

  return {
    phase,
    elapsedTime
  };
}

/**
 * Apply difficulty scaling to ball velocity - ONLY used for wall bounces and initial velocity
 * This should NOT be called during paddle collisions
 */
export function scaleBallVelocity(vx: number, vy: number, multiplier: number): { vx: number, vy: number } {
  return {
    vx: vx * multiplier,
    vy: vy * multiplier
  };
}

/**
 * Calculate enemy speed based on difficulty
 */
export function getEnemySpeed(baseSpeed: number, multiplier: number): number {
  return baseSpeed * multiplier;
}

/**
 * Determine if a double spawn should occur
 */
export function shouldDoubleSpawn(chance: number): boolean {
  return Math.random() < chance;
}