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
    // Get all scores higher than the current score
    const { data, error } = await supabase
      .from('high_scores')
      .select('score')
      .gt('score', score)
      .order('score', { ascending: false });

    if (error) throw error;
    
    // Rank is the number of higher scores + 1
    return (data?.length || 0) + 1;
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