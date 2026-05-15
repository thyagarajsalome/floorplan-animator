import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';

export const useAnimator = () => {
  const { rooms } = useStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeRoomIndex, setActiveRoomIndex] = useState(-1);
  const [progress, setProgress] = useState(0); 
  
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const isPlayingRef = useRef(false); // Fail-safe to instantly kill the animation loop

  const DURATION_PER_ROOM = 2500; 

  const play = useCallback(() => {
    if (rooms.length === 0) return;
    
    setIsPlaying(true);
    isPlayingRef.current = true;
    setActiveRoomIndex(0);
    setProgress(0);
    startTimeRef.current = performance.now();
    
    const animate = (time: number) => {
      // 1. Instant kill-switch check
      if (!isPlayingRef.current) return;

      const elapsed = time - startTimeRef.current;
      const newIndex = Math.floor(elapsed / DURATION_PER_ROOM);
      const newProgress = (elapsed % DURATION_PER_ROOM) / DURATION_PER_ROOM;

      if (newIndex >= rooms.length) {
        setIsPlaying(false);
        isPlayingRef.current = false;
        setActiveRoomIndex(rooms.length - 1);
        setProgress(1);
        return;
      }

      setActiveRoomIndex(newIndex);
      setProgress(newProgress);
      animationRef.current = requestAnimationFrame(animate);
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
  }, [rooms.length]);

  const stop = useCallback(() => {
    // 1. Flip the fail-safe ref to completely block the next frame
    isPlayingRef.current = false; 
    
    // 2. Force kill the browser animation frame instantly
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    
    // 3. Reset React state so canvas components unmount cleanly
    setIsPlaying(false);
    setActiveRoomIndex(-1);
    setProgress(0);
  }, []);

  // Cleanup effect: ensures animation stops if you navigate away from the component
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return { isPlaying, play, stop, activeRoomIndex, progress };
};