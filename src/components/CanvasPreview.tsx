import { useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group } from 'react-konva';
import useImage from 'use-image';
import { useStore, type Room } from '../store/useStore';
import { useAnimator } from '../hooks/useAnimator';

const AnimatedZone = ({ room, isActive, isPast, progress, stageWidth, stageHeight }: any) => {
  const [xmin, ymin, xmax, ymax] = room.boundingBox;
  const x = xmin * stageWidth; const y = ymin * stageHeight;
  const width = (xmax - xmin) * stageWidth; const height = (ymax - ymin) * stageHeight;
  const perimeter = 2 * (width + height);

  const drawProgress = isPast ? 1 : (isActive ? Math.min(progress * 2, 1) : 0);
  const dashOffset = perimeter * (1 - drawProgress);
  const fillOpacity = isPast ? 0.3 : (isActive ? Math.max(0, (progress - 0.5) * 2) * 0.3 : 0);
  const textOpacity = isPast ? 1 : (isActive && progress > 0.6 ? (progress - 0.6) * 2.5 : 0);

  if (!isActive && !isPast) return null;
  const color = room.color || '#10b981';

  return (
    <Group x={x} y={y}>
      <Rect width={width} height={height} fill={color} opacity={fillOpacity} />
      <Rect width={width} height={height} stroke={color} strokeWidth={room.strokeWidth || 2} dash={[perimeter, perimeter]} dashOffset={dashOffset} />
      
      {/* Centered Text for the Animation Phase */}
      <Text
        x={0} y={0} width={width} height={height} align="center" verticalAlign="middle"
        text={room.label} fontSize={16} fontFamily="sans-serif"
        fill="white" fontStyle="bold" opacity={Math.min(textOpacity, 1)}
        shadowColor="black" shadowBlur={4} shadowOffset={{ x: 2, y: 2 }} shadowOpacity={0.8}
      />
    </Group>
  );
};

export const CanvasPreview = () => {
  const { imageBase64, rooms, audioUrl, setAudioUrl } = useStore();
  const [image] = useImage(imageBase64 || '');
  const { isPlaying, play, stop, activeRoomIndex, progress } = useAnimator();
  
  const stageRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  const CANVAS_WIDTH = 450;
  const CANVAS_HEIGHT = Math.floor(CANVAS_WIDTH * (16 / 9));

  // --- AUDIO UPLOAD HANDLER ---
  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
    }
  };

  // --- AUDIO SYNC LOGIC ---
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.currentTime = 0; // Reset to start
        audioRef.current.play();
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // --- EXPORT TO VIDEO LOGIC ---
  const handleExport = () => {
    if (!stageRef.current) return;
    
    // 1. Get the canvas stream
    const canvas = stageRef.current.toCanvas();
    const stream = canvas.captureStream(30); // 30 FPS
    
    // 2. Set up the recorder
    recordedChunks.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };
    
    recorder.onstop = () => {
      // 3. Download the file when animation finishes
      const blob = new Blob(recordedChunks.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'floorplan-tour.webm';
      a.click();
      window.URL.revokeObjectURL(url);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    
    // Start the animation
    play();
  };

  // Stop recording if animation stops
  useEffect(() => {
    if (!isPlaying && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [isPlaying]);

  if (!imageBase64) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full justify-center items-start mt-4">
      {/* LEFT VIEW: Canvas */}
      <div className="border-4 border-slate-700 rounded-lg overflow-hidden bg-slate-900 shadow-2xl shrink-0">
        <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT} ref={stageRef}>
          <Layer>
            {image && <KonvaImage image={image} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} opacity={isPlaying || activeRoomIndex !== -1 ? 0.6 : 1} />}
            {rooms.map((room, index) => (
              <AnimatedZone key={room.id} room={room} isActive={index === activeRoomIndex} isPast={index < activeRoomIndex} progress={progress} stageWidth={CANVAS_WIDTH} stageHeight={CANVAS_HEIGHT} />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* RIGHT CONTROLLER */}
      <div className="w-full lg:w-80 flex flex-col gap-4 bg-slate-800 p-6 rounded-lg border border-slate-700 shrink-0">
         <div>
          <h2 className="text-xl font-bold text-white mb-1">Export Settings</h2>
          <p className="text-slate-400 text-xs mb-4">Add audio and record your video.</p>
         </div>

         {/* AUDIO INPUT */}
         <div className="bg-slate-900 p-4 rounded border border-slate-700">
           <label className="block text-sm font-medium text-slate-300 mb-2">Voiceover (MP3/WAV)</label>
           <input type="file" accept="audio/*" onChange={handleAudioUpload} className="text-sm text-slate-400 w-full" />
           {audioUrl && <audio ref={audioRef} src={audioUrl} className="hidden" />}
           <p className="text-xs text-slate-500 mt-2">Audio starts automatically when Play is pressed.</p>
         </div>

         <div className="flex flex-col gap-2 mt-4">
           <button onClick={play} disabled={isPlaying || rooms.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 py-3 rounded font-bold transition-colors">
             ▶ Preview Animation
           </button>
           <button onClick={stop} disabled={!isPlaying} className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 py-3 rounded font-bold transition-colors">
             ⏹ Stop
           </button>
         </div>

         <hr className="border-slate-700 my-2" />

         {/* DOWNLOAD BUTTON */}
         <button onClick={handleExport} disabled={isPlaying || rooms.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 py-3 rounded font-bold transition-colors flex items-center justify-center gap-2">
           🎥 Record & Download .WebM
         </button>
      </div>
    </div>
  );
};