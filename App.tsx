
import React, { useState, useEffect, useRef } from 'react';
import { GameState, LevelData } from './types';
import GameCanvas from './components/GameCanvas';
import { generateLevel } from './services/geminiService';
import { audioService } from './services/audioService';
import { Rocket, Coins, Activity, RefreshCw, Zap, Skull, Trophy, Clock, TrendingUp, Timer, Save } from 'lucide-react';

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.MENU);
  const [levelData, setLevelData] = useState<LevelData | null>(null);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  
  // Persistent High Score (Local Storage)
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('cryptoBreakoutHighScore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // "time" is total game time for leaderboard
  const [time, setTime] = useState(0);
  // "levelTime" is specific to the current level for boost calculation
  const [levelTime, setLevelTime] = useState(0);
  
  const [lastLevelScore, setLastLevelScore] = useState(0);
  const [timeBoost, setTimeBoost] = useState(0);
  
  const [error, setError] = useState<string | null>(null);

  // Update High Score
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('cryptoBreakoutHighScore', score.toString());
    }
  }, [score, highScore]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState === GameState.PLAYING) {
      interval = setInterval(() => {
        setTime((t) => t + 1);
        setLevelTime((t) => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState]);

  // Manage Audio
  useEffect(() => {
    if (gameState === GameState.PLAYING) {
        audioService.startLevelMusic(currentLevel);
    } else {
        audioService.stopMusic();
    }
    
    if (gameState === GameState.VICTORY) {
        audioService.playWinSound();
    }
  }, [gameState, currentLevel]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getLeaderboard = (currentScore: number, currentTime: number) => {
    // Note: This is a simulated leaderboard. In a real Web3 app, this would fetch from a Smart Contract or Database.
    const leaderboard = [
      { name: "Whale_0x1", score: 50000, time: 120 },
      { name: "Satoshi", score: 25000, time: 145 },
      { name: "Vitalik", score: 18000, time: 160 },
      { name: "YOU", score: currentScore, time: currentTime },
      { name: "PaperHands", score: 5000, time: 300 },
    ];
    return leaderboard.sort((a, b) => b.score - a.score);
  };

  const startLevel = async (level: number) => {
    setGameState(GameState.GENERATING);
    setError(null);
    try {
      const data = await generateLevel(level);
      setLevelData({
        name: data.levelName,
        description: data.marketAnalysis,
        sentiment: data.marketSentiment as any,
        layout: data.grid,
        columns: 10,
        rows: 8,
        targetTimeSeconds: data.targetTimeSeconds || 120
      });
      
      if (level === 1) {
          setScore(0);
          setLives(3);
          setTime(0);
      }
      
      setLevelTime(0);
      setCurrentLevel(level);
      setGameState(GameState.PLAYING);
    } catch (err) {
      setError("Oracle Disconnected. Please check API Key.");
      setGameState(GameState.MENU);
    }
  };

  const handleLevelComplete = (bricksScore: number) => {
      // Calculate Time Boost
      // Formula: (Target - Actual) * 100 points per second saved
      if (levelData) {
          const par = levelData.targetTimeSeconds;
          const diff = Math.max(0, par - levelTime);
          const boost = diff * 50; // 50 points per second saved
          
          setTimeBoost(boost);
          setLastLevelScore(bricksScore + boost);
          setScore(prev => prev + boost); // Add boost to total score
      }
      setGameState(GameState.VICTORY);
  };

  const handleInitialStart = () => startLevel(1);

  const handleNextLevel = () => {
      startLevel(currentLevel + 1);
  };

  const handleRestartGame = () => {
    startLevel(1);
  };
  
  return (
    <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      
      {/* Brick Wall Background - Using a specific ID for Red Bricks */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <img 
           src="https://images.unsplash.com/photo-1456082902841-33350057219b?q=80&w=2000&auto=format&fit=crop"
           alt="Red Brick Wall"
           className="w-full h-full object-cover"
         />
         {/* Dark overlay to ensure text readability */}
         <div className="absolute inset-0 bg-black/80 mix-blend-multiply"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 w-full max-w-4xl flex flex-col md:flex-row justify-between items-center mb-6 p-4 bg-zinc-900/90 backdrop-blur-md rounded-lg border border-zinc-800 gap-4 md:gap-0 shadow-xl shadow-black/50">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-500/50">
                <Rocket className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                    CRYPTO BREAKOUT
                </h1>
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                    <span className="font-bold text-white">LEVEL {currentLevel}</span>
                </div>
            </div>
        </div>

        {levelData && gameState === GameState.PLAYING && (
            <div className="hidden md:flex items-center gap-8">
                <div className="text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Target Time</p>
                    <p className="font-bold text-cyan-400">{formatTime(levelData.targetTimeSeconds)}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-zinc-500 uppercase tracking-widest">Sentiment</p>
                    <p className={`font-bold ${levelData.sentiment === 'BULLISH' ? 'text-green-400' : levelData.sentiment === 'BEARISH' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {levelData.sentiment}
                    </p>
                </div>
            </div>
        )}

        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
            {/* High Score Display */}
            <div className="hidden md:flex flex-col items-end border-r border-zinc-700 pr-6">
                 <div className="flex items-center gap-1 text-yellow-500">
                    <Trophy className="w-3 h-3" />
                    <p className="text-xs uppercase">High Score</p>
                 </div>
                 <p className="text-lg font-mono font-bold text-yellow-500">{highScore.toLocaleString()}</p>
            </div>

            <div className="flex items-center gap-3 border-r border-zinc-700 pr-6">
                <Clock className={`w-5 h-5 ${levelData && levelTime > levelData.targetTimeSeconds ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`} />
                <div className="flex flex-col items-end">
                    <p className="text-xs text-zinc-500 uppercase">Time</p>
                    <p className={`text-xl font-mono font-bold ${levelData && levelTime > levelData.targetTimeSeconds ? 'text-red-400' : 'text-white'}`}>
                        {formatTime(levelTime)}
                    </p>
                </div>
            </div>
            <div className="flex flex-col items-end">
                <p className="text-xs text-zinc-500 uppercase">Score</p>
                <p className="text-xl font-mono font-bold text-white">{score.toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-1 pl-4 border-l border-zinc-700">
                {Array.from({length: 3}).map((_, i) => (
                    <Zap 
                        key={i} 
                        className={`w-5 h-5 ${i < lives ? 'text-yellow-400 fill-yellow-400/20' : 'text-zinc-800 fill-zinc-900'}`} 
                    />
                ))}
            </div>
        </div>
      </div>

      {/* Game Container */}
      <div className="relative z-10 w-full max-w-4xl">
        {/* We intercept setGameState to handle victory logic in App */}
        <GameCanvas 
          gameState={gameState}
          levelData={levelData}
          currentLevel={currentLevel}
          setGameState={(newState) => {
              if (newState === GameState.VICTORY) {
                  handleLevelComplete(score); // Pass current score as baseline
              } else {
                  setGameState(newState);
              }
          }}
          onScoreUpdate={setScore}
          onLivesUpdate={setLives}
        />

        {/* Overlays */}
        {gameState === GameState.MENU && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm z-10 rounded-xl">
                <div className="text-center max-w-md p-8 border border-zinc-800 bg-zinc-900 rounded-2xl shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    <Coins className="w-16 h-16 text-yellow-400 mx-auto mb-6" />
                    <h2 className="text-3xl font-bold text-white mb-2">Market Entry</h2>
                    <p className="text-zinc-400 mb-4">
                        Consult the AI Oracle to generate market levels. <br/>
                        <span className="text-cyan-400 text-sm mt-2 block">
                            Beat the target time for $BOOST.
                        </span>
                    </p>
                    
                    <div className="bg-zinc-800/50 p-3 rounded-lg mb-8 border border-zinc-700 flex justify-between items-center">
                        <span className="text-xs text-zinc-400 uppercase">Your Local High Score</span>
                        <span className="text-yellow-400 font-mono font-bold">{highScore.toLocaleString()}</span>
                    </div>

                    {error && <p className="text-red-400 mb-4 text-sm">{error}</p>}
                    <button 
                        onClick={handleInitialStart}
                        className="group relative px-8 py-4 bg-white text-black font-bold text-lg rounded-full hover:bg-cyan-400 transition-all w-full"
                    >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                            START GAME <Activity className="w-4 h-4" />
                        </span>
                        <div className="absolute inset-0 rounded-full bg-cyan-500 blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                    </button>
                    <p className="text-[10px] text-zinc-600 mt-4">
                        * Note: Leaderboards are currently local-only (No DB connected)
                    </p>
                </div>
            </div>
        )}

        {gameState === GameState.GENERATING && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-10 rounded-xl">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-6"></div>
                    <h3 className="text-xl font-bold text-white animate-pulse">CONSULTING ORACLE...</h3>
                    <p className="text-zinc-500 mt-2 font-mono text-sm">generating volatility parameters</p>
                </div>
            </div>
        )}

        {gameState === GameState.GAME_OVER && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-900/20 backdrop-blur-md z-10 rounded-xl p-4">
                <div className="text-center p-6 border border-red-500/20 bg-black/90 rounded-2xl w-full max-w-lg shadow-2xl">
                    <Skull className="w-12 h-12 text-red-500 mx-auto mb-2" />
                    <h2 className="text-3xl font-bold text-white mb-4">LIQUIDATED</h2>
                    
                    <div className="w-full bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 mb-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center pb-2 border-b border-zinc-800 mb-2">
                                <span className="text-xs text-zinc-500 uppercase">Global Leaderboard (Simulated)</span>
                            </div>
                            {getLeaderboard(score, time).map((entry, idx) => (
                                <div key={idx} className={`flex justify-between items-center text-sm ${entry.name === 'YOU' ? 'bg-red-500/10 -mx-2 px-2 py-1 rounded text-red-200 font-bold border border-red-500/20' : 'text-zinc-400'}`}>
                                    <span className="flex items-center gap-3">
                                        <span className="w-4 text-zinc-600 font-mono">#{idx + 1}</span>
                                        {entry.name}
                                    </span>
                                    <span className="font-mono">{entry.score.toLocaleString()}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                    <div className="flex gap-4 justify-center">
                        <button onClick={handleRestartGame} className="px-6 py-3 bg-white text-black hover:bg-cyan-400 rounded-lg transition-colors font-bold">
                            New Game (Reset Portfolio)
                        </button>
                    </div>
                </div>
            </div>
        )}

        {gameState === GameState.VICTORY && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-green-900/20 backdrop-blur-md z-10 rounded-xl p-4">
                <div className="text-center p-6 border border-green-500/20 bg-black/90 rounded-2xl w-full max-w-lg shadow-2xl">
                    <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-2 animate-bounce" />
                    <h2 className="text-3xl font-bold text-white mb-2">LEVEL {currentLevel} CLEARED!</h2>
                    <p className="text-green-400 mb-6 text-sm uppercase tracking-widest">Portfolio Up Only</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-zinc-900/50 p-4 rounded-lg border border-zinc-800">
                             <p className="text-xs text-zinc-500 uppercase">Time Taken</p>
                             <p className="text-xl font-mono font-bold text-white">{formatTime(levelTime)}</p>
                             <p className="text-xs text-zinc-600 mt-1">Target: {levelData ? formatTime(levelData.targetTimeSeconds) : '--:--'}</p>
                        </div>
                        <div className="bg-green-900/20 p-4 rounded-lg border border-green-500/30">
                             <div className="flex items-center gap-2 justify-center text-green-400 mb-1">
                                <Timer className="w-4 h-4" />
                                <p className="text-xs uppercase font-bold">Speed Boost</p>
                             </div>
                             <p className="text-xl font-mono font-bold text-white">+{timeBoost.toLocaleString()}</p>
                        </div>
                    </div>

                    <div className="w-full bg-zinc-900/50 rounded-lg border border-zinc-800 p-4 mb-6">
                         <div className="flex justify-between items-center mb-2">
                            <span className="text-zinc-400 text-sm">Total Score</span>
                            <span className="text-2xl font-bold text-white font-mono">{score.toLocaleString()}</span>
                         </div>
                    </div>
                    
                    <button onClick={handleNextLevel} className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white rounded-lg transition-all font-bold shadow-lg shadow-indigo-500/25 w-full flex items-center justify-center gap-2">
                       NEXT LEVEL <TrendingUp className="w-4 h-4" />
                    </button>
                </div>
            </div>
        )}
      </div>
      
      {/* Footer Info */}
      {levelData && gameState === GameState.PLAYING && (
        <div className="relative z-10 w-full max-w-4xl mt-4 p-4 bg-zinc-900/90 backdrop-blur-sm rounded-lg border border-zinc-800/50 shadow-lg">
            <div className="flex items-start gap-2 text-sm text-zinc-400">
                <span className="text-indigo-400 font-bold shrink-0">ORACLE ANALYSIS (L{currentLevel}):</span>
                <p>"{levelData.description}"</p>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;
