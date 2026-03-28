import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Coins, Volume2, VolumeX } from 'lucide-react';

interface PlinkoProps {
  balance: number;
  maxBet: number;
  onPlay: (bet: number, win: number) => Promise<void>;
  playSound: (type: 'spin' | 'win' | 'loss' | 'ball_roll' | 'ball_drop') => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  isAdmin?: boolean;
}

const PLINKO_MULTIPLIERS = [10, 5, 2, 1.5, 1.2, 1.1, 1, 0.5, 1, 1.1, 1.2, 1.5, 2, 5, 10];
const ROWS = 14;
const MIN_BET = 0.1;

export const Plinko: React.FC<PlinkoProps> = ({ 
  balance, 
  maxBet, 
  onPlay, 
  playSound, 
  muted, 
  setMuted,
  isAdmin 
}) => {
  const [betAmount, setBetAmount] = useState(0.1);
  const [balls, setBalls] = useState<{ id: number; x: number; y: number; path: number[] }[]>([]);
  const [isDropping, setIsDropping] = useState(false);
  const [gameHistory, setGameHistory] = useState<{ win: number; multiplier: number }[]>([]);
  const ballIdCounter = useRef(0);

  const handleDrop = async () => {
    if (betAmount < MIN_BET || betAmount > maxBet || betAmount > balance || isDropping) return;

    setIsDropping(true);
    const id = ballIdCounter.current++;
    const path: number[] = [];
    let currentX = 0;

    for (let i = 0; i < ROWS; i++) {
      const direction = Math.random() > 0.5 ? 1 : -1;
      currentX += direction;
      path.push(currentX);
    }

    const newBall = { id, x: 0, y: 0, path };
    setBalls(prev => [...prev, newBall]);
    playSound('spin');

    // Simulate ball drop animation steps
    for (let i = 0; i < ROWS; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setBalls(prev => prev.map(b => b.id === id ? { ...b, y: i + 1, x: path[i] } : b));
      playSound('ball_roll');
    }

    const finalX = path[ROWS - 1];
    const multiplierIndex = Math.floor((finalX + ROWS) / 2);
    const multiplier = PLINKO_MULTIPLIERS[multiplierIndex] || 0.5;
    const win = Number((betAmount * multiplier).toFixed(2));

    if (win >= betAmount) playSound('win');
    else playSound('loss');

    try {
      await onPlay(betAmount, win);
      setGameHistory(prev => [{ win, multiplier }, ...prev].slice(0, 10));
    } catch (error) {
      console.error(error);
    } finally {
      setTimeout(() => {
        setBalls(prev => prev.filter(b => b.id !== id));
        setIsDropping(false);
      }, 1000);
    }
  };

  return (
    <div className="space-y-8">
      {/* Plinko Board */}
      <div className="relative max-w-xl mx-auto aspect-[4/5] bg-black/40 rounded-[3rem] border border-white/10 p-8 overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none" />
        
        {/* Pegs */}
        <div className="flex flex-col items-center justify-between h-full py-4">
          {Array.from({ length: ROWS + 1 }, (_, row) => (
            <div key={row} className="flex justify-center gap-4 sm:gap-6">
              {Array.from({ length: row + 3 }, (_, peg) => (
                <div 
                  key={peg} 
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/20 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]" 
                />
              ))}
            </div>
          ))}
        </div>

        {/* Balls */}
        <AnimatePresence>
          {balls.map(ball => (
            <motion.div
              key={ball.id}
              initial={{ top: '0%', left: '50%' }}
              animate={{ 
                top: `${(ball.y / (ROWS + 2)) * 100}%`,
                left: `${50 + (ball.x * 3)}%`
              }}
              exit={{ opacity: 0, scale: 2 }}
              className="absolute w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-yellow-300 to-yellow-600 rounded-full shadow-[0_0_20px_rgba(234,179,8,0.8)] z-20 border border-white/20"
            />
          ))}
        </AnimatePresence>

        {/* Multipliers */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between gap-1">
          {PLINKO_MULTIPLIERS.map((mult, i) => (
            <div 
              key={i}
              className={`flex-1 py-2 rounded-lg text-[8px] sm:text-[10px] font-black text-center border transition-all ${
                mult >= 2 ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' :
                mult >= 1 ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400' :
                'bg-red-500/20 border-red-500/50 text-red-400'
              }`}
            >
              {mult}x
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-xs mx-auto space-y-4">
        <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Plinko Bet</span>
            <span className="text-[8px] text-gray-600 font-medium">Min: ${MIN_BET} | Max: ${maxBet}</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setBetAmount(Math.max(MIN_BET, Number((betAmount - 0.1).toFixed(1))))} 
              className="text-gray-500 hover:text-white font-bold w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg"
            >
              -
            </button>
            <span className="font-bold text-yellow-500 min-w-[40px] text-center">${betAmount.toFixed(2)}</span>
            <button 
              onClick={() => setBetAmount(Math.min(maxBet, Number((betAmount + 0.1).toFixed(1))))} 
              className="text-gray-500 hover:text-white font-bold w-8 h-8 flex items-center justify-center bg-white/5 rounded-lg"
            >
              +
            </button>
          </div>
        </div>

        <button
          disabled={isDropping || betAmount > balance}
          onClick={handleDrop}
          className={`w-full py-5 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl ${
            isDropping || betAmount > balance
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-300 hover:to-yellow-500'
          }`}
        >
          {isDropping ? 'DROPPING...' : 'DROP BALL'}
        </button>

        {/* History */}
        <div className="flex gap-2 overflow-x-auto py-2 scrollbar-hide">
          {gameHistory.map((h, i) => (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              key={i}
              className={`flex-shrink-0 px-3 py-1 rounded-lg text-[10px] font-bold border ${
                h.multiplier >= 1 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-red-500/10 border-red-500/30 text-red-500'
              }`}
            >
              {h.multiplier}x
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
