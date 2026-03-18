import { BadgeType } from './types';

export const LEVEL_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 500,
  3: 1000,
  4: 2000,
  5: 4000,
  6: 8000,
  7: 16000,
  8: 32000,
  9: 64000,
  10: 128000,
};

export const BADGE_MAP: Record<number, BadgeType> = {
  1: 'Bronze',
  2: 'Gold',
  3: 'Platinum',
  4: 'Sapphire',
  5: 'Ruby',
  6: 'Amethyst',
  7: 'Emerald',
  8: 'Obsidian',
  9: 'Phoenix',
  10: 'Cosmic',
};

export const BADGE_COLORS: Record<BadgeType, string> = {
  Bronze: '#CD7F32',
  Gold: '#FFD700',
  Platinum: '#E5E4E2',
  Sapphire: '#0F52BA',
  Ruby: '#E0115F',
  Amethyst: '#9966CC',
  Emerald: '#50C878',
  Obsidian: '#3B3B3B',
  Phoenix: '#FF4500',
  Cosmic: '#8A2BE2',
};

export const WITHDRAWAL_FEE = 0.25;
export const AUTO_APPROVE_LIMIT = 20;
export const NON_PREMIUM_DAILY_LIMIT = 50;

export const MATIC_USD_RATE = 0.4;
export const CAD_USD_RATE = 0.75;
