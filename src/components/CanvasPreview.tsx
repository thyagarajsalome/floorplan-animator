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
      <Text
        x={0} y={0} width={width} height={height} align="center" verticalAlign="middle"
        text={room.label} fontSize={room.fontSize || 14} fontFamily="sans-serif"
        fill={room.textColor || 'white'} fontStyle="bold" opacity={Math.min(textOpacity, 1)}
        shadowColor="black" shadowBlur={4} shadowOffset={{ x: 2, y: 2 }} shadowOpacity={0.8}
      />
    </Group>
  );
};

export const CanvasPreview = () => {
  const { imageBase64, rooms } = useStore();
  const [image] = useImage(imageBase64 || '');
  const { isPlaying, play, stop, activeRoomIndex, progress } = useAnimator();
  
  const stageRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);

  const CANVAS_WIDTH = 450;
  const CANVAS_HEIGHT = Math.floor(CANVAS_WIDTH * (16 / 9));

  const handleExport = () => {
    if (!stageRef.current) return;
    
    // THE FIX: Grab the live HTML5 Canvas from the DOM so the video actually moves!
    const stage = stageRef.current;
    const canvas = stage.container().querySelector('canvas');
    if (!canvas) return;

    const stream = canvas.captureStream(30); 
    recordedChunks.current = [];
    
    // MP4 CHECK: Try to force MP4 if supported, else fallback to standard WebM
    let options = { mimeType: 'video/webm' };
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      options = { mimeType: 'video/mp4' };
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
      options = { mimeType: 'video/webm;codecs=h264' };
    }

    const recorder = new MediaRecorder(stream, options);
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) recordedChunks.current.push(e.data);
    };
    
    recorder.onstop = () => {
      const ext = options.mimeType.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(recordedChunks.current, { type: options.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `floorplan-tour.${ext}`;
      a.click();
      window.URL.revokeObjectURL(url);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    play(); // Start the animation immediately after starting the recording
  };

  useEffect(() => {
    if (!isPlaying && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [isPlaying]);

  if (!imageBase64) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full justify-center items-start mt-4">
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

      <div className="w-full lg:w-80 flex flex-col gap-4 bg-slate-800 p-6 rounded-lg border border-slate-700 shrink-0">
         <div>
          <h2 className="text-xl font-bold text-white mb-1">Export Video</h2>
          <p className="text-slate-400 text-xs mb-4">Record your animation for external use.</p>
         </div>

         <div className="flex flex-col gap-2">
           <button onClick={play} disabled={isPlaying || rooms.length === 0} className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 py-3 rounded font-bold transition-colors">
             ▶ Preview Animation
           </button>
           <button onClick={stop} disabled={!isPlaying} className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 py-3 rounded font-bold transition-colors">
             ⏹ Stop
           </button>
         </div>

         <button onClick={handleExport} disabled={isPlaying || rooms.length === 0} className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 py-3 mt-2 rounded font-bold transition-colors flex items-center justify-center gap-2">
           🎥 Record & Download Video
         </button>

         {/* TIMING GUIDE */}
         <div className="mt-4 bg-slate-900 p-4 rounded border border-slate-700">
           <h3 className="text-sm font-bold text-white mb-2">Voiceover Timing Guide</h3>
           <p className="text-xs text-slate-400 mb-3">Use these exact timestamps in your external MP3 generator.</p>
           <ul className="text-xs text-slate-300 space-y-2 max-h-48 overflow-y-auto pr-2">
             {rooms.map((r, i) => (
                <li key={r.id} className="flex justify-between border-b border-slate-800 pb-1">
                  <span className="font-medium truncate mr-2">{r.label}</span>
                  <span className="text-emerald-400 font-mono whitespace-nowrap">{(i * 2.5).toFixed(1)}s - {((i + 1) * 2.5).toFixed(1)}s</span>
                </li>
             ))}
           </ul>
         </div>
      </div>
    </div>
  );
};