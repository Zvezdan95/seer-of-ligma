import React, {useState, useEffect, useCallback} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {Ball, Enemy, Paddle, GameState} from '../types/game';
import {runGameTick} from '../utils/gameLoop';
import {
    getDifficultySettings,
    scaleBallVelocity,
    getEnemySpeed,
    shouldDoubleSpawn,
    BASE_BALL_SPEED,
    BASE_ENEMY_SPEED
} from '../utils/difficulty';

interface GameScreenProps {
    onGameOver: (score: number) => void;
}

const GameScreen: React.FC<GameScreenProps> = ({onGameOver}) => {
    const [gameState, setGameState] = useState<GameState>({
        screen: 'game',
        score: 0,
        lives: 2, // Start with 2 balls
        balls: [],
        enemies: [],
        paddle: {x: 400, width: 120, height: 12, shrinkTime: 0},
        isHolding: false,
        holdProgress: 0,
        gameStartTime: Date.now(),
        currentPhase: {
            name: "The Welcome Zone",
            ballSpeedMultiplier: 1.0,
            enemySpeedMultiplier: 1.0,
            spawnInterval: 3000,
            doubleSpawnChance: 0
        }
    });

    const [explodingPunchlines, setExplodingPunchlines] = useState<Array<{
        id: string;
        text: string;
        x: number;
        y: number;
    }>>([]);

    const [gameContainerRef, setGameContainerRef] = useState<HTMLDivElement | null>(null);
    const [gameScale, setGameScale] = useState(1);
    const [gameOffset, setGameOffset] = useState({x: 0, y: 0});


    // Responsive game dimensions
    const BASE_GAME_WIDTH = 800;
    const BASE_GAME_HEIGHT = 600;
    const BALL_RADIUS = 12;

    // Set-up words and their punchlines
    const ENEMY_PUNCHLINES: Record<string, string> = {
        'Bofa': 'Bofa deez nuts!',
        'Candice': 'Candice nuts fit in your mouth?',
        'Joe': 'Joe Mama!',
        'Sugma': 'Sugma balls!',
        'Dee': 'Deez nuts!',
        'Wendy': "Wendy's nuts slap your face?",
        'Updog': "What's up, dog?",
        'Sawcon': 'Sawcon deez nuts!'
    };

    const ENEMY_SETUPS = Object.keys(ENEMY_PUNCHLINES);

    // Calculate responsive scaling
    useEffect(() => {
        const updateGameScale = () => {
            if (!gameContainerRef) return;

            const container = gameContainerRef;
            const containerRect = container.getBoundingClientRect();

            // FIXED: Use more screen space
            const availableWidth = window.innerWidth - 32; // Account for minimal padding
            const availableHeight = window.innerHeight - 120; // Reduced from 200 to give more space

            // Calculate scale to fit both width and height
            const scaleX = availableWidth / BASE_GAME_WIDTH;
            const scaleY = availableHeight / BASE_GAME_HEIGHT;
            const scale = Math.min(scaleX, scaleY, 1.2); // Allow slight upscaling on large screens

            setGameScale(scale);

            // Calculate centering offset
            const scaledWidth = BASE_GAME_WIDTH * scale;
            const scaledHeight = BASE_GAME_HEIGHT * scale;
            const offsetX = (availableWidth - scaledWidth) / 2;
            const offsetY = Math.max(0, (availableHeight - scaledHeight) / 2);

            setGameOffset({x: offsetX, y: offsetY});
        };

        updateGameScale();
        window.addEventListener('resize', updateGameScale);
        return () => window.removeEventListener('resize', updateGameScale);
    }, [gameContainerRef]);

    // Function to create random velocity
    const createRandomVelocity = (goesUp = false, speedMultiplier = 1) => {
        const baseSpeed = BASE_BALL_SPEED * speedMultiplier;
        // Limit the angle to prevent balls from going too vertically or horizontally
        const angle = (Math.PI / 6) + (Math.random() * Math.PI / 6); // 30-60 degree range

        const vx = Math.cos(angle) * baseSpeed * (Math.random() < 0.5 ? 1 : -1);
        const vy = Math.sin(angle) * baseSpeed * (goesUp ? -1 : 1); // Controls up/down

        return {vx, vy};
    };

    // Initialize balls with randomized launch angles
    useEffect(() => {
        const difficulty = getDifficultySettings(gameState.gameStartTime);
        const velocity1 = createRandomVelocity(true, difficulty.phase.ballSpeedMultiplier); // This ball goes UP
        const velocity2 = createRandomVelocity(false, difficulty.phase.ballSpeedMultiplier); // This ball goes DOWN

        setGameState(prev => ({
            ...prev,
            balls: [
                {
                    id: 'ball1',
                    x: BASE_GAME_WIDTH * 0.4, // Left ball position
                    y: BASE_GAME_HEIGHT * 0.5,
                    vx: velocity1.vx,
                    vy: velocity1.vy,
                    radius: BALL_RADIUS,
                },
                {
                    id: 'ball2',
                    x: BASE_GAME_WIDTH * 0.6, // Right ball position
                    y: BASE_GAME_HEIGHT * 0.5,
                    vx: velocity2.vx,
                    vy: velocity2.vy,
                    radius: BALL_RADIUS,
                },
            ],
        }));
    }, []);

    // Update difficulty settings periodically
    useEffect(() => {
        const difficultyUpdater = setInterval(() => {
            const difficulty = getDifficultySettings(gameState.gameStartTime);
            setGameState(prev => ({
                ...prev,
                currentPhase: difficulty.phase
            }));
        }, 1000); // Update every second

        return () => clearInterval(difficultyUpdater);
    }, [gameState.gameStartTime]);

    // Enhanced game loop using extracted runGameTick function
    useEffect(() => {
        const gameLoop = setInterval(() => {
            setGameState(prev => {
                const newState = runGameTick(
                    prev,
                    setExplodingPunchlines,
                    ENEMY_PUNCHLINES
                );

                // Check for game over (no balls left)
                if (newState.balls.length === 0) {
                    onGameOver(newState.score);
                    return newState;
                }

                return newState;
            });
        }, 16); // ~60fps

        return () => clearInterval(gameLoop);
    }, [onGameOver, gameState.gameStartTime]);

    // Clean up exploding punchlines
    useEffect(() => {
        const cleanup = setInterval(() => {
            setExplodingPunchlines(prev =>
                prev.filter(p => Date.now() - parseInt(p.id.split('-')[1]) < 800)
            );
        }, 100);

        return () => clearInterval(cleanup);
    }, []);

    // Spawn enemies with dynamic difficulty
    useEffect(() => {
        const spawnEnemy = () => {
            const difficulty = getDifficultySettings(gameState.gameStartTime);
            const enemiesCount = shouldDoubleSpawn(difficulty.phase.doubleSpawnChance) ? 2 : 1;

            const newEnemies: Enemy[] = [];
            for (let i = 0; i < enemiesCount; i++) {
                newEnemies.push({
                    id: `${Date.now()}-${i}`,
                    text: ENEMY_SETUPS[Math.floor(Math.random() * ENEMY_SETUPS.length)],
                    x: Math.random() * (BASE_GAME_WIDTH - 100) + 50,
                    y: -30 - (i * 40), // Offset multiple enemies vertically
                    speed: BASE_ENEMY_SPEED,
                });
            }

            setGameState(prev => ({
                ...prev,
                enemies: [...prev.enemies, ...newEnemies],
            }));
        };

        const difficulty = getDifficultySettings(gameState.gameStartTime);
        const enemySpawner = setInterval(spawnEnemy, difficulty.phase.spawnInterval);

        return () => clearInterval(enemySpawner);
    }, [gameState.gameStartTime, gameState.currentPhase.spawnInterval]);

    // ENHANCED: More sensitive global mouse controls for PC
    const handleGlobalMouseMove = useCallback((e: MouseEvent) => {
        if (!gameContainerRef) return;

        // ENHANCED SENSITIVITY: Apply a sensitivity multiplier to make paddle more responsive
        const SENSITIVITY_MULTIPLIER = 1.5; // Increase this to make paddle more sensitive

        // Calculate paddle position based on mouse X relative to entire window
        const windowWidth = window.innerWidth;
        const mouseXPercent = e.clientX / windowWidth; // 0 to 1

        // Apply sensitivity enhancement - make small mouse movements create larger paddle movements
        const centerOffset = mouseXPercent - 0.5; // -0.5 to 0.5
        const enhancedOffset = centerOffset * SENSITIVITY_MULTIPLIER; // Apply sensitivity
        const enhancedMouseXPercent = Math.max(0, Math.min(1, 0.5 + enhancedOffset)); // Clamp to 0-1

        // Map to game coordinates
        const paddleX = enhancedMouseXPercent * BASE_GAME_WIDTH;

        setGameState(prev => ({
            ...prev,
            paddle: {
                ...prev.paddle,
                x: Math.max(0, Math.min(BASE_GAME_WIDTH - prev.paddle.width, paddleX - prev.paddle.width / 2)),
            },
        }));
    }, [gameContainerRef]);

    // FIXED: Touch controls for mobile - only within game area
    const handleTouchMove = useCallback((e: React.TouchEvent) => {
        if (!gameContainerRef) return;

        e.preventDefault(); // Prevent scrolling
        const rect = gameContainerRef.getBoundingClientRect();
        const touch = e.touches[0];
        const clientX = touch.clientX - rect.left - gameOffset.x;
        const x = clientX / gameScale;

        setGameState(prev => ({
            ...prev,
            paddle: {
                ...prev.paddle,
                x: Math.max(0, Math.min(BASE_GAME_WIDTH - prev.paddle.width, x - prev.paddle.width / 2)),
            },
        }));
    }, [gameScale, gameOffset.x, gameContainerRef]);

    // FIXED: Add global mouse listener for PC
    useEffect(() => {
        // Only add global mouse listener on non-touch devices
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        if (!isTouchDevice) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            return () => document.removeEventListener('mousemove', handleGlobalMouseMove);
        }
    }, [handleGlobalMouseMove]);

    // Calculate elapsed time for display
    const elapsedSeconds = Math.floor((Date.now() - gameState.gameStartTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;

    return (
        <div className="min-h-screen bg-gradient-to-b from-indigo-900 to-purple-900 flex flex-col overflow-hidden">
            {/* FIXED: Compact UI Header */}
            <div
                className="flex-1 relative touch-none select-none flex items-center justify-center px-4"
                style={{
                    minHeight: 0, // Allow flex shrinking
                }}
            >
                <div className="w-full px-4 py-2 flex-shrink-0"
                     style={{
                         width: BASE_GAME_WIDTH * gameScale,
                         maxWidth: '100%',
                     }}>
                    <div
                        className="flex flex-col sm:flex-row justify-between items-center gap-2 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div>
                                <h2 className="text-lg sm:text-xl font-bold text-white">Score: {gameState.score}</h2>
                                <div className="text-purple-300 text-xs sm:text-sm">
                                    Time: {minutes}:{seconds.toString().padStart(2, '0')}
                                </div>
                            </div>

                            <div className="text-center">
                                <div
                                    className="text-yellow-400 font-bold text-sm sm:text-base">{gameState.currentPhase.name}</div>
                                <div className="text-purple-300 text-xs">
                                    Speed: {gameState.currentPhase.ballSpeedMultiplier.toFixed(1)}x |
                                    Spawn: {(gameState.currentPhase.spawnInterval / 1000).toFixed(1)}s
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-purple-300 text-md pb-px">Balls:</span>
                            <div
                                 className={`w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full shadow-lg transition-opacity duration-500 ${gameState.lives >= 1 ? "opacity-100" : "opacity-0"}`}
                                 style={{boxShadow: '0 0 10px rgba(59, 130, 246, 0.6)'}}/>
                            <div
                                 className={`w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full shadow-lg transition-opacity duration-500 ${gameState.lives >= 2 ? "opacity-100" : "opacity-0"}`}

                                 style={{boxShadow: '0 0 10px rgba(59, 130, 246, 0.6)'}}/>
                            {/*{[...Array(gameState.lives)].map((_, i) => (*/}
                            {/*    <div key={i}*/}
                            {/*         className="w-3 h-3 sm:w-4 sm:h-4 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full shadow-lg"*/}
                            {/*         style={{boxShadow: '0 0 10px rgba(59, 130, 246, 0.6)'}}/>*/}
                            {/*))}*/}
                        </div>
                    </div>
                </div>
            </div>

            {/* FIXED: Expanded Game Container */}
            <div
                ref={setGameContainerRef}
                className="flex-1 relative touch-none select-none flex items-center justify-center px-4"
                style={{
                    minHeight: 0, // Allow flex shrinking
                }}
            >
                {/* FIXED: Full-size Game Area */}
                <div
                    className="relative bg-black border-2 sm:border-4 border-purple-400 overflow-hidden cursor-none"
                    style={{
                        width: BASE_GAME_WIDTH * gameScale,
                        height: BASE_GAME_HEIGHT * gameScale,
                        maxWidth: '100%',
                        maxHeight: '100%',
                    }}
                    onTouchMove={handleTouchMove}
                    onTouchStart={(e) => e.preventDefault()}
                >
                    {/* Background Grid */}
                    <div className="absolute inset-0 opacity-10">
                        {[...Array(20)].map((_, i) => (
                            <div key={i} className="absolute border-purple-300"
                                 style={{
                                     left: `${i * 5}%`,
                                     top: 0,
                                     width: '1px',
                                     height: '100%'
                                 }}/>
                        ))}
                    </div>

                    {/* Balls with responsive scaling */}
                    <AnimatePresence>
                        {gameState.balls.map(ball => (
                            <motion.div
                                key={ball.id}
                                className="absolute bg-gradient-to-br from-blue-400 to-purple-600 rounded-full shadow-lg"
                                style={{
                                    left: (ball.x - ball.radius) * gameScale,
                                    top: (ball.y - ball.radius) * gameScale,
                                    width: ball.radius * 2 * gameScale,
                                    height: ball.radius * 2 * gameScale,
                                    boxShadow: `0 0 ${(15 + (gameState.currentPhase.ballSpeedMultiplier * 5)) * gameScale}px rgba(59, 130, 246, ${0.6 + (gameState.currentPhase.ballSpeedMultiplier * 0.2)})`,
                                }}
                                animate={{
                                    scale: [1, 1.05 + (gameState.currentPhase.ballSpeedMultiplier * 0.05), 1],
                                }}
                                transition={{
                                    duration: 0.3 / gameState.currentPhase.ballSpeedMultiplier,
                                    repeat: Infinity,
                                }}
                            />
                        ))}
                    </AnimatePresence>

                    {/* Enemies with responsive scaling */}
                    <AnimatePresence>
                        {gameState.enemies.map(enemy => (
                            <motion.div
                                key={enemy.id}
                                className="absolute bg-red-500 text-white px-2 py-1 rounded-full text-xs sm:text-sm font-bold border border-red-300"
                                style={{
                                    left: (enemy.x - 40) * gameScale,
                                    top: (enemy.y - 15) * gameScale,
                                    width: 80 * gameScale,
                                    fontSize: `${12 * gameScale}px`,
                                    textAlign: 'center',
                                }}
                                initial={{opacity: 0, scale: 0}}
                                animate={{opacity: 1, scale: 1}}
                                exit={{opacity: 0, scale: 0}}
                            >
                                {enemy.text}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Exploding Punchlines with responsive scaling */}
                    <AnimatePresence>
                        {explodingPunchlines.map(punchline => (
                            <motion.div
                                key={punchline.id}
                                className="absolute bg-yellow-400 text-black px-2 py-1 rounded-lg font-bold border border-yellow-600 z-10"
                                style={{
                                    left: (punchline.x - 80) * gameScale,
                                    top: (punchline.y - 20) * gameScale,
                                    width: 160 * gameScale,
                                    fontSize: `${14 * gameScale}px`,
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis'
                                }}
                                initial={{opacity: 0, scale: 0.5}}
                                animate={{
                                    opacity: [0, 1, 1, 0],
                                    scale: [0.5, 1.2, 1.2, 0],
                                    y: [0, -20, -20, -40]
                                }}
                                exit={{opacity: 0, scale: 0}}
                                transition={{duration: 0.8}}
                            >
                                {punchline.text}
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {/* Paddle with responsive scaling */}
                    <motion.div
                        className="absolute bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full"
                        style={{
                            left: gameState.paddle.x * gameScale,
                            top: (BASE_GAME_HEIGHT - 80) * gameScale,
                            width: 120 * gameScale,
                            height: gameState.paddle.height * gameScale,
                            transformOrigin: 'center',
                            boxShadow: gameState.paddle.width < 120 ?
                                `0 0 ${15 * gameScale}px rgba(239, 68, 68, 0.8)` :
                                `0 0 ${15 * gameScale}px rgba(251, 191, 36, 0.8)`
                        }}
                        animate={{
                            scaleX: gameState.paddle.width / 120,
                        }}
                        transition={{duration: 0.3, ease: 'easeOut'}}
                    />

                    {/* Paddle Shrink Warning */}
                    {gameState.paddle.width < 120 && (
                        <motion.div
                            className="absolute top-2 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-2 py-1 rounded-lg font-bold text-xs sm:text-sm"
                            animate={{opacity: [1, 0.5, 1]}}
                            transition={{duration: 0.5, repeat: Infinity}}
                        >
                            Paddle Shrunk!
                        </motion.div>
                    )}

                    {/* Difficulty Phase Transition */}
                    {gameState.currentPhase.name !== "The Welcome Zone" && (
                        <motion.div
                            className="absolute top-8 sm:top-16 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-600 to-red-600 text-white px-3 py-1 rounded-lg font-bold text-center shadow-lg text-xs sm:text-sm"
                            initial={{opacity: 0, y: -20, scale: 0.8}}
                            animate={{opacity: 0.9, y: 0, scale: 1}}
                            transition={{duration: 0.5, ease: 'backOut'}}
                        >
                            <div className="text-xs sm:text-sm">{gameState.currentPhase.name}</div>
                            <div className="text-xs opacity-75">
                                {gameState.currentPhase.ballSpeedMultiplier > 1.5 ? "MAXIMUM CHAOS!" : "Difficulty Increased!"}
                            </div>
                        </motion.div>
                    )}

                </div>
            </div>

            {/* FIXED: Compact Mobile-friendly Instructions */}
            <div className="px-4 py-2 text-center text-purple-300 text-xs sm:text-sm flex-shrink-0">
                <div className="sm:hidden">Touch and drag to move the paddle</div>
                <div className="hidden sm:block">Move mouse anywhere to control the paddle</div>
                <div>Keep the balls in play • Hit the setup words to reveal punchlines!</div>
            </div>
        </div>
    );
};

export default GameScreen;