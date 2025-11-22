
export enum GameState {
  MENU = 'MENU',
  GENERATING = 'GENERATING',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface Vector2D {
  x: number;
  y: number;
}

export interface Ball {
  pos: Vector2D;
  vel: Vector2D;
  radius: number;
  active: boolean;
}

export interface Paddle {
  pos: Vector2D;
  width: number;
  height: number;
}

export enum BrickType {
  BTC = 'BTC', // High value, hard to break
  ETH = 'ETH', // Medium
  SOL = 'SOL', // Fast/Easy
  USDT = 'USDT' // Standard
}

export interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  type: BrickType;
  value: number;
  color: string;
  vel: Vector2D; // Added velocity for moving bricks
}

export interface LevelData {
  name: string;
  description: string;
  sentiment: 'BULLISH' | 'BEARISH' | 'VOLATILE';
  layout: number[]; // Flattened grid array (0 = empty, 1-4 = types)
  columns: number;
  rows: number;
  targetTimeSeconds: number; // New: Par time for the level
}

export interface MarketOracleResponse {
  levelName: string;
  marketAnalysis: string;
  marketSentiment: string;
  grid: number[]; // 0 for empty, 1 for BTC, 2 for ETH, 3 for SOL, 4 for USDT
  targetTimeSeconds: number;
}
