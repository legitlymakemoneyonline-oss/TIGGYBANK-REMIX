import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Badge } from './Badge';
import { BADGE_MAP } from '../constants';

interface LevelUpOverlayProps {
  level: number;
  onComplete: () => void;
}

export const LevelUpOverlay: React.FC<LevelUpOverlayProps> = ({ level, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.5, y: 50, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 15 }}
          className="text-center"
        >
          <motion.div
            animate={{ 
              rotateY: [0, 360],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="mb-6 flex justify-center"
          >
            <Badge type={BADGE_MAP[level]} size="xl" />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-4xl font-bold text-white mb-2"
          >
            LEVEL UP!
          </motion.h2>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-xl text-gray-300"
          >
            You are now Level {level}
          </motion.p>
          
          <motion.div
            className="mt-8 flex justify-center gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-yellow-400"
                animate={{
                  y: [0, -100 - Math.random() * 200],
                  x: [0, (Math.random() - 0.5) * 400],
                  opacity: [1, 0],
                  scale: [1, 0]
                }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
            ))}
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
