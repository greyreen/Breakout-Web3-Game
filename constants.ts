import { BrickType } from "./types";

export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 600;

export const PADDLE_WIDTH = 100;
export const PADDLE_HEIGHT = 16;
export const BALL_RADIUS = 6;
export const BALL_SPEED_BASE = 5;

export const BRICK_ROWS = 8;
export const BRICK_COLS = 10;
export const BRICK_PADDING = 8;
export const BRICK_HEIGHT = 24;
// Width calculated dynamically based on canvas width

export const COLORS = {
  BACKGROUND: '#09090b',
  PADDLE: '#38bdf8', // Sky blue
  BALL: '#ffffff',
  TEXT: '#e4e4e7',
  [BrickType.BTC]: '#f59e0b', // Amber
  [BrickType.ETH]: '#6366f1', // Indigo
  [BrickType.SOL]: '#d946ef', // Fuchsia
  [BrickType.USDT]: '#10b981', // Emerald
};

export const INITIAL_LIVES = 3;