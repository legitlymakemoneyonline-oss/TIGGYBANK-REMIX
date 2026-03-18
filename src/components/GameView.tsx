import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gamepad2, 
  Dices, 
  CircleDot, 
  Grid3X3, 
  ShieldAlert,
  Zap,
  Sparkles,
  Volume2,
  VolumeX,
  Trophy,
  Coins,
  TrendingUp,
  ChevronDown,
  Cpu
} from 'lucide-react';

interface GameViewProps {
  balance: number;
  level: number;
  onPlay: (bet: number, win: number) => Promise<void>;
  isAdmin?: boolean;
}

const ROULETTE_NUMBERS = [
  0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const CRYPTO_SYMBOLS = [
  { name: 'BTC', icon: '₿', color: 'text-orange-500', multiplier: 50 },
  { name: 'ETH', icon: 'Ξ', color: 'text-blue-400', multiplier: 25 },
  { name: 'SOL', icon: '◎', color: 'text-purple-400', multiplier: 15 },
  { name: 'ADA', icon: '₳', color: 'text-blue-600', multiplier: 10 },
  { name: 'DOT', icon: '●', color: 'text-pink-500', multiplier: 5 },
  { name: 'DOGE', icon: 'Ð', color: 'text-yellow-500', multiplier: 2 },
];

const SLOT_LINES = [
  [0, 1, 2, 3, 4], // Row 1
  [5, 6, 7, 8, 9], // Row 2
  [10, 11, 12, 13, 14], // Row 3
  [0, 6, 12, 8, 4], // V shape
  [10, 6, 2, 8, 14], // Inverted V
  [0, 1, 7, 3, 4], // Small V
  [10, 11, 7, 13, 14], // Small Inverted V
  [5, 1, 2, 3, 9], // Top arch
  [5, 11, 12, 13, 9], // Bottom arch
  [0, 6, 2, 8, 4], // Zigzag
  [10, 6, 12, 8, 14], // Zigzag inverted
  [0, 1, 12, 3, 4], // Deep V
  [10, 11, 2, 13, 14], // Deep Inverted V
  [5, 6, 2, 8, 9], // Middle arch
  [5, 6, 12, 8, 9], // Middle arch inverted
  [0, 11, 2, 13, 4], // W shape
  [10, 1, 12, 3, 14], // M shape
  [0, 6, 7, 8, 4], // Staircase
  [10, 6, 5, 8, 14], // Staircase inverted
  [5, 1, 7, 13, 9], // Diamond
];

const KENO_PAYOUTS: Record<number, Record<number, number>> = {
  1: { 1: 3 },
  2: { 2: 12 },
  3: { 2: 1, 3: 42 },
  4: { 2: 0.5, 3: 3, 4: 130 },
  5: { 3: 1, 4: 10, 5: 700 },
  6: { 3: 0.5, 4: 4, 5: 70, 6: 1600 },
  7: { 4: 1, 5: 20, 6: 400, 7: 5000 },
  8: { 4: 0.5, 5: 5, 6: 80, 7: 600, 8: 15000 },
  9: { 5: 1, 6: 25, 7: 150, 8: 2500, 9: 25000 },
  10: { 5: 0.5, 6: 10, 7: 50, 8: 600, 9: 6000, 10: 100000 }
};

const MIN_BET = 0.1;

const SOUNDS = {
  spin: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
  win: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
  loss: 'https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3',
  ball_roll: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3',
  ball_drop: 'https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3'
};

export const GameView: React.FC<GameViewProps> = ({ balance, level, onPlay, isAdmin }) => {
  const [activeGame, setActiveGame] = useState<'keno' | 'plinko' | 'roulette' | 'slots' | null>(null);
  const [betAmount, setBetAmount] = useState(0.1);
  const [selectedNumbers, setSelectedNumbers] = useState<number[]>([]);
  const [kenoSelectedNumbers, setKenoSelectedNumbers] = useState<number[]>([]);
  const [autoBet, setAutoBet] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [gameResult, setGameResult] = useState<{ 
    win: number; 
    message: string; 
    number?: number; 
    matched?: number[]; 
    slotReels?: any[][];
    winningLines?: number[][];
  } | null>(null);
  const [rotation, setRotation] = useState(0);
  const [ballRotation, setBallRotation] = useState(0);
  const [muted, setMuted] = useState(false);
  const [kenoDrawing, setKenoDrawing] = useState<number[]>([]);
  const [plinkoPath, setPlinkoPath] = useState<{ x: number, y: number }[]>([]);
  const [rouletteHistory, setRouletteHistory] = useState<number[]>([]);
  const [slotReels, setSlotReels] = useState<any[][]>([
    [CRYPTO_SYMBOLS[0], CRYPTO_SYMBOLS[1], CRYPTO_SYMBOLS[2]],
    [CRYPTO_SYMBOLS[3], CRYPTO_SYMBOLS[4], CRYPTO_SYMBOLS[5]],
    [CRYPTO_SYMBOLS[0], CRYPTO_SYMBOLS[1], CRYPTO_SYMBOLS[2]],
    [CRYPTO_SYMBOLS[3], CRYPTO_SYMBOLS[4], CRYPTO_SYMBOLS[5]],
    [CRYPTO_SYMBOLS[0], CRYPTO_SYMBOLS[1], CRYPTO_SYMBOLS[2]],
  ]);

  const maxBet = 5 * Math.pow(2, level - 1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Auto Bet Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (autoBet && !isSpinning && activeGame) {
      if (gameResult) {
        // If there's a result, wait 3 seconds then clear it to trigger the next bet
        timer = setTimeout(() => {
          setGameResult(null);
        }, 3000);
      } else {
        // If no result, wait 1.5 seconds then play
        timer = setTimeout(() => {
          if (activeGame === 'roulette' && selectedNumbers.length > 0) handleRoulettePlay();
          else if (activeGame === 'keno' && kenoSelectedNumbers.length > 0) handleKenoPlay();
          else if (activeGame === 'plinko') handlePlinkoPlay();
          else if (activeGame === 'slots') handleSlotsPlay();
          else setAutoBet(false); // Stop if no numbers selected
        }, 1500);
      }
    }
    return () => clearTimeout(timer);
  }, [autoBet, isSpinning, activeGame, gameResult, selectedNumbers, kenoSelectedNumbers]);

  const playSound = (type: keyof typeof SOUNDS) => {
    if (muted) return;
    const audio = new Audio(SOUNDS[type]);
    audio.volume = 0.4;
    audio.play().catch(() => {});
  };

  const handleRoulettePlay = async () => {
    if (betAmount < MIN_BET || betAmount > maxBet || betAmount > balance || selectedNumbers.length === 0 || isSpinning) {
      setAutoBet(false);
      return;
    }
    
    setIsSpinning(true);
    setGameResult(null);
    playSound('spin');

    // Calculate rotation
    const winningNumber = ROULETTE_NUMBERS[Math.floor(Math.random() * ROULETTE_NUMBERS.length)];
    const numberIndex = ROULETTE_NUMBERS.indexOf(winningNumber);
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    
    // Wheel rotation to put winning number at the top (0 degrees)
    // The wheel is drawn with 0 at the top. 
    // If we rotate by 360 - (index * angle_per_number), the number at index will be at the top.
    const anglePerNumber = 360 / 37;
    const targetWheelRotation = rotation + (extraSpins * 360) + (360 - (numberIndex * anglePerNumber));
    
    // Ball rotation to end at the top (0 degrees world space)
    // We want ballRotation to end at a multiple of 360.
    const targetBallRotation = ballRotation - (extraSpins * 720) - (ballRotation % 360);

    setRotation(targetWheelRotation);
    setBallRotation(targetBallRotation);

    // Ball rolling sound
    const rollInterval = setInterval(() => playSound('ball_roll'), 800);

    // Wait for animation
    await new Promise(resolve => setTimeout(resolve, 4000));
    clearInterval(rollInterval);
    playSound('ball_drop');

    let win = 0;
    let message = "";

    if (selectedNumbers.includes(winningNumber)) {
      // Payout is 35 to 1 (total 36x the bet portion)
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

  const handleKenoPlay = async () => {
    if (betAmount < MIN_BET || betAmount > maxBet || betAmount > balance || kenoSelectedNumbers.length === 0 || isSpinning) {
      setAutoBet(false);
      return;
    }
    setIsSpinning(true);
    setGameResult(null);
    setKenoDrawing([]);
    playSound('spin');

    // Draw 20 random numbers one by one
    const drawnNumbers: number[] = [];
    while (drawnNumbers.length < 20) {
      const num = Math.floor(Math.random() * 80) + 1;
      if (!drawnNumbers.includes(num)) {
        drawnNumbers.push(num);
        setKenoDrawing(prev => [...prev, num]);
        await new Promise(resolve => setTimeout(resolve, 150));
      }
    }

    const matches = kenoSelectedNumbers.filter(n => drawnNumbers.includes(n));
    
    let win = 0;
    let message = "";

    const matchCount = matches.length;
    const totalSelected = kenoSelectedNumbers.length;
    
    const multiplier = KENO_PAYOUTS[totalSelected]?.[matchCount] || 0;
    
    if (multiplier > 0) {
      win = Number((betAmount * multiplier).toFixed(2));
      message = `JACKPOT! Matched ${matchCount}/${totalSelected}! Payout: ${multiplier}x ($${win.toLocaleString()})`;
      playSound('win');
    } else {
      message = `Matched ${matchCount}/${totalSelected}. No payout for this combination. Bet routed to savings.`;
      playSound('loss');
    }

    await onPlay(betAmount, win);
    setGameResult({ win, message, matched: drawnNumbers });
    setIsSpinning(false);
  };

  const handlePlinkoPlay = async () => {
    if (betAmount < MIN_BET || betAmount > maxBet || betAmount > balance || isSpinning) {
      setAutoBet(false);
      return;
    }
    setIsSpinning(true);
    setGameResult(null);
    playSound('spin');
    
    // Calculate path
    const path = [{ x: 50, y: 10 }];
    let currentX = 50;
    for (let i = 0; i < 6; i++) {
      currentX += (Math.random() > 0.5 ? 8 : -8);
      path.push({ x: currentX, y: 25 + (i * 12) });
    }
    
    // Final slot determination
    const multipliers = [0.2, 0.5, 2, 5, 2, 0.5, 0.2];
    const slotIndex = Math.floor((currentX - 20) / 10);
    const safeSlotIndex = Math.max(0, Math.min(multipliers.length - 1, slotIndex));
    const mult = multipliers[safeSlotIndex];
    
    setPlinkoPath(path);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const win = Number((betAmount * mult).toFixed(2));
    
    let message = "";
    if (mult >= 1) {
      message = `BOUNCE! Hit the ${mult}x multiplier! Won $${win}`;
      playSound('win');
    } else {
      message = `Tough bounce. Hit ${mult}x. Loss routed to savings.`;
      playSound('loss');
    }

    await onPlay(betAmount, win);
    setGameResult({ win, message });
    setIsSpinning(false);
  };

  const handleSlotsPlay = async () => {
    if (betAmount < MIN_BET || betAmount > maxBet || betAmount > balance || isSpinning) {
      setAutoBet(false);
      return;
    }
    setIsSpinning(true);
    setGameResult(null);
    playSound('spin');

    // Generate random reels
    const newReels = Array.from({ length: 5 }, () => 
      Array.from({ length: 3 }, () => CRYPTO_SYMBOLS[Math.floor(Math.random() * CRYPTO_SYMBOLS.length)])
    );

    // Animation delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSlotReels(newReels);

    // Calculate wins across 20 lines
    let totalWin = 0;
    let winningLinesCount = 0;
    const winningLines: number[][] = [];

    // Flatten reels for line checking (5x3 grid)
    const flatGrid = [];
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 5; col++) {
        flatGrid.push(newReels[col][row]);
      }
    }

    SLOT_LINES.forEach(line => {
      const symbols = line.map(idx => flatGrid[idx]);
      const firstSymbol = symbols[0];
      let matchCount = 1;
      for (let i = 1; i < symbols.length; i++) {
        if (symbols[i].name === firstSymbol.name) matchCount++;
        else break;
      }

      if (matchCount >= 3) {
        const lineWin = Number(((betAmount / 20) * firstSymbol.multiplier * (matchCount - 2)).toFixed(2));
        totalWin += lineWin;
        winningLinesCount++;
        winningLines.push(line);
      }
    });

    let message = "";
    if (totalWin > 0) {
      message = `JACKPOT! You hit ${winningLinesCount} lines for a total of $${totalWin.toLocaleString()}!`;
      playSound('win');
    } else {
      message = `No luck this spin. Your $${betAmount} bet was routed to crypto-savings.`;
      playSound('loss');
    }

    const finalWin = Number(totalWin.toFixed(2));
    await onPlay(betAmount, finalWin);
    setGameResult({ win: finalWin, message, slotReels: newReels, winningLines });
    setIsSpinning(false);
  };

  const toggleRouletteNumber = (num: number) => {
    if (selectedNumbers.includes(num)) {
      setSelectedNumbers(selectedNumbers.filter(n => n !== num));
    } else {
      if (selectedNumbers.length < 10) {
        setSelectedNumbers([...selectedNumbers, num]);
      }
    }
  };

  const toggleKenoNumber = (num: number) => {
    if (kenoSelectedNumbers.includes(num)) {
      setKenoSelectedNumbers(kenoSelectedNumbers.filter(n => n !== num));
    } else {
      if (kenoSelectedNumbers.length < 10) {
        setKenoSelectedNumbers([...kenoSelectedNumbers, num]);
      }
    }
  };

  const kenoQuickPick = () => {
    const numbers: number[] = [];
    while (numbers.length < 10) {
      const num = Math.floor(Math.random() * 80) + 1;
      if (!numbers.includes(num)) numbers.push(num);
    }
    setKenoSelectedNumbers(numbers);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4 bg-white/5 p-4 rounded-3xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl">
            <Gamepad2 className="text-emerald-500 w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Casino Royale</h2>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Premium Gaming Suite</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setMuted(!muted)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-gray-400"
          >
            {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-bold text-emerald-500">{isAdmin ? 'GOD MODE' : 'SECURE PLAY'}</span>
          </div>
        </div>
      </div>

      {!activeGame ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <GameCard 
            title="Roulette" 
            desc="Single number bets. 35x Payouts." 
            icon={<CircleDot className="w-8 h-8 text-red-500" />}
            color="from-red-500/20 to-black"
            onClick={() => setActiveGame('roulette')}
          />
          <GameCard 
            title="Keno" 
            desc="High stakes matching. 10x Payouts." 
            icon={<Grid3X3 className="w-8 h-8 text-purple-500" />}
            color="from-purple-500/20 to-black"
            onClick={() => setActiveGame('keno')}
          />
          <GameCard 
            title="Plinko" 
            desc="The classic drop. 5x Multipliers." 
            icon={<Dices className="w-8 h-8 text-emerald-500" />}
            color="from-emerald-500/20 to-black"
            onClick={() => setActiveGame('plinko')}
          />
          <GameCard 
            title="Crypto Slots" 
            desc="20 Lines. BTC Jackpots." 
            icon={<Cpu className="w-8 h-8 text-orange-500" />}
            color="from-orange-500/20 to-black"
            onClick={() => setActiveGame('slots')}
          />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/40 border border-white/10 rounded-[40px] overflow-hidden backdrop-blur-xl"
        >
          <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
            <button 
              onClick={() => { setActiveGame(null); setGameResult(null); }}
              className="text-xs font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-widest"
            >
              ← Exit Game
            </button>
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-bold text-yellow-500">${balance.toLocaleString()}</span>
            </div>
          </div>

          <div className="p-8">
            {activeGame === 'roulette' && (
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
                    {/* Outer Wood Frame */}
                    <div className="absolute -inset-4 rounded-full bg-gradient-to-br from-amber-900 via-amber-800 to-amber-950 border-4 border-amber-700/30 shadow-[0_20px_50px_rgba(0,0,0,0.8)]" />
                    
                    {/* Ball Track */}
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
                  {/* Pointer */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-6 h-10 bg-gradient-to-b from-yellow-300 to-yellow-600 rounded-full shadow-2xl z-40 flex items-center justify-center border border-yellow-200/50">
                    <div className="w-2 h-2 bg-white rounded-full shadow-[0_0_10px_white]" />
                  </div>
                  {/* Center Hub */}
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
                          onClick={() => toggleRouletteNumber(i)}
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
                    onClick={handleRoulettePlay}
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
            )}

            {activeGame === 'keno' && (
              <div className="text-center space-y-8">
                <div className="flex items-center justify-between max-w-md mx-auto px-2">
                  <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Select Up to 10 Numbers (1-80)</p>
                  <button 
                    onClick={kenoQuickPick}
                    disabled={isSpinning}
                    className="text-[10px] bg-purple-500/20 text-purple-400 px-3 py-1 rounded-full border border-purple-500/30 hover:bg-purple-500/30 transition-colors font-bold uppercase tracking-tighter"
                  >
                    Quick Pick
                  </button>
                </div>
                <div className="grid grid-cols-10 gap-1 max-w-md mx-auto bg-white/5 p-2 rounded-2xl border border-white/10">
                  {Array.from({ length: 80 }, (_, i) => {
                    const num = i + 1;
                    const isSelected = kenoSelectedNumbers.includes(num);
                    const isDrawing = kenoDrawing.includes(num);
                    const isMatched = gameResult?.matched?.includes(num) || (isDrawing && isSelected);
                    return (
                      <button 
                        key={i} 
                        onClick={() => toggleKenoNumber(num)}
                        className={`aspect-square rounded-md flex items-center justify-center text-[8px] font-bold transition-all duration-300 ${
                          isSelected 
                            ? 'bg-purple-500 text-white scale-110 shadow-[0_0_10px_rgba(168,85,247,0.5)] z-10' 
                            : isDrawing
                              ? 'bg-yellow-500 scale-125 z-20 shadow-[0_0_15px_yellow]'
                              : isMatched
                                ? 'bg-emerald-500/40 text-emerald-200'
                                : 'bg-white/5 text-gray-600 hover:bg-white/10'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>

                <div className="max-w-xs mx-auto space-y-4">
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
                    onClick={handleKenoPlay}
                    disabled={isSpinning || kenoSelectedNumbers.length === 0 || betAmount > balance}
                    className={`w-full py-5 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-xl ${
                      isSpinning || kenoSelectedNumbers.length === 0 || betAmount > balance
                        ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-500'
                    }`}
                  >
                    {isSpinning ? 'DRAWING...' : kenoSelectedNumbers.length === 0 ? 'SELECT NUMBERS' : 'START DRAW'}
                  </button>
                </div>
              </div>
            )}

            {activeGame === 'plinko' && (
              <div className="space-y-8 text-center">
                <div className="relative max-w-sm mx-auto bg-white/5 rounded-3xl p-8 border border-white/10 aspect-[3/4] flex flex-col justify-between">
                  {/* Pegs */}
                  <div className="space-y-4">
                    {[...Array(6)].map((_, row) => (
                      <div key={row} className="flex justify-center gap-4">
                        {[...Array(row + 3)].map((_, i) => (
                          <div key={i} className="w-2 h-2 bg-white/20 rounded-full shadow-[0_0_5px_rgba(255,255,255,0.2)]" />
                        ))}
                      </div>
                    ))}
                  </div>

                  {/* Multipliers */}
                  <div className="flex justify-between gap-1 mt-12">
                    {[0.2, 0.5, 2, 5, 2, 0.5, 0.2].map((m, i) => (
                      <div key={i} className={`flex-1 py-2 rounded-lg text-[10px] font-bold border border-white/10 ${m >= 1 ? 'bg-emerald-500/20 text-emerald-500' : 'bg-red-500/20 text-red-500'}`}>
                        {m}x
                      </div>
                    ))}
                  </div>

                  {/* Ball Animation */}
                  <AnimatePresence>
                    {isSpinning && (
                      <motion.div
                        initial={{ top: '10%', left: '50%' }}
                        animate={{ 
                          top: plinkoPath.map(p => `${p.y}%`),
                          left: plinkoPath.map(p => `${p.x}%`)
                        }}
                        transition={{ duration: 2, ease: "linear" }}
                        className="absolute w-4 h-4 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.8)] z-20"
                      />
                    )}
                  </AnimatePresence>
                </div>

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
                    onClick={handlePlinkoPlay}
                    disabled={isSpinning || betAmount > balance}
                    className="w-full py-5 bg-emerald-600 rounded-2xl font-bold text-lg hover:bg-emerald-500 transition-all shadow-xl disabled:opacity-50"
                  >
                    {isSpinning ? 'DROPPING...' : 'DROP BALL'}
                  </button>
                </div>
              </div>
            )}

            {activeGame === 'slots' && (
              <div className="space-y-8 text-center">
                <div className="relative max-w-2xl mx-auto bg-black/60 rounded-[32px] p-6 border border-white/10 shadow-2xl overflow-hidden">
                  <div className="grid grid-cols-5 gap-2 relative">
                    {slotReels.map((reel, reelIdx) => (
                      <div key={reelIdx} className="space-y-2">
                        {reel.map((symbol, symbolIdx) => {
                          const flatIdx = symbolIdx * 5 + reelIdx;
                          const isWinningSymbol = gameResult?.winningLines?.some(line => line.includes(flatIdx));
                          
                          return (
                            <motion.div
                              key={symbolIdx}
                              initial={{ y: -50, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ 
                                duration: 0.5, 
                                delay: reelIdx * 0.1 + symbolIdx * 0.05,
                                type: "spring",
                                stiffness: 200
                              }}
                              className={`bg-white/5 aspect-square rounded-2xl flex flex-col items-center justify-center border transition-all duration-500 relative group ${
                                isWinningSymbol && !isSpinning
                                  ? 'border-yellow-500/50 bg-yellow-500/10 scale-105 shadow-[0_0_15px_rgba(234,179,8,0.2)]' 
                                  : 'border-white/5'
                              }`}
                            >
                              <span className={`text-4xl ${symbol.color} transition-transform duration-500 ${isWinningSymbol && !isSpinning ? 'scale-110 drop-shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]'}`}>
                                {symbol.icon}
                              </span>
                              <span className="text-[8px] text-gray-500 font-bold mt-1">{symbol.name}</span>
                              {isWinningSymbol && !isSpinning && (
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: [0, 1, 0] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="absolute inset-0 rounded-2xl bg-yellow-500/5 pointer-events-none"
                                />
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    ))}

                    {/* Winning Lines SVG Overlay */}
                    {gameResult?.winningLines && gameResult.winningLines.length > 0 && !isSpinning && (
                      <svg className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible">
                        {gameResult.winningLines.map((line, lineIdx) => {
                          const points = line.map(idx => {
                            const col = idx % 5;
                            const row = Math.floor(idx / 5);
                            // Calculate center of each cell
                            // 5 columns, 3 rows. Gap is 2 (8px). 
                            // This is tricky with CSS grid. Let's use percentages.
                            const x = (col * 20) + 10;
                            const y = (row * 33.33) + 16.66;
                            return `${x}% ${y}%`;
                          }).join(', ');

                          return (
                            <motion.polyline
                              key={lineIdx}
                              points={points}
                              fill="none"
                              stroke="rgba(234, 179, 8, 0.6)"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              initial={{ pathLength: 0, opacity: 0 }}
                              animate={{ pathLength: 1, opacity: 1 }}
                              transition={{ duration: 1, delay: lineIdx * 0.2 }}
                              className="drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]"
                            />
                          );
                        })}
                      </svg>
                    )}
                  </div>
                  
                  {/* Overlay for spinning effect */}
                  {isSpinning && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/20 backdrop-blur-[2px] z-10 flex items-center justify-center"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full"
                      />
                    </motion.div>
                  )}

                  {/* Winning Info Overlay */}
                  {gameResult?.win !== undefined && gameResult.win > 0 && !isSpinning && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 bg-emerald-500/90 backdrop-blur-md px-6 py-2 rounded-full border border-emerald-400/50 shadow-[0_0_30px_rgba(16,185,129,0.4)] flex items-center gap-3"
                    >
                      <Trophy className="w-4 h-4 text-white" />
                      <span className="text-white font-black text-sm tracking-tighter">
                        WIN: ${gameResult.win.toLocaleString()}
                      </span>
                      <div className="w-px h-4 bg-white/20" />
                      <span className="text-white/80 text-[10px] font-bold uppercase">
                        {gameResult.winningLines?.length} LINES
                      </span>
                    </motion.div>
                  )}
                </div>

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
                    onClick={handleSlotsPlay}
                    disabled={isSpinning || betAmount > balance}
                    className="w-full py-5 bg-gradient-to-r from-orange-600 to-orange-400 rounded-2xl font-bold text-lg hover:from-orange-500 hover:to-orange-300 transition-all shadow-xl disabled:opacity-50 text-black"
                  >
                    {isSpinning ? 'SPINNING...' : 'SPIN REELS'}
                  </button>
                </div>
              </div>
            )}

            {/* Result Overlay */}
            <AnimatePresence>
              {gameResult && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={`mt-12 p-8 rounded-[32px] border relative overflow-hidden ${
                    gameResult.win > 0 
                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' 
                      : 'bg-orange-500/10 border-orange-500/20 text-orange-500'
                  }`}
                >
                  <div className="relative z-10 flex items-center gap-6">
                    <div className={`p-4 rounded-2xl ${gameResult.win > 0 ? 'bg-emerald-500/20' : 'bg-orange-500/20'}`}>
                      {gameResult.win > 0 ? <Trophy className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xl font-bold">{gameResult.win > 0 ? 'WINNER!' : 'SECURED'}</h4>
                        {gameResult.number !== undefined && (
                          <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-white/10">
                            <span className="text-[10px] text-gray-500 uppercase font-bold">Winning #</span>
                            <span className="text-sm font-bold text-white">{gameResult.number}</span>
                          </div>
                        )}
                        {gameResult.win > 0 && (
                          <div className="flex items-center gap-2 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/20">
                            <Coins className="w-4 h-4" />
                            <span className="text-sm font-bold">+${gameResult.win.toLocaleString()}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-sm opacity-80 leading-relaxed">{gameResult.message}</p>
                    </div>
                  </div>
                  <Sparkles className="absolute top-0 right-0 w-32 h-32 text-white/5 -translate-y-1/2 translate-x-1/2" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      {/* Responsible Gaming Footer */}
      <div className="bg-orange-500/5 border border-orange-500/10 p-6 rounded-[32px] flex items-center gap-4">
        <div className="p-3 bg-orange-500/20 rounded-2xl">
          <ShieldAlert className="w-6 h-6 text-orange-500" />
        </div>
        <div>
          <h4 className="text-orange-400 font-bold text-sm uppercase tracking-wider">Responsible Gaming</h4>
          <p className="text-xs text-orange-200/40">Play responsibly. Set your own limits and never bet more than you can afford to lose. Our {isAdmin ? 'God Mode' : 'Institutional'} protection helps secure your capital, but gaming should always be for entertainment.</p>
        </div>
      </div>

      {/* Protection Footer */}
      <div className="bg-blue-500/5 border border-blue-500/10 p-6 rounded-[32px] flex items-center gap-4">
        <div className="p-3 bg-blue-500/20 rounded-2xl">
          <ShieldAlert className="w-6 h-6 text-blue-500" />
        </div>
        <div>
          <h4 className="text-blue-400 font-bold text-sm uppercase tracking-wider">{isAdmin ? 'God Mode Protection Active' : 'Capital Protection Active'}</h4>
          <p className="text-xs text-blue-200/40">Every loss is automatically converted into locked savings. Your capital is never truly at risk.</p>
        </div>
      </div>
    </div>
  );
};

interface GameCardProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ title, desc, icon, color, onClick }) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -5 }}
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className={`bg-gradient-to-br ${color} border border-white/10 p-8 rounded-[40px] text-left relative overflow-hidden group h-64 flex flex-col justify-end`}
  >
    <div className="absolute top-8 left-8 p-4 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10 group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div className="relative z-10">
      <h3 className="text-2xl font-bold mb-2">{title}</h3>
      <p className="text-xs text-gray-500 font-medium leading-relaxed">{desc}</p>
    </div>
    <div className="absolute bottom-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
      <TrendingUp className="w-24 h-24" />
    </div>
  </motion.button>
);
