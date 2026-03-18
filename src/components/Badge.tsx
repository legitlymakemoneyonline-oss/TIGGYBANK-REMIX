import React from 'react';
import { motion } from 'motion/react';
import { BadgeType } from '../types';
import { BADGE_COLORS } from '../constants';
import { Shield, Star, Zap, Flame, Moon, Sun, Diamond, Crown, Hexagon, Circle } from 'lucide-react';

interface BadgeProps {
  type: BadgeType;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  animate?: boolean;
}

const ICON_MAP: Record<BadgeType, any> = {
  Bronze: Circle,
  Gold: Star,
  Platinum: Shield,
  Sapphire: Diamond,
  Ruby: Zap,
  Amethyst: Hexagon,
  Emerald: Sun,
  Obsidian: Moon,
  Phoenix: Flame,
  Cosmic: Crown,
};

export const Badge: React.FC<BadgeProps> = ({ type, size = 'md', animate = true }) => {
  const Icon = ICON_MAP[type];
  const color = BADGE_COLORS[type];

  const sizeClasses = {
    sm: 'w-6 h-6 p-1',
    md: 'w-10 h-10 p-2',
    lg: 'w-20 h-20 p-4',
    xl: 'w-32 h-32 p-6',
  };

  const intensity = {
    Bronze: 1,
    Gold: 1.2,
    Platinum: 1.4,
    Sapphire: 1.6,
    Ruby: 1.8,
    Amethyst: 2,
    Emerald: 2.2,
    Obsidian: 2.4,
    Phoenix: 2.6,
    Cosmic: 3,
  };

  const currentIntensity = intensity[type];

  return (
    <motion.div
      className={`relative rounded-full flex items-center justify-center ${sizeClasses[size]}`}
      style={{ 
        backgroundColor: `${color}22`,
        border: `2px solid ${color}`,
        boxShadow: animate ? `0 0 ${10 * currentIntensity}px ${color}` : 'none'
      }}
      animate={animate ? {
        scale: [1, 1.05, 1],
        rotate: type === 'Cosmic' ? [0, 360] : 0,
        boxShadow: [
          `0 0 ${10 * currentIntensity}px ${color}`,
          `0 0 ${20 * currentIntensity}px ${color}`,
          `0 0 ${10 * currentIntensity}px ${color}`,
        ]
      } : {}}
      transition={{
        duration: 3 / currentIntensity,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    >
      <Icon className="w-full h-full" style={{ color }} />
      
      {animate && currentIntensity > 2 && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            scale: [1, 1.5],
            opacity: [0.5, 0]
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "easeOut"
          }}
          style={{ border: `1px solid ${color}` }}
        />
      )}
    </motion.div>
  );
};
