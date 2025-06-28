import React, { useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import IntroScreen from './components/IntroScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';

type Screen = 'intro' | 'game' | 'gameover';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('intro');
  const [finalScore, setFinalScore] = useState(0);

  const handleIntroComplete = () => {
    setCurrentScreen('game');
  };

  const handleGameOver = (score: number) => {
    setFinalScore(score);
    setCurrentScreen('gameover');
  };

  const handleRestart = () => {
    setCurrentScreen('intro');
    setFinalScore(0);
  };

  return (
    <div className="w-full h-full">
      <AnimatePresence mode="wait">
        {currentScreen === 'intro' && (
          <IntroScreen key="intro" onComplete={handleIntroComplete} />
        )}
        {currentScreen === 'game' && (
          <GameScreen key="game" onGameOver={handleGameOver} />
        )}
        {currentScreen === 'gameover' && (
          <GameOverScreen 
            key="gameover" 
            score={finalScore} 
            onRestart={handleRestart} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;