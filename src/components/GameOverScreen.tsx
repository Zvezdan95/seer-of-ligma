import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, RotateCcw, Crown, Star, TrendingUp } from 'lucide-react';
import { getTopScores, submitHighScore, getUserTopScores, getUserRank } from '../utils/supabase';
import { HighScore } from '../types/game';

interface GameOverScreenProps {
  score: number;
  onRestart: () => void;
}

interface LeaderboardData {
  globalTop5: HighScore[];
  userTop5: HighScore[];
  userRank: number;
}

const GameOverScreen: React.FC<GameOverScreenProps> = ({ score, onRestart }) => {
  const [username, setUsername] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>({
    globalTop5: [],
    userTop5: [],
    userRank: 0
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    const globalTop5 = await getTopScores(5);
    setLeaderboardData(prev => ({
      ...prev,
      globalTop5
    }));
    setLoading(false);
  };

  const loadUserData = async (submittedUsername: string) => {
    const [userTop5, userRank] = await Promise.all([
      getUserTopScores(submittedUsername, 5),
      getUserRank(submittedUsername, score)
    ]);

    setLeaderboardData(prev => ({
      ...prev,
      userTop5,
      userRank
    }));
  };

  const handleSubmit = async () => {
    if (!username.trim() || submitted || submitting) return;
    
    setSubmitting(true);
    const success = await submitHighScore(username.trim(), score);
    
    if (success) {
      setSubmitted(true);
      // Reload global leaderboard and load user-specific data
      const globalTop5 = await getTopScores(5);
      setLeaderboardData(prev => ({
        ...prev,
        globalTop5
      }));
      await loadUserData(username.trim());
    }
    setSubmitting(false);
  };

  // FIXED: Check if score qualifies for submission (not just top 5)
  const qualifiesForSubmission = score > 0;
  const isHighScore = score > 0 && (leaderboardData.globalTop5.length < 5 || score > Math.min(...leaderboardData.globalTop5.map(s => s.score)));

  const formatScore = (score: number) => score.toLocaleString();

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-indigo-900 to-black flex items-center justify-center p-4">
      <motion.div
        className="bg-gray-900 bg-opacity-90 backdrop-blur-lg rounded-2xl p-8 max-w-4xl w-full text-center border border-purple-500 shadow-2xl"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Game Over Title */}
        <motion.h1
          className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-4"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          GAME OVER
        </motion.h1>

        {/* Score */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <p className="text-purple-300 text-lg mb-2">Final Score</p>
          <p className="text-5xl font-bold text-yellow-400">{formatScore(score)}</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Left Column: Score Submission & Global Leaderboard */}
          <div className="space-y-6">
            {/* FIXED: Score Submission for ANY score > 0 */}
            {qualifiesForSubmission && !submitted && (
              <motion.div
                className={`${isHighScore ? 
                  'bg-gradient-to-r from-yellow-900 to-orange-900 border-yellow-500' : 
                  'bg-gradient-to-r from-blue-900 to-indigo-900 border-blue-500'
                } bg-opacity-50 rounded-xl p-6 border`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="flex items-center justify-center mb-4">
                  {isHighScore ? (
                    <>
                      <Crown className="text-yellow-400 mr-2" size={28} />
                      <p className="text-yellow-400 font-bold text-xl">New High Score!</p>
                    </>
                  ) : (
                    <>
                      <Star className="text-blue-400 mr-2" size={28} />
                      <p className="text-blue-400 font-bold text-xl">Submit Your Score!</p>
                    </>
                  )}
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Enter your Reddit username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className={`w-full px-4 py-3 bg-gray-800 border ${isHighScore ? 'border-yellow-500 focus:ring-yellow-400' : 'border-blue-500 focus:ring-blue-400'} rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 text-center`}
                    maxLength={20}
                    disabled={submitting}
                  />
                  <button
                    onClick={handleSubmit}
                    disabled={!username.trim() || submitting}
                    className={`w-full ${isHighScore ? 
                      'bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700' : 
                      'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'
                    } text-white font-bold py-3 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center`}
                  >
                    {submitting ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Trophy className="mr-2" size={20} />
                        Submit Score
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Success Message */}
            {submitted && (
              <motion.div
                className="bg-gradient-to-r from-green-900 to-emerald-900 bg-opacity-50 rounded-xl p-6 border border-green-500"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center justify-center mb-2">
                  <Star className="text-green-400 mr-2" size={24} />
                  <p className="text-green-400 font-bold">Score Submitted Successfully!</p>
                </div>
                {leaderboardData.userRank > 0 && (
                  <p className="text-green-300 text-sm">
                    Your score of {formatScore(score)} is rank #{leaderboardData.userRank} on the global leaderboard!
                  </p>
                )}
              </motion.div>
            )}

            {/* Global Top 5 Leaderboard */}
            <motion.div
              className="bg-gradient-to-r from-purple-900 to-indigo-900 bg-opacity-50 rounded-xl p-6 border border-purple-500"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
            >
              <div className="flex items-center justify-center mb-4">
                <Trophy className="text-purple-300 mr-2" size={24} />
                <h3 className="text-xl font-bold text-purple-300">🏆 Global Top 5</h3>
              </div>
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-400"></div>
                </div>
              ) : (
                <div className="space-y-2">
                  {leaderboardData.globalTop5.slice(0, 5).map((scoreEntry, index) => (
                    <div
                      key={`global-${index}`}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        index === 0 ? 'bg-gradient-to-r from-yellow-900 to-yellow-800 bg-opacity-60 border border-yellow-500' :
                        index === 1 ? 'bg-gradient-to-r from-gray-700 to-gray-600 bg-opacity-60 border border-gray-400' :
                        index === 2 ? 'bg-gradient-to-r from-orange-900 to-orange-800 bg-opacity-60 border border-orange-500' :
                        'bg-purple-900 bg-opacity-30 border border-purple-600'
                      }`}
                    >
                      <span className="flex items-center">
                        <span className={`font-bold mr-3 text-lg ${
                          index === 0 ? 'text-yellow-300' :
                          index === 1 ? 'text-gray-300' :
                          index === 2 ? 'text-orange-300' :
                          'text-purple-300'
                        }`}>
                          #{index + 1}
                        </span>
                        <span className="text-white font-medium">{scoreEntry.username}</span>
                      </span>
                      <span className="text-yellow-400 font-bold text-lg">{formatScore(scoreEntry.score)}</span>
                    </div>
                  ))}
                  {leaderboardData.globalTop5.length === 0 && (
                    <p className="text-gray-400 text-center py-4">No scores yet. Be the first!</p>
                  )}
                </div>
              )}
            </motion.div>
          </div>

          {/* Right Column: User's Personal Stats */}
          <div className="space-y-6">
            {/* User's Personal Top 5 */}
            {submitted && leaderboardData.userTop5.length > 0 && (
              <motion.div
                className="bg-gradient-to-r from-blue-900 to-cyan-900 bg-opacity-50 rounded-xl p-6 border border-blue-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
              >
                <div className="flex items-center justify-center mb-4">
                  <TrendingUp className="text-blue-300 mr-2" size={24} />
                  <h3 className="text-xl font-bold text-blue-300">Your Top 5 Scores</h3>
                </div>
                <div className="space-y-2">
                  {leaderboardData.userTop5.map((scoreEntry, index) => (
                    <div
                      key={`user-${index}`}
                      className={`flex justify-between items-center p-3 rounded-lg ${
                        scoreEntry.score === score ? 
                        'bg-gradient-to-r from-green-800 to-emerald-800 bg-opacity-60 border border-green-400' :
                        'bg-blue-900 bg-opacity-30 border border-blue-600'
                      }`}
                    >
                      <span className="flex items-center">
                        <span className="text-blue-300 font-bold mr-3">#{index + 1}</span>
                        {scoreEntry.score === score && (
                          <span className="text-green-400 text-sm mr-2">NEW!</span>
                        )}
                      </span>
                      <span className="text-yellow-400 font-bold">{formatScore(scoreEntry.score)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Rank Display */}
            {submitted && leaderboardData.userRank > 0 && (
              <motion.div
                className="bg-gradient-to-r from-emerald-900 to-teal-900 bg-opacity-50 rounded-xl p-6 border border-emerald-500"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 }}
              >
                <div className="text-center">
                  <div className="text-4xl font-bold text-emerald-400 mb-2">
                    #{leaderboardData.userRank}
                  </div>
                  <p className="text-emerald-300 text-lg font-medium">
                    Global Rank
                  </p>
                  <p className="text-emerald-200 text-sm mt-2">
                    Your score of {formatScore(score)} ranks #{leaderboardData.userRank} worldwide!
                  </p>
                </div>
              </motion.div>
            )}

            {/* FIXED: Encouragement for non-high scores but still show if they can submit */}
            {!submitted && qualifiesForSubmission && !isHighScore && leaderboardData.globalTop5.length > 0 && (
              <motion.div
                className="bg-gradient-to-r from-indigo-900 to-purple-900 bg-opacity-50 rounded-xl p-6 border border-indigo-500"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-center">
                  <TrendingUp className="text-indigo-400 mx-auto mb-3" size={32} />
                  <p className="text-indigo-300 font-medium mb-2">Keep Practicing!</p>
                  <p className="text-indigo-200 text-sm">
                    You need {formatScore(Math.min(...leaderboardData.globalTop5.map(s => s.score)) - score + 1)} more points to reach the top 5!
                  </p>
                  <p className="text-indigo-200 text-xs mt-2">
                    But you can still submit your score to track your progress!
                  </p>
                </div>
              </motion.div>
            )}

            {/* Show if score is 0 or negative */}
            {!qualifiesForSubmission && (
              <motion.div
                className="bg-gradient-to-r from-gray-800 to-gray-700 bg-opacity-50 rounded-xl p-6 border border-gray-600"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <div className="text-center">
                  <TrendingUp className="text-gray-400 mx-auto mb-3" size={32} />
                  <p className="text-gray-300 font-medium mb-2">Try Again!</p>
                  <p className="text-gray-400 text-sm">
                    Score some points to submit to the leaderboard!
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Restart Button */}
        <motion.button
          onClick={onRestart}
          className="flex items-center justify-center w-full max-w-md mx-auto bg-gradient-to-r from-green-600 to-blue-600 text-white font-bold py-4 px-8 rounded-xl hover:from-green-700 hover:to-blue-700 transition-all shadow-lg"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <RotateCcw className="mr-3" size={24} />
          Play Again
        </motion.button>

        {/* Fun Message */}
        <motion.p
          className="text-purple-300 text-sm mt-6 opacity-75"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          You got ligma'd! 😄 Thanks for playing!
        </motion.p>
      </motion.div>
    </div>
  );
};

export default GameOverScreen;