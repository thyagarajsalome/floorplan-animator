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

    // Calculate individual and cumulative timings
    const timings = rooms.map(r => (r.audioDuration || durationPerRoom) / animationSpeed);
    const totalDuration = timings.reduce((a, b) => a + b, 0);

    const animate = (time: number) => {
      if (!isPlayingRef.current) return;

      const elapsed = time - startTimeRef.current;
      const newTotalProgress = Math.min(elapsed / totalDuration, 1);

      if (elapsed >= totalDuration) {
        // Animation finished
        if (loopAnimation && isPlayingRef.current) {
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

      // Find which room we are currently in
      let currentTotal = 0;
      let newIndex = 0;
      let roomStart = 0;
      let roomDuration = timings[0];

      for (let i = 0; i < timings.length; i++) {
        if (elapsed >= currentTotal && elapsed < currentTotal + timings[i]) {
          newIndex = i;
          roomStart = currentTotal;
          roomDuration = timings[i];
          break;
        }
        currentTotal += timings[i];
      }

      const newProgress = (elapsed - roomStart) / roomDuration;

      setActiveRoomIndex(newIndex);
      setProgress(newProgress);
      setTotalProgress(newTotalProgress);
      animationRef.current = requestAnimationFrame(animate);
    };

    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = requestAnimationFrame(animate);
  }, [rooms, animationSpeed, durationPerRoom, loopAnimation]);

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