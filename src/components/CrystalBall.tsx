import React from 'react';
import { motion } from 'framer-motion';

interface CrystalBallProps {
  isHolding: boolean;
  holdProgress: number;
  single?: boolean;
}

const CrystalBall: React.FC<CrystalBallProps> = ({ isHolding, holdProgress, single = true }) => {
  const glowIntensity = isHolding ? 0.8 + (holdProgress * 0.4) : 0.3;
  const shakeIntensity = holdProgress * 5;

  return (
    <div className="relative flex justify-center items-center">
      {/* Mystical Base/Pedestal */}
      <div className="absolute -bottom-4 w-24 h-8 bg-gradient-to-t from-yellow-600 to-yellow-400 rounded-full opacity-60 blur-sm" />
      
      {/* Crystal Ball(s) */}
      <div className={`flex ${single ? 'justify-center' : 'justify-center space-x-8'}`}>
        {[...Array(single ? 1 : 2)].map((_, index) => (
          <motion.div
            key={index}
            className="relative"
            animate={{
              x: isHolding ? (Math.random() - 0.5) * shakeIntensity : 0,
              y: isHolding ? (Math.random() - 0.5) * shakeIntensity : 0,
            }}
            transition={{ duration: 0.1 }}
          >
            {/* Outer Glow */}
            <motion.div
              className="absolute inset-0 w-32 h-32 rounded-full"
              style={{
                background: `radial-gradient(circle, rgba(0, 191, 255, ${glowIntensity}) 0%, transparent 70%)`,
                filter: 'blur(8px)',
              }}
              animate={{
                scale: isHolding ? 1.2 + (holdProgress * 0.5) : 1,
              }}
            />
            
            {/* Crystal Ball */}
            <motion.div
              className="relative w-32 h-32 rounded-full cursor-pointer"
              style={{
                background: `radial-gradient(circle at 30% 30%, 
                  rgba(255, 255, 255, 0.8) 0%, 
                  rgba(135, 206, 235, 0.6) 30%, 
                  rgba(0, 191, 255, 0.8) 70%, 
                  rgba(25, 25, 112, 0.9) 100%)`,
                boxShadow: `
                  inset -10px -10px 20px rgba(0, 0, 0, 0.3),
                  inset 10px 10px 20px rgba(255, 255, 255, 0.5),
                  0 0 30px rgba(0, 191, 255, ${glowIntensity})
                `,
              }}
              animate={{
                scale: isHolding ? 1.1 + (holdProgress * 0.2) : 1,
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* Inner Swirling Effect */}
              <motion.div
                className="absolute inset-2 rounded-full opacity-30"
                style={{
                  background: `conic-gradient(from ${holdProgress * 360}deg, 
                    transparent, rgba(255, 255, 255, 0.5), transparent)`,
                }}
                animate={{ rotate: isHolding ? 360 : 0 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              
              {/* Mystical Sparkles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-white rounded-full"
                  style={{
                    top: `${20 + Math.sin(i * 60) * 30}%`,
                    left: `${50 + Math.cos(i * 60) * 30}%`,
                  }}
                  animate={{
                    opacity: [0, 1, 0],
                    scale: [0.5, 1.5, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: 'easeInOut',
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CrystalBall;