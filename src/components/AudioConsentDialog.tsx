import React from 'react';
import { motion } from 'framer-motion';
import { Volume2, AlertTriangle } from 'lucide-react';

interface AudioConsentDialogProps {
  onContinue: () => void;
}

const AudioConsentDialog: React.FC<AudioConsentDialogProps> = ({ onContinue }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <motion.div
        className="bg-gradient-to-br from-purple-900 via-indigo-900 to-black rounded-2xl p-8 max-w-md w-full border border-purple-500 shadow-2xl"
        initial={{ opacity: 0, scale: 0.8, y: 50 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'backOut' }}
      >
        {/* Mystical Header */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-center mb-4">
            <motion.div
              className="relative"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              <AlertTriangle className="text-yellow-400 mr-3" size={32} />
            </motion.div>
            <Volume2 className="text-purple-300" size={32} />
          </div>
          
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-300 to-blue-400 mb-2">
            Audio Warning
          </h2>
        </motion.div>

        {/* Warning Message */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-purple-200 text-lg leading-relaxed mb-4">
            The Seer of Ligma may expose profound facts about the future.
          </p>
          <p className="text-purple-300 text-sm opacity-75">
            This experience includes audio effects and music. Are you sure you want to proceed?
          </p>
        </motion.div>

        {/* Mystical Effects */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-purple-400 rounded-full"
              style={{
                top: `${20 + Math.sin(i * 60) * 30}%`,
                left: `${20 + Math.cos(i * 60) * 60}%`,
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
        </div>

        {/* Continue Button */}
        <motion.button
          onClick={onContinue}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all shadow-lg border border-purple-400"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-center">
            <Volume2 className="mr-2" size={20} />
            Continue
          </div>
        </motion.button>

        {/* Subtle disclaimer */}
        <motion.p
          className="text-purple-400 text-xs text-center mt-4 opacity-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.8 }}
        >
          You can mute audio at any time using the button in the top-right corner
        </motion.p>
      </motion.div>
    </div>
  );
};

export default AudioConsentDialog;