import { createClient } from '@supabase/supabase-js';
import { HighScore } from '../types/game';

// Real Supabase credentials
const supabaseUrl = 'https://ivaiacgqwatkujvyrntd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml2YWlhY2dxd2F0a3VqdnlybnRkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3NzUzMTEsImV4cCI6MjA2NjM1MTMxMX0.vkd0D4BPCnDahKcr2pPo7PUMP_MO8OeON1VTthe-zKM';

// Create the real Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Security function to create checksum (matches server-side logic)
async function createChecksum(score: number, username: string): Promise<string> {
  const secret = 'default-secret-key'; // This should match the server's default
  const data = new TextEncoder().encode(`${score}-${username}-${secret}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export const getHighScores = async (): Promise<HighScore[]> => {
  try {
    const { data, error } = await supabase
      .from('high_scores')
      .select('*')
      .order('score', { ascending: false })
      .order('created_at', { ascending: true }) // FIXED: Earlier submissions get better rank for ties
      .limit(10);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching high scores:', error);
    return [];
  }
};

export const getTopScores = async (limit: number = 5): Promise<HighScore[]> => {
  try {
    const { data, error } = await supabase
      .from('high_scores')
      .select('*')
      .order('score', { ascending: false })
      .order('created_at', { ascending: true }) // FIXED: Earlier submissions get better rank for ties
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching top scores:', error);
    return [];
  }
};

export const getUserTopScores = async (username: string, limit: number = 5): Promise<HighScore[]> => {
  try {
    const { data, error } = await supabase
      .from('high_scores')
      .select('*')
      .eq('username', username)
      .order('score', { ascending: false })
      .order('created_at', { ascending: true }) // FIXED: Earlier submissions get better rank for ties
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching user top scores:', error);
    return [];
  }
};

export const getUserRank = async (username: string, score: number): Promise<number> => {
  try {
    // FIXED: Proper ranking calculation that handles ties correctly
    // First, get all scores higher than the current score
    const { data: higherScores, error: higherError } = await supabase
      .from('high_scores')
      .select('score, created_at')
      .gt('score', score)
      .order('score', { ascending: false })
      .order('created_at', { ascending: true });

    if (higherError) throw higherError;

    // Then, get all scores equal to the current score that were submitted earlier
    // We need to find when this user's score was submitted to compare timestamps
    const { data: userScore, error: userError } = await supabase
      .from('high_scores')
      .select('created_at')
      .eq('username', username)
      .eq('score', score)
      .order('created_at', { ascending: false }) // Get the most recent submission of this score
      .limit(1);

    if (userError) throw userError;

    let tiedScoresAhead = 0;
    if (userScore && userScore.length > 0) {
      const userSubmissionTime = new Date(userScore[0].created_at!);
      
      // Get scores equal to current score that were submitted before this user's submission
      const { data: earlierTiedScores, error: tiedError } = await supabase
        .from('high_scores')
        .select('created_at')
        .eq('score', score)
        .lt('created_at', userSubmissionTime.toISOString());

      if (tiedError) throw tiedError;
      tiedScoresAhead = earlierTiedScores?.length || 0;
    }

    // Rank = number of higher scores + number of tied scores submitted earlier + 1
    const rank = (higherScores?.length || 0) + tiedScoresAhead + 1;
    return rank;
  } catch (error) {
    console.error('Error calculating user rank:', error);
    return 0;
  }
};

export const submitHighScore = async (username: string, score: number): Promise<boolean> => {
  try {
    // Create checksum for security
    const checksum = await createChecksum(score, username);
    
    // Submit to the edge function
    const response = await fetch(`${supabaseUrl}/functions/v1/submit-score`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({
        username,
        score,
        checksum
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Score submission failed:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error submitting high score:', error);
    return false;
  }
};