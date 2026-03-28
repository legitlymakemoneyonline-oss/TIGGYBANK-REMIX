import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { CircleDot, Volume2, VolumeX, Zap, Coins } from 'lucide-react';

interface RouletteProps {
  balance: number;
  maxBet: number;
  onPlay: (bet: number, win: number) => Promise<void>;
  playSound: (type: 'spin' | 'win' | 'loss' | 'ball_roll' | 'ball_drop') => void;
  muted: boolean;
  setMuted: (muted: boolean) => void;
  isAdmin?: boolean;
}

const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const MIN_BET = 0.1;

export const Roulette: React.FC<RouletteProps> = ({ 
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
  const [autoBet, setAutoBet] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [gameResult, setGameResult] = useState<{ win: number; message: string; number?: number } | null>(null);
  const [rotation, setRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [rouletteHistory, setRouletteHistory] = useState<number[]>([]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoBet && !isSpinning) {
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
  }, [autoBet, isSpinning, gameResult, selectedNumbers]);

  const handlePlay = async () => {
    if (betAmount < MIN_BET || betAmount > maxBet || betAmount > balance || selectedNumbers.length === 0 || isSpinning) {
      setAutoBet(false);
      return;
    }
    
    setIsSpinning(true);
    setGameResult(null);
    playSound('spin');

    const winningNumber = ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];
    const numberIndex = ROULETTE_NUMBERS.indexOf(winningNumber);
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    
    const anglePerNumber = 360 / 37;
    const targetWheelRotation = rotation + (extraSpins * 360) + (360 - (numberIndex * anglePerNumber));
    const targetBallRotation = ballRotation - (extraSpins * 720) - (ballRotation % 360);

    setRotation(targetWheelRotation);
    setBallRotation(targetBallRotation);

    const rollInterval = setInterval(() => playSound('ball_roll'), 800);

    await new Promise(resolve => setTimeout(resolve, 4000));
    clearInterval(rollInterval);
    playSound('ball_drop');

    let win = 0;
    let message = "";

    if (selectedNumbers.includes(winningNumber)) {
      const betPerNumber = betAmount / selectedNumbers.length;
      win = Number((betPerNumber * 36).toFixed(2)); 
      message = `BOOM! The ball landed on ${winningNumber}! Your bet on this number paid out $${win.toLocaleString()}!`;
      playSound('win');
    } else {
      message = `The ball landed on ${winningNumber}. Your $${betAmount} bet was secured in your savings vault.`;
      playSound('loss');
    }

    try {
      await onPlay(betAmount, win);
      setGameResult({ win, message, number: winningNumber });
      setRouletteHistory(prev => [winningNumber, ...prev].slice(0, 10));
    } catch (error) {
      console.error(error);
      setAutoBet(false);
    } finally {
      setIsSpinning(false);
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

  return (
    <div className="space-y-12">
      {/* Roulette History */}
      <div className="flex items-center justify-between max-w-xl mx-auto px-4">
        <div className="flex gap-2 overflow-x-auto py-2">
          {rouletteHistory.map((num, i) => (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/10 ${
                num === 0 ? 'bg-emerald-500' : ROULETTE_NUMBERS.indexOf(num) % 2 === 0 ? 'bg-red-500' : 'bg-black'
              }`}
            >
              {num}
            </motion.div>
          ))}
        </div>
        
        {gameResult?.number !== undefined && !isSpinning && (
          <motion.div 
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/10"
          >
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-gray-500 uppercase font-bold">Winning Number</span>
              <span className={`text-sm font-black ${gameResult.number === 0 ? 'text-emerald-500' : ROULETTE_NUMBERS.indexOf(gameResult.number) % 2 === 0 ? 'text-red-500' : 'text-white'}`}>
                {gameResult.number}
              </span>
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-gray-500 uppercase font-bold">Payout</span>
              <span className={`text-sm font-black ${gameResult.win > 0 ? 'text-emerald-500' : 'text-gray-500'}`}>
                ${gameResult.win.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
            </div>
          </motion.div>
        )}
      </div>

      {/* Roulette Wheel */}
      <div className="relative w-72 h-72 mx-auto">
        <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 border-4 border-amber-700/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)]" />
        
        <motion.div 
          animate={{ rotate: ballRotation }}
          transition={{ duration: 4, ease: [0.45, 0.05, 0.55, 0.95] }}
          className="absolute inset-0 z-30 pointer-events-none"
        >
          <div className="absolute top-6 left-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_white] border border-gray-200" />
        </motion.div>

        <motion.div 
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.45, 0.05, 0.55, 0.95] }}
          className="w-full h-full rounded-full border-[12px] border-amber-600/20 relative shadow-inner overflow-hidden"
          style={{ 
            background: 'conic-gradient(#1a1a1a 0deg 9.7deg, #e11d48 9.7deg 19.4deg, #1a1a1a 19.4deg 29.1deg, #e11d48 29.1deg 38.8deg, #1a1a1a 38.8deg 48.5deg, #e11d48 48.5deg 58.2deg, #1a1a1a 58.2deg 67.9deg, #e11d48 67.9deg 77.6deg, #1a1a1a 77.6deg 87.3deg, #e11d48 87.3deg 97deg, #1a1a1a 97deg 106.7deg, #e11d48 106.7deg 116.4deg, #1a1a1a 116.4deg 126.1deg, #e11d48 126.1deg 135.8deg, #1a1a1a 135.8deg 145.5deg, #e11d48 145.5deg 155.2deg, #1a1a1a 155.2deg 164.9deg, #e11d48 164.9deg 174.6deg, #059669 174.6deg 184.3deg, #e11d48 184.3deg 194deg, #1a1a1a 194deg 203.7deg, #e11d48 203.7deg 213.4deg, #1a1a1a 213.4deg 223.1deg, #e11d48 223.1deg 232.8deg, #1a1a1a 232.8deg 242.5deg, #e11d48 242.5deg 252.2deg, #1a1a1a 252.2deg 261.9deg, #e11d48 261.9deg 271.6deg, #1a1a1a 271.6deg 281.3deg, #e11d48 281.3deg 291deg, #1a1a1a 291deg 300.7deg, #e11d48 300.7deg 310.4deg, #1a1a1a 310.4deg 320.1deg, #e11d48 320.1deg 329.8deg, #1a1a1a 329.8deg 339.5deg, #e11d48 339.5deg 349.2deg, #1a1a1a 349.2deg 360deg)'
          }}
        >
          {ROULETTE_NUMBERS.map((num, i) => (
            <div 
              key={i}
              className="absolute top-0 left-1/2 -translate-x-1/2 h-full py-4 text-[10px] font-black text-white/60"
              style={{ transform: `rotate(${(i * (360 / 37))}deg)` }}
            >
              {num}
            </div>
          ))}
        </motion.div>
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-10 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-full shadow-2xl z-40 flex items-center justify-center border border-yellow-200/50">
          <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
        </div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-gradient-to-br from-amber-400 via-amber-600 to-amber-900 rounded-full border-4 border-amber-200/30 shadow-2xl z-10 flex items-center justify-center">
          <div className="w-10 h-10 bg-black/60 rounded-full backdrop-blur-md border border-white/10 shadow-inner" />
        </div>
      </div>

      {/* Betting Grid */}
      <div className="max-w-xl mx-auto">
        <p className="text-[10px] text-gray-500 uppercase font-bold text-center mb-4 tracking-widest">Select Up to 10 Numbers (0-36)</p>
        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 bg-white/5 p-4 rounded-3xl border border-white/10 shadow-inner">
          {Array.from({ length: 37 }, (_, i) => {
            const isWinning = gameResult?.number === i;
            return (
              <button
                key={i}
                onClick={() => toggleNumber(i)}
                className={`aspect-square rounded-xl text-xs font-bold transition-all relative overflow-hidden ${
                  selectedNumbers.includes(i) 
                    ? 'bg-yellow-500 text-black scale-110 shadow-[0_0_20px_rgba(234,179,8,0.6)] z-10' 
                    : isWinning
                      ? 'bg-emerald-500 text-white scale-125 z-20 shadow-[0_0_30px_rgba(16,185,129,0.8)] animate-pulse'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                } ${i === 0 ? 'border-2 border-emerald-500/30' : ''}`}
              >
                {i}
                {isWinning && (
                  <motion.div 
                    layoutId="win-highlight"
                    className="absolute inset-0 bg-white/20 animate-ping"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Controls */}
      <div className="max-w-xs mx-auto space-y-4">
        <div className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-500 font-bold uppercase">Roulette Bet</span>
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
          <span className="text-[10px] text-gray-500 font-bold uppercase">Auto Bet</span>
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
          disabled={isSpinning || selectedNumbers.length === 0 || betAmount > balance}
          onClick={handlePlay}
          className={`w-full py-5 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl ${
            isSpinning || selectedNumbers.length === 0 || betAmount > balance
              ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-black hover:from-yellow-300 hover:to-yellow-500'
          }`}
        >
          {isSpinning ? 'SPINNING...' : selectedNumbers.length === 0 ? 'SELECT NUMBERS' : 'PLACE BET'}
        </button>
      </div>
    </div>
  );
};
