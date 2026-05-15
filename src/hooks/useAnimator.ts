import { useState, useRef } from 'react';
import { useStore } from '../store/useStore';

export const useAnimator = () => {
  const { rooms } = useStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeRoomIndex, setActiveRoomIndex] = useState(-1);
  const [progress, setProgress] = useState(0); 
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);

  // How long each room's animation should take (in milliseconds)
  const DURATION_PER_ROOM = 2500; 

  const play = () => {
    if (rooms.length === 0) return;
    setIsPlaying(true);
    setActiveRoomIndex(0);
    setProgress(0);
    startTimeRef.current = performance.now();
    
    const animate = (time: number) => {
      const elapsed = time - startTimeRef.current;
      const newIndex = Math.floor(elapsed / DURATION_PER_ROOM);
      const newProgress = (elapsed % DURATION_PER_ROOM) / DURATION_PER_ROOM;

      if (newIndex >= rooms.length) {
        // Animation finished
        setIsPlaying(false);
        setActiveRoomIndex(rooms.length - 1);
        setProgress(1);
        return;
      }

      setActiveRoomIndex(newIndex);
      setProgress(newProgress);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
  };

  const stop = () => {
    setIsPlaying(false);
    setActiveRoomIndex(-1);
    setProgress(0);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
  };

  return { isPlaying, play, stop, activeRoomIndex, progress };
};