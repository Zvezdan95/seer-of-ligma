import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CrystalBall from './CrystalBall';
import soundManager from "../utils/sound.ts";

interface IntroScreenProps {
    onComplete: () => void;
}

const IntroScreen: React.FC<IntroScreenProps> = ({ onComplete }) => {
    const [isHolding, setIsHolding] = useState(false);
    const [holdProgress, setHoldProgress] = useState(0);
    const [showTransition, setShowTransition] = useState(false);
    const [transitionPhase, setTransitionPhase] = useState(0);

    const HOLD_DURATION = 5000; // 5 seconds

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (isHolding && holdProgress < 1) {
            soundManager.playBallPressed();
            interval = setInterval(() => {
                setHoldProgress(prev => {
                    const newProgress = prev + (100 / HOLD_DURATION);

                    if (newProgress >= 1) {
                        setShowTransition(true);
                        return 1;
                    }

                    return newProgress;
                });
            }, 100);
        }

        return () => clearInterval(interval);
    }, [isHolding, holdProgress]);

    useEffect(() => {
        if (showTransition) {
            soundManager.playIntroScreen();
            soundManager.playLigmaBalls();
            const sequence = async () => {

                setTransitionPhase(1);
                await new Promise(resolve => setTimeout(resolve, 1000));

                // Phase 2: Scale up "Ligma"
                setTransitionPhase(2);
                await new Promise(resolve => setTimeout(resolve, 500));

                // Phase 3: Split crystal ball and show "BALLS"
                setTransitionPhase(3);
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Phase 4: Fade text, shrink balls to game size
                setTransitionPhase(4);
                await new Promise(resolve => setTimeout(resolve, 1000));

                onComplete();
            };

            sequence();
        }
    }, [showTransition, onComplete]);

    const handleMouseDown = () => setIsHolding(true);
    const handleMouseUp = () => {
        setIsHolding(false);
        setHoldProgress(0);
    };

    const handleTouchStart = () => setIsHolding(true);
    const handleTouchEnd = () => {
        setIsHolding(false);
        setHoldProgress(0);
        soundManager.playIntroScreen();
    };

    return (
        <div
            className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-black flex flex-col items-center justify-center relative overflow-hidden">
            {/* Animated Background Stars */}
            {[...Array(50)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{
                        top: `${Math.random() * 100}%`,
                        left: `${Math.random() * 100}%`,
                    }}
                    animate={{
                        opacity: [0.3, 1, 0.3],
                        scale: [0.5, 1.5, 0.5],
                    }}
                    transition={{
                        duration: 3 + Math.random() * 2,
                        repeat: Infinity,
                        delay: Math.random() * 2,
                    }}
                />
            ))}

            {/* Screen Shake Effect */}
            <motion.div
                className="w-full h-full flex flex-col items-center justify-center relative"
                animate={{
                    x: isHolding ? (Math.random() - 0.5) * holdProgress * 10 : 0,
                    y: isHolding ? (Math.random() - 0.5) * holdProgress * 10 : 0,
                }}
                transition={{ duration: 0.1 }}
            >
                {/* Title */}
                <AnimatePresence>
                    {!showTransition && (
                        <motion.div
                            className="text-center mb-16"
                            exit={{ opacity: 0, y: -50 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h1 className="text-6xl md:text-8xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-purple-300 to-blue-400 mb-4 pb-4 font-serif">
                                The Seer of Ligma
                            </h1>
                            <p className="text-purple-300 text-lg md:text-xl opacity-75">
                                Hold the crystal ball to reveal your destiny...
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Transition Sequence */}
                <AnimatePresence>
                    {showTransition && (
                        <motion.div
                            className="text-center mb-16"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            {/* Phase 1: Remove "The Seer of " */}
                            {transitionPhase >= 1 && (
                                <motion.div
                                    className="text-5xl md:text-8xl font-bold font-serif"
                                    initial={{ opacity: 1 }}
                                    animate={transitionPhase >= 2 ? {
                                        scale: [1, 2.5],
                                        y: [0, -50],
                                    } : {}}
                                    transition={{ duration: 0.8, ease: 'easeOut' }}
                                >
                                    <motion.span
                                        className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500"
                                        animate={transitionPhase >= 2 ? {
                                            textShadow: '0 0 20px rgba(255, 215, 0, 0.8)'
                                        } : {}}
                                    >
                                        LIGMA
                                    </motion.span>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* FIXED: Crystal Ball with proper size maintenance */}
                <motion.div
                    className="relative cursor-pointer select-none"
                    onMouseDown={handleMouseDown}
                    onMouseUp={() => {
                        soundManager.playIntroScreen();
                        handleMouseUp()
                    }}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                >
                    {/* FIXED: Animated crystal ball splitting that maintains size */}
                    <AnimatePresence mode="wait">
                        {transitionPhase < 3 ? (
                            <motion.div
                                key="single-ball"
                                initial={{ scale: 1 }}
                                exit={{
                                    scale: 0,
                                    opacity: 0,
                                }}
                                transition={{ duration: 0.3 }}
                            >
                                <CrystalBall
                                    isHolding={isHolding}
                                    holdProgress={holdProgress}
                                    single={true}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="double-balls"
                                className="flex justify-center items-center"
                                initial={{
                                    scale: 0,
                                    opacity: 0,
                                }}
                                animate={{
                                    scale: transitionPhase >= 4 ? 0.3 : 1, // FIXED: Scale down to game size in phase 4
                                    opacity: transitionPhase >= 4 ? 0 : 1,
                                }}
                                transition={{
                                    duration: transitionPhase >= 4 ? 0.8 : 0.5,
                                    ease: transitionPhase >= 4 ? 'easeInOut' : 'backOut'
                                }}
                            >
                                {/* Left Ball */}
                                <motion.div
                                    initial={{ x: 0 }}
                                    animate={{ x: -40 }} // Increased separation for better visual
                                    transition={{
                                        duration: 0.6,
                                        ease: 'easeOut'
                                    }}
                                >
                                    <CrystalBall
                                        isHolding={false}
                                        holdProgress={0}
                                        single={true}
                                    />
                                </motion.div>

                                {/* Right Ball */}
                                <motion.div
                                    initial={{ x: 0 }}
                                    animate={{ x: 40 }} // Increased separation for better visual
                                    transition={{
                                        duration: 0.6,
                                        ease: 'easeOut'
                                    }}
                                >
                                    <CrystalBall
                                        isHolding={false}
                                        holdProgress={0}
                                        single={true}
                                    />
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Progress Indicator */}
                    {isHolding && !showTransition && (
                        <motion.div
                            className="absolute -bottom-12 left-1/2 transform -translate-x-1/2"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                        >
                            <div className="w-48 h-5 bg-purple-800 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-400 to-purple-400"
                                    style={{ width: `${holdProgress * 100}%` }}
                                />
                            </div>
                        </motion.div>
                    )}
                </motion.div>

                {/* "BALLS" Reveal */}
                <AnimatePresence>
                    {transitionPhase >= 3 && (
                        <motion.div
                            className="mt-8"
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: transitionPhase >= 4 ? 0 : 1,
                                scale: [0, 1.5, 1],
                            }}
                            transition={{
                                duration: transitionPhase >= 4 ? 0.5 : 0.8,
                                ease: 'easeOut'
                            }}
                        >
                            <h2 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                                BALLS!
                            </h2>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Instructions */}
                {!showTransition && (
                    <motion.p
                        className="text-purple-300 text-center absolute -bottom-12 text-sm  opacity-60"
                        animate={{ opacity: [0.4, 0.8, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        {isHolding ? 'Keep holding...' : 'Click and hold the crystal ball'}
                    </motion.p>
                )}
            </motion.div>
        </div>
    );
};

export default IntroScreen;