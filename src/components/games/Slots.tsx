import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Coins, Volume2, VolumeX } from 'lucide-react';

interface SlotsProps {
  balance: number;
  maxBet: number;
  onPlay: (bet: number, win: number) => Promise<void>;
  playSound: (type: 'spin' | 'win' | 'loss' | 'ball_roll' | 'ball_drop') => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  isAdmin?: boolean;
}

const SYMBOLS = ['🍒', '🍋', '🍇', '💎', '🔔', '7️⃣'];
const PAYTABLE: { [key: string]: number } = {
  '🍒': 2,
  '🍋': 3,
  '🍇': 5,
  '🔔': 10,
  '💎': 25,
  '7️⃣': 100
};

const MIN_BET = 0.1;

export const Slots: React.FC<SlotsProps> = ({ 
  balance, 
  maxBet, 
  onPlay, 
  playSound, 
  muted, 
  setMuted,
  isAdmin 
}) => {
  const [betAmount, setBetAmount] = useState(0.1);
  const [reels, setReels] = useState<string[]>(['💎', '💎', '💎']);
  const [isSpinning, setIsSpinning] = useState(false);
  const [gameResult, setGameResult] = useState<{ win: number; message: string } | null>(null);
  const [autoBet, setAutoBet] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoBet && !isSpinning) {
      if (gameResult) {
        timer = setTimeout(() => setGameResult(null), 3000);
      } else {
        timer = setTimeout(() => {
          handlePlay();
        }, 1500);
      }
    }
    return () => clearTimeout(timer);
  }, [autoBet, isSpinning, gameResult]);

  const handlePlay = async () => {
    if (betAmount < MIN_BET || betAmount > maxBet || betAmount > balance || isSpinning) {
      setAutoBet(false);
      return;
    }

    setIsSpinning(true);
    setGameResult(null);
    playSound('spin');

    const spinInterval = setInterval(() => {
      setReels([
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
        SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
      ]);
      playSound('ball_roll');
    }, 100);

    await new Promise(resolve => setTimeout(resolve, 2000));
    clearInterval(spinInterval);
    playSound('ball_drop');

    const finalReels = [
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)],
      SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
    ];
    setReels(finalReels);

    let win = 0;
    let message = "";

    if (finalReels[0] === finalReels[1] && finalReels[1] === finalReels[2]) {
      const multiplier = PAYTABLE[finalReels[0]];
      win = Number((betAmount * multiplier).toFixed(2));
      message = `JACKPOT! Three ${finalReels[0]}s! You won $${win.toLocaleString()}!`;
      playSound('win');
    } else if (finalReels[0] === finalReels[1] || finalReels[1] === finalReels[2] || finalReels[0] === finalReels[2]) {
      win = Number((betAmount * 1.5).toFixed(2));
      message = `Nice! Two symbols matched! You won $${win.toLocaleString()}!`;
      playSound('win');
    } else {
      message = `No match this time. Your $${betAmount} bet was secured in your savings vault.`;
      playSound('loss');
    }

    try {
      await onPlay(betAmount, win);
      setGameResult({ win, message });
    } catch (error) {
      console.error(error);
      setAutoBet(false);
    } finally {
      setIsSpinning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Slot Machine */}
      <div className="max-w-xl mx-auto bg-black/40 p-8 rounded-[3rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent pointer-events-none" />
        
        <div className="flex justify-center gap-4 sm:gap-6">
          {reels.map((symbol, i) => (
            <motion.div
              key={i}
              animate={isSpinning ? { y: [0, -20, 0] } : { scale: [1, 1.05, 1] }}
              transition={isSpinning ? { duration: 0.1, repeat: Infinity } : { duration: 2, repeat: Infinity }}
              className="w-20 h-28 sm:w-24 sm:h-32 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center text-4xl sm:text-5xl shadow-inner"
            >
              {symbol}
            </motion.div>
          ))}
        </div>

        {/* Paytable Preview */}
        <div className="mt-8 grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Object.entries(PAYTABLE).map(([symbol, mult], i) => (
            <div key={i} className="bg-black/40 p-2 rounded-xl border border-white/5 text-center">
              <div className="text-lg mb-1">{symbol}</div>
              <div className="text-[8px] font-black text-yellow-500 uppercase">x{mult}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-xs mx-auto space-y-4">
        <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Slots Bet</span>
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

        <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
          <span className="text-[10px] text-gray-500 font-bold uppercase">Auto Spin</span>
          <button 
            onClick={() => setAutoBet(!autoBet)}
            className={`w-12 h-6 rounded-full transition-colors relative ${autoBet ? 'bg-emerald-500' : 'bg-gray-700'}`}
          >
            <motion.div 
              animate={{ x: autoBet ? 24 : 4 }}
              className="absolute top-1 w-4 h-4 bg-white rounded-full"
            />
          </button>
        </div>

        <button
          disabled={isSpinning || betAmount > balance}
          onClick={handlePlay}
          className={`w-full py-5 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl ${
            isSpinning || betAmount > balance
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-300 hover:to-yellow-500'
          }`}
        >
          {isSpinning ? 'SPINNING...' : 'SPIN'}
        </button>
      </div>
    </div>
  );
};
