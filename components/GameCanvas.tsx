
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  CANVAS_WIDTH, 
  CANVAS_HEIGHT, 
  PADDLE_WIDTH, 
  PADDLE_HEIGHT, 
  BALL_RADIUS, 
  COLORS, 
  BRICK_COLS, 
  BRICK_ROWS,
  BRICK_PADDING,
  BRICK_HEIGHT,
  BALL_SPEED_BASE
} from '../constants';
import { Ball, Paddle, Brick, BrickType, GameState, LevelData, Vector2D } from '../types';

interface GameCanvasProps {
  gameState: GameState;
  levelData: LevelData | null;
  currentLevel: number;
  setGameState: (state: GameState) => void;
  onScoreUpdate: (score: number) => void;
  onLivesUpdate: (lives: number) => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ 
  gameState, 
  levelData, 
  currentLevel,
  setGameState, 
  onScoreUpdate, 
  onLivesUpdate 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number>(0);
  
  // Game State Refs (for performance in loop)
  const ballRef = useRef<Ball>({
    pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50 },
    vel: { x: 0, y: 0 },
    radius: BALL_RADIUS,
    active: false
  });
  const paddleRef = useRef<Paddle>({
    pos: { x: CANVAS_WIDTH / 2 - PADDLE_WIDTH / 2, y: CANVAS_HEIGHT - PADDLE_HEIGHT - 10 },
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT
  });
  const bricksRef = useRef<Brick[]>([]);
  const scoreRef = useRef(0);
  const livesRef = useRef(3);

  // Input State
  const mouseX = useRef<number>(CANVAS_WIDTH / 2);

  // Initialize Level
  const initLevel = useCallback(() => {
    if (!levelData) return;

    const brickWidth = (CANVAS_WIDTH - (BRICK_PADDING * (BRICK_COLS + 1))) / BRICK_COLS;
    const newBricks: Brick[] = [];

    levelData.layout.forEach((val, index) => {
      if (val === 0) return;

      const col = index % BRICK_COLS;
      const row = Math.floor(index / BRICK_COLS);

      const x = BRICK_PADDING + col * (brickWidth + BRICK_PADDING);
      const y = BRICK_PADDING + row * (BRICK_HEIGHT + BRICK_PADDING) + 50; // +50 top margin

      let type = BrickType.USDT;
      let color = COLORS[BrickType.USDT];
      let value = 10;

      if (val === 1) { type = BrickType.BTC; color = COLORS[BrickType.BTC]; value = 100; }
      else if (val === 2) { type = BrickType.ETH; color = COLORS[BrickType.ETH]; value = 50; }
      else if (val === 3) { type = BrickType.SOL; color = COLORS[BrickType.SOL]; value = 25; }

      // Determine velocity based on Level rules
      let velX = 0;
      
      // Level 2: BTC and ETH move
      if (currentLevel >= 2) {
        if (type === BrickType.BTC || type === BrickType.ETH) {
            velX = (Math.random() > 0.5 ? 0.5 : -0.5);
        }
      }

      // Level 3: SOL also moves, maybe faster
      if (currentLevel >= 3) {
        if (type === BrickType.SOL) {
            velX = (Math.random() > 0.5 ? 0.8 : -0.8);
        }
      }

      newBricks.push({
        x, y, width: brickWidth, height: BRICK_HEIGHT, active: true, type, value, color,
        vel: { x: velX, y: 0 }
      });
    });

    bricksRef.current = newBricks;
    
    // Reset Ball
    ballRef.current = {
      pos: { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT - 50 },
      vel: { x: 0, y: 0 },
      radius: BALL_RADIUS,
      active: false
    };
    
  }, [levelData, currentLevel]);

  // Launch Ball
  const launchBall = () => {
    if (!ballRef.current.active && gameState === GameState.PLAYING) {
      const speed = BALL_SPEED_BASE * (levelData?.sentiment === 'BULLISH' ? 1.5 : 1.0);
      ballRef.current.active = true;
      ballRef.current.vel = { x: speed, y: -speed };
    }
  };

  // Helper: Circle-Rect Collision
  const detectCollision = (circle: Ball, rect: {x: number, y: number, width: number, height: number}) => {
    const distX = Math.abs(circle.pos.x - rect.x - rect.width / 2);
    const distY = Math.abs(circle.pos.y - rect.y - rect.height / 2);

    if (distX > (rect.width / 2 + circle.radius)) { return false; }
    if (distY > (rect.height / 2 + circle.radius)) { return false; }

    if (distX <= (rect.width / 2)) { return true; }
    if (distY <= (rect.height / 2)) { return true; }

    const dx = distX - rect.width / 2;
    const dy = distY - rect.height / 2;
    return (dx * dx + dy * dy <= (circle.radius * circle.radius));
  };

  // Game Loop
  const update = useCallback(() => {
    if (gameState !== GameState.PLAYING) return;

    const ball = ballRef.current;
    const paddle = paddleRef.current;
    const bricks = bricksRef.current;

    // 1. Move Paddle
    paddle.pos.x = mouseX.current - paddle.width / 2;
    if (paddle.pos.x < 0) paddle.pos.x = 0;
    if (paddle.pos.x + paddle.width > CANVAS_WIDTH) paddle.pos.x = CANVAS_WIDTH - paddle.width;

    // 2. Move Bricks (Level Logic)
    bricks.forEach(b => {
        if (b.active && b.vel.x !== 0) {
            b.x += b.vel.x;
            
            // Bounce bricks off walls
            if (b.x <= 0) {
                b.x = 0;
                b.vel.x *= -1;
            } else if (b.x + b.width >= CANVAS_WIDTH) {
                b.x = CANVAS_WIDTH - b.width;
                b.vel.x *= -1;
            }
        }
    });

    // 3. Move Ball
    if (ball.active) {
      ball.pos.x += ball.vel.x;
      ball.pos.y += ball.vel.y;

      // Wall Collisions
      if (ball.pos.x + ball.radius > CANVAS_WIDTH || ball.pos.x - ball.radius < 0) {
        ball.vel.x = -ball.vel.x;
      }
      if (ball.pos.y - ball.radius < 0) {
        ball.vel.y = -ball.vel.y;
      }

      // Floor Collision (Lose Life)
      if (ball.pos.y + ball.radius > CANVAS_HEIGHT) {
        livesRef.current -= 1;
        onLivesUpdate(livesRef.current);
        ball.active = false;
        ball.pos = { x: paddle.pos.x + paddle.width / 2, y: CANVAS_HEIGHT - 40 };
        ball.vel = { x: 0, y: 0 };

        if (livesRef.current <= 0) {
          setGameState(GameState.GAME_OVER);
        }
      }

      // Paddle Collision
      if (detectCollision(ball, {x: paddle.pos.x, y: paddle.pos.y, width: paddle.width, height: paddle.height})) {
        if (ball.vel.y > 0) {
            ball.vel.y = -ball.vel.y;
            const hitPoint = ball.pos.x - (paddle.pos.x + paddle.width / 2);
            ball.vel.x = hitPoint * 0.15; 
        }
      }

      // Brick Collision
      let allCleared = true;
      for (let i = 0; i < bricks.length; i++) {
        const b = bricks[i];
        if (b.active) {
          allCleared = false;
          if (detectCollision(ball, {x: b.x, y: b.y, width: b.width, height: b.height})) {
            b.active = false;
            ball.vel.y = -ball.vel.y; // Basic reflection
            scoreRef.current += b.value;
            onScoreUpdate(scoreRef.current);
            break; 
          }
        }
      }

      if (allCleared && bricks.length > 0) {
        setGameState(GameState.VICTORY);
      }
    } else {
      ball.pos.x = paddle.pos.x + paddle.width / 2;
      ball.pos.y = paddle.pos.y - ball.radius - 2;
    }

    draw();
    requestRef.current = requestAnimationFrame(update);
  }, [gameState, onScoreUpdate, onLivesUpdate, setGameState, levelData]); 

  const draw = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Paddle
    ctx.fillStyle = COLORS.PADDLE;
    ctx.shadowBlur = 10;
    ctx.shadowColor = COLORS.PADDLE;
    ctx.fillRect(paddleRef.current.pos.x, paddleRef.current.pos.y, paddleRef.current.width, paddleRef.current.height);
    ctx.shadowBlur = 0;

    // Draw Ball
    ctx.beginPath();
    ctx.arc(ballRef.current.pos.x, ballRef.current.pos.y, ballRef.current.radius, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.BALL;
    ctx.fill();
    ctx.closePath();

    // Draw Bricks
    bricksRef.current.forEach(b => {
      if (b.active) {
        ctx.fillStyle = b.color;
        ctx.fillRect(b.x, b.y, b.width, b.height);
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.strokeRect(b.x, b.y, b.width, b.height);
        
        // Ticker Text
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(b.type, b.x + b.width/2, b.y + b.height/2 + 4);
      }
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const scaleX = CANVAS_WIDTH / rect.width;
      mouseX.current = (e.clientX - rect.left) * scaleX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect && e.touches.length > 0) {
      const scaleX = CANVAS_WIDTH / rect.width;
      mouseX.current = (e.touches[0].clientX - rect.left) * scaleX;
    }
  };

  useEffect(() => {
    if (gameState === GameState.PLAYING) {
      requestRef.current = requestAnimationFrame(update);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameState, update]);

  useEffect(() => {
    if (levelData) {
      initLevel();
      draw(); 
    }
  }, [levelData]);

  useEffect(() => {
    if (gameState === GameState.PLAYING && livesRef.current <= 0) {
       livesRef.current = 3;
       // Keep score from previous state if this is a restart from Game Over? 
       // Usually Game Over resets score.
       // Let's assume the parent component resets score on full restart.
       // But inside the loop, we need to sync.
       onLivesUpdate(3);
       initLevel();
    }
  }, [gameState, initLevel, onLivesUpdate]);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      className="w-full max-w-4xl aspect-[4/3] bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-2xl cursor-none touch-none"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      onClick={launchBall}
    />
  );
};

export default GameCanvas;
