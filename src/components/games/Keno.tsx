import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Coins, Volume2, VolumeX } from 'lucide-react';

interface KenoProps {
  balance: number;
  maxBet: number;
  onPlay: (bet: number, win: number) => Promise<void>;
  playSound: (type: 'spin' | 'win' | 'loss' | 'ball_roll' | 'ball_drop') => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  isAdmin?: boolean;
}

const KENO_PAYTABLE: { [key: number]: number[] } = {
  1: [0, 3.5],
  2: [0, 0, 15],
  3: [0, 0, 2, 45],
  4: [0, 0, 2, 10, 90],
  5: [0, 0, 1, 4, 20, 180],
  6: [0, 0, 0, 3, 10, 80, 500],
  7: [0, 0, 0, 2, 7, 30, 200, 1500],
  8: [0, 0, 0, 2, 5, 20, 100, 800, 5000],
  9: [0, 0, 0, 1, 4, 15, 60, 400, 2500, 10000],
  10: [0, 0, 0, 1, 2, 10, 40, 200, 1000, 5000, 25000]
};

const MIN_BET = 0.1;

export const Keno: React.FC<KenoProps> = ({ 
  balance, 
  maxBet, 
  onPlay, 
  playSound, 
  muted, 
  setMuted,
  isAdmin 
}) => {
  const [betAmount, setBetAmount] = useState(0.1);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [gameResult, setGameResult] = useState<{ win: number; message: string; matches: number } | null>(null);
  const [autoBet, setAutoBet] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoBet && !isDrawing) {
      if (gameResult) {
        timer = setTimeout(() => setGameResult(null), 3000);
      } else {
        timer = setTimeout(() => {
          if (selectedNumbers.length > 0) handlePlay();
          else setAutoBet(false);
        }, 1500);
      }
    }
    return () => clearTimeout(timer);
  }, [autoBet, isDrawing, gameResult, selectedNumbers]);

  const handlePlay = async () => {
    if (betAmount < MIN_BET || betAmount > maxBet || betAmount > balance || selectedNumbers.length === 0 || isDrawing) {
      setAutoBet(false);
      return;
    }

    setIsDrawing(true);
    setDrawnNumbers([]);
    setGameResult(null);
    playSound('spin');

    const numbers: number[] = [];
    const allNumbers = Array.from({ length: 40 }, (_, i) => i + 1);
    
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * allNumbers.length);
      const num = allNumbers.splice(randomIndex, 1)[0];
      numbers.push(num);
      
      await new Promise(resolve => setTimeout(resolve, 200));
      setDrawnNumbers(prev => [...prev, num]);
      playSound('ball_drop');
    }

    const matches = selectedNumbers.filter(n => numbers.includes(n)).length;
    const multiplier = KENO_PAYTABLE[selectedNumbers.length][matches] || 0;
    const win = Number((betAmount * multiplier).toFixed(2));

    let message = "";
    if (win > 0) {
      message = `JACKPOT! You matched ${matches} numbers and won $${win.toLocaleString()}!`;
      playSound('win');
    } else {
      message = `You matched ${matches} numbers. Your $${betAmount} bet was secured in your savings vault.`;
      playSound('loss');
    }

    try {
      await onPlay(betAmount, win);
      setGameResult({ win, message, matches });
    } catch (error) {
      console.error(error);
      setAutoBet(false);
    } finally {
      setIsDrawing(false);
    }
  };

  const toggleNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length < 10) {
        setSelectedNumbers([...selectedNumbers, num]);
      }
    }
  };

  const clearSelection = () => {
    if (!isDrawing) setSelectedNumbers([]);
  };

  const randomSelection = () => {
    if (isDrawing) return;
    const allNumbers = Array.from({ length: 40 }, (_, i) => i + 1);
    const randoms: number[] = [];
    for (let i = 0; i < 10; i++) {
      const idx = Math.floor(Math.random() * allNumbers.length);
      randoms.push(allNumbers.splice(idx, 1)[0]);
    }
    setSelectedNumbers(randoms);
  };

  return (
    <div className="space-y-8">
      {/* Keno Grid */}
      <div className="max-w-xl mx-auto">
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 bg-black/40 p-6 rounded-[2.5rem] border border-white/10 shadow-2xl">
          {Array.from({ length: 40 }, (_, i) => {
            const num = i + 1;
            const isSelected = selectedNumbers.includes(num);
            const isDrawn = drawnNumbers.includes(num);
            const isMatch = isSelected && isDrawn;

            return (
              <motion.button
                key={num}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toggleNumber(num)}
                disabled={isDrawing}
                className={`aspect-square rounded-2xl text-sm font-black transition-all relative overflow-hidden flex items-center justify-center border-2 ${
                  isMatch 
                    ? 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.6)] scale-110 z-10' 
                    : isDrawn
                      ? 'bg-red-500/20 border-red-500/50 text-red-500'
                      : isSelected
                        ? 'bg-yellow-500 border-yellow-400 text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]'
                        : 'bg-white/5 border-transparent text-gray-500 hover:bg-white/10 hover:border-white/20'
                }`}
              >
                {num}
                {isMatch && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="absolute inset-0 bg-white rounded-full"
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Paytable Preview */}
      <div className="max-w-xl mx-auto bg-white/5 p-4 rounded-3xl border border-white/10">
        <div className="flex items-center justify-between mb-2 px-2">
          <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Keno Multipliers</span>
          <span className="text-[10px] text-yellow-500 font-bold uppercase">{selectedNumbers.length} Numbers Selected</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {selectedNumbers.length > 0 && KENO_PAYTABLE[selectedNumbers.length].map((mult, i) => (
            <div 
              key={i}
              className={`flex-shrink-0 px-4 py-2 rounded-xl border transition-all ${
                gameResult?.matches === i 
                  ? 'bg-emerald-500 border-emerald-400 text-white scale-110' 
                  : 'bg-black/40 border-white/5 text-gray-500'
              }`}
            >
              <div className="text-[8px] uppercase font-bold opacity-60">{i} Hits</div>
              <div className="text-sm font-black">x{mult}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-xs mx-auto space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <button 
            onClick={randomSelection}
            disabled={isDrawing}
            className="py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            Quick Pick
          </button>
          <button 
            onClick={clearSelection}
            disabled={isDrawing}
            className="py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
          >
            Clear
          </button>
        </div>

        <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Keno Bet</span>
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
          disabled={isDrawing || selectedNumbers.length === 0 || betAmount > balance}
          onClick={handlePlay}
          className={`w-full py-5 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl ${
            isDrawing || selectedNumbers.length === 0 || betAmount > balance
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-300 hover:to-yellow-500'
          }`}
        >
          {isDrawing ? 'DRAWING...' : selectedNumbers.length === 0 ? 'SELECT NUMBERS' : 'START DRAW'}
        </button>
      </div>
    </div>
  );
};
