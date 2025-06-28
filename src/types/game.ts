export interface GameState {
  screen: 'intro' | 'game' | 'gameover';
  score: number;
  lives: number;
  balls: Ball[];
  enemies: Enemy[];
  paddle: Paddle;
  isHolding: boolean;
  holdProgress: number;
  gameStartTime: number;
  currentPhase: DifficultyPhase;
}

export interface Ball {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

export interface Enemy {
  id: string;
  text: string;
  x: number;
  y: number;
  speed: number;
}

export interface Paddle {
  x: number;
  width: number;
  height: number;
  shrinkTime: number;
}

export interface HighScore {
  id?: string;
  username: string;
  score: number;
  created_at?: string;
}

export interface DifficultyPhase {
  name: string;
  ballSpeedMultiplier: number;
  enemySpeedMultiplier: number;
  spawnInterval: number;
  doubleSpawnChance: number;
}

export interface DifficultySettings {
  phase: DifficultyPhase;
  elapsedTime: number;
}