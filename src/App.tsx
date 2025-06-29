import React, {useState} from 'react';
import {AnimatePresence} from 'framer-motion';
import AudioMuteToggle from './components/AudioMuteToggle';
import IntroScreen from './components/IntroScreen';
import GameScreen from './components/GameScreen';
import GameOverScreen from './components/GameOverScreen';
import soundManager from "./utils/sound.ts";
import AudioConsentDialog from './components/AudioConsentDialog';

type Screen = 'intro' | 'game' | 'gameover';

function App() {
    const [currentScreen, setCurrentScreen] = useState<Screen>('intro');
    const [finalScore, setFinalScore] = useState(0);
    const [showAudioConsent, setShowAudioConsent] = useState(true);

    const handleIntroComplete = () => {
        soundManager.playGameplaySoundtrack();
        setCurrentScreen('game');
    };

    const handleGameOver = (score: number) => {
        soundManager.playGameOver();
        setFinalScore(score);
        setCurrentScreen('gameover');
    };

    const handleRestart = () => {
        soundManager.playIntroScreen()
        setCurrentScreen('intro');
        setFinalScore(0);
    };

    const handleAudioConsent = () => {
        setShowAudioConsent(false);
        soundManager.playIntroScreen();
    };

    return (
        <div className="w-full h-full relative">
            <AudioMuteToggle/>
            <AnimatePresence>
                {showAudioConsent && (
                    <AudioConsentDialog onContinue={handleAudioConsent} />
                )}
            </AnimatePresence>
            <AnimatePresence mode="wait">
                {currentScreen === 'intro' && (
                    <IntroScreen key="intro" onComplete={handleIntroComplete}/>
                )}
                {currentScreen === 'game' && (
                    <GameScreen key="game" onGameOver={handleGameOver}/>
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