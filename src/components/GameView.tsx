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
import { Roulette } from './games/Roulette';
import { Keno } from './games/Keno';
import { Plinko } from './games/Plinko';
import { Slots } from './games/Slots';

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

export const GameView: React.FC<GameViewProps> = ({ balance, level, onPlay, isAdmin }) => {
  const [activeGame, setActiveGame] = useState<'keno' | 'plinko' | 'roulette' | 'slots' | null>(null);
  const [muted, setMuted] = useState(false);

  const maxBet = 5 * Math.pow(2, level - 1);

  const playSound = (type: 'spin' | 'win' | 'loss' | 'ball_roll' | 'ball_drop') => {
    if (muted) return;
    const SOUNDS = {
      spin: 'https://assets.mixkit.co/active_storage/sfx/2013/2013-preview.mp3',
      win: 'https://assets.mixkit.co/active_storage/sfx/2018/2018-preview.mp3',
      loss: 'https://assets.mixkit.co/active_storage/sfx/2005/2005-preview.mp3',
      ball_roll: 'https://assets.mixkit.co/active_storage/sfx/2014/2014-preview.mp3',
      ball_drop: 'https://assets.mixkit.co/active_storage/sfx/2015/2015-preview.mp3'
    };
    const audio = new Audio(SOUNDS[type]);
    audio.volume = 0.4;
    audio.play().catch(() => {});
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
              onClick={() => setActiveGame(null)}
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
              <Roulette 
                balance={balance}
                maxBet={maxBet}
                onPlay={onPlay}
                playSound={playSound}
                muted={muted}
                setMuted={setMuted}
                isAdmin={isAdmin}
              />
            )}

            {activeGame === 'keno' && (
              <Keno 
                balance={balance}
                maxBet={maxBet}
                onPlay={onPlay}
                playSound={playSound}
                muted={muted}
                setMuted={setMuted}
                isAdmin={isAdmin}
              />
            )}

            {activeGame === 'plinko' && (
              <Plinko 
                balance={balance}
                maxBet={maxBet}
                onPlay={onPlay}
                playSound={playSound}
                muted={muted}
                setMuted={setMuted}
                isAdmin={isAdmin}
              />
            )}

            {activeGame === 'slots' && (
              <Slots 
                balance={balance}
                maxBet={maxBet}
                onPlay={onPlay}
                playSound={playSound}
                muted={muted}
                setMuted={setMuted}
                isAdmin={isAdmin}
              />
            )}
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
