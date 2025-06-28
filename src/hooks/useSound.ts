import { useCallback, useRef } from 'react';

export const useSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);

  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, volume: number = 0.3) => {
    const audioContext = initAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
  }, [initAudioContext]);

  const playWhisper = useCallback(() => {
    // Create a whisper-like sound with multiple low frequencies
    playTone(80, 0.5, 0.1);
    setTimeout(() => playTone(100, 0.3, 0.08), 200);
    setTimeout(() => playTone(60, 0.4, 0.12), 400);
  }, [playTone]);

  const playBoom = useCallback(() => {
    // Deep boom sound
    playTone(40, 1.2, 0.6);
    setTimeout(() => playTone(60, 0.8, 0.4), 100);
  }, [playTone]);

  const playSwoosh = useCallback(() => {
    // Swoosh sound effect
    const audioContext = initAudioContext();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(50, audioContext.currentTime + 0.5);
    oscillator.type = 'sawtooth';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  }, [initAudioContext]);

  const playBounce = useCallback(() => {
    playTone(400, 0.1, 0.2);
  }, [playTone]);

  const playExplosion = useCallback(() => {
    playTone(150, 0.3, 0.4);
    setTimeout(() => playTone(100, 0.2, 0.3), 50);
  }, [playTone]);

  return {
    playWhisper,
    playBoom,
    playSwoosh,
    playBounce,
    playExplosion
  };
};