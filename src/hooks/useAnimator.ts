import { useState, useRef, useCallback, useEffect } from 'react';
import { useStore } from '../store/useStore';

export const useAnimator = () => {
  const { rooms, animationSpeed, loopAnimation, durationPerRoom, addToast } = useStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeRoomIndex, setActiveRoomIndex] = useState(-1);
  const [progress, setProgress] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0); // 0-1 for the whole animation

  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>(0);
  const isPlayingRef = useRef(false);

  const play = useCallback(() => {
    if (rooms.length === 0) return;

    setIsPlaying(true);
    isPlayingRef.current = true;
    setActiveRoomIndex(0);
    setProgress(0);
    setTotalProgress(0);
    startTimeRef.current = performance.now();

    const effectiveDuration = durationPerRoom / animationSpeed;
    const totalDuration = effectiveDuration * rooms.length;

    const animate = (time: number) => {
      if (!isPlayingRef.current) return;

      const elapsed = time - startTimeRef.current;
      const newIndex = Math.floor(elapsed / effectiveDuration);
      const newProgress = (elapsed % effectiveDuration) / effectiveDuration;
      const newTotalProgress = Math.min(elapsed / totalDuration, 1);

      if (newIndex >= rooms.length) {
        // Animation finished
        if (loopAnimation && isPlayingRef.current) {
          // Loop: restart from beginning
          startTimeRef.current = performance.now();
          setActiveRoomIndex(0);
          setProgress(0);
          setTotalProgress(0);
          animationRef.current = requestAnimationFrame(animate);
          return;
        }
        setIsPlaying(false);
        isPlayingRef.current = false;
        setActiveRoomIndex(rooms.length - 1);
        setProgress(1);
        setTotalProgress(1);
        return;
      }

      setActiveRoomIndex(newIndex);
      setProgress(newProgress);
      setTotalProgress(newTotalProgress);
      animationRef.current = requestAnimationFrame(animate);
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
  }, [rooms.length, animationSpeed, durationPerRoom, loopAnimation]);

  const stop = useCallback(() => {
    isPlayingRef.current = false;
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
    setIsPlaying(false);
    setActiveRoomIndex(-1);
    setProgress(0);
    setTotalProgress(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isPlayingRef.current = false;
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return { isPlaying, play, stop, activeRoomIndex, progress, totalProgress };
};