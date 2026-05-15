import { useState } from 'react';
import { useStore } from '../store/useStore';

export const useTTS = () => {
  const { openaiApiKey, rooms, setRooms, addToast } = useStore();
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate a single room's voiceover
  const generateVoiceover = async (roomId: string, script: string) => {
    if (!openaiApiKey) {
      addToast('Please enter your OpenAI API key first.', 'error');
      return false;
    }
    if (!script.trim()) {
      addToast('Script cannot be empty.', 'error');
      return false;
    }

    try {
      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'tts-1',
          voice: 'onyx', // Professional deep voice (alloy, echo, fable, onyx, nova, shimmer)
          input: script,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio. Check your API key.');
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);

      // We need to decode the audio to find its exact length in milliseconds
      const audioContext = new AudioContext();
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      const audioDuration = audioBuffer.duration * 1000; // MS

      setRooms(rooms.map(r => r.id === roomId ? { ...r, audioUrl, audioDuration, script } : r));
      return true;

    } catch (error: any) {
      console.error(error);
      addToast(error.message || 'TTS generation failed.', 'error');
      return false;
    }
  };

  // Generate missing voiceovers for all rooms
  const generateAllMissing = async () => {
    if (!openaiApiKey) {
      addToast('Please enter your OpenAI API key first.', 'error');
      return;
    }

    setIsGenerating(true);
    let successCount = 0;

    for (const room of rooms) {
      // Only generate if there's a script AND it doesn't already have audio
      if (room.script?.trim() && !room.audioUrl) {
        const success = await generateVoiceover(room.id, room.script);
        if (success) successCount++;
        // Small pause to avoid rate limits
        await new Promise(r => setTimeout(r, 500));
      }
    }

    setIsGenerating(false);
    if (successCount > 0) {
      addToast(`Generated ${successCount} voiceover(s) successfully!`, 'success');
    } else {
      addToast('No new voiceovers needed to be generated.', 'info');
    }
  };

  return { generateVoiceover, generateAllMissing, isGenerating };
};
