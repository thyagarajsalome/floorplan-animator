import { Stage, Layer, Image as KonvaImage, Rect, Text, Group } from 'react-konva';
import useImage from 'use-image';
import { useStore, type Room } from '../store/useStore';
import { useAnimator } from '../hooks/useAnimator';

const AnimatedZone = ({ 
  room, isActive, isPast, progress, stageWidth, stageHeight 
}: { 
  room: Room, isActive: boolean, isPast: boolean, progress: number, stageWidth: number, stageHeight: number 
}) => {
  const [xmin, ymin, xmax, ymax] = room.boundingBox;
  
  // Convert Gemini's 0.0-1.0 coordinates to actual canvas pixels
  const x = xmin * stageWidth;
  const y = ymin * stageHeight;
  const width = (xmax - xmin) * stageWidth;
  const height = (ymax - ymin) * stageHeight;

  // Calculate perimeter for the dashed line "drawing" animation
  const perimeter = 2 * (width + height);

  // Phase 1: Draw Border (0.0 to 0.5 progress)
  const drawProgress = isPast ? 1 : (isActive ? Math.min(progress * 2, 1) : 0);
  const dashOffset = perimeter * (1 - drawProgress);

  // Phase 2: Fade in Fill (0.5 to 1.0 progress)
  const fillOpacity = isPast ? 0.3 : (isActive ? Math.max(0, (progress - 0.5) * 2) * 0.3 : 0);
  
  // Phase 3: Pop in Text Label
  const textOpacity = isPast ? 1 : (isActive && progress > 0.6 ? (progress - 0.6) * 2.5 : 0);

  if (!isActive && !isPast) return null;

  const color = room.color || '#10b981';

  return (
    <Group x={x} y={y}>
      {/* The semi-transparent fill */}
      <Rect width={width} height={height} fill={color} opacity={fillOpacity} />
      
      {/* The solid animated border */}
      <Rect
        width={width} height={height} stroke={color} strokeWidth={6}
        dash={[perimeter, perimeter]} dashOffset={dashOffset}
      />
      
      {/* The Room Name Label */}
      <Text
        y={-30} text={room.label} fontSize={24} fontFamily="sans-serif"
        fill="white" fontStyle="bold" opacity={Math.min(textOpacity, 1)}
        shadowColor="black" shadowBlur={4} shadowOffset={{ x: 2, y: 2 }} shadowOpacity={0.8}
      />
    </Group>
  );
};

export const CanvasPreview = () => {
  const { imageBase64, rooms } = useStore();
  const [image] = useImage(imageBase64 || '');
  const { isPlaying, play, stop, activeRoomIndex, progress } = useAnimator();

  // Fixed 9:16 aspect ratio for the preview window
  const CANVAS_WIDTH = 450;
  const CANVAS_HEIGHT = Math.floor(CANVAS_WIDTH * (16 / 9));

  if (!imageBase64) return null;

  return (
    <div className="flex flex-col items-center gap-4 w-full mt-8">
      {/* Animation Controls */}
      <div className="flex gap-4 mb-2">
         <button onClick={play} disabled={isPlaying || rooms.length === 0}
           className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 px-6 py-2 rounded font-bold transition-colors">
           ▶ Play Auto-Zoning
         </button>
         <button onClick={stop} disabled={!isPlaying}
           className="bg-rose-600 hover:bg-rose-700 disabled:bg-slate-700 px-6 py-2 rounded font-bold transition-colors">
           ⏹ Reset
         </button>
      </div>

      {/* The Actual Canvas */}
      <div className="border-4 border-slate-700 rounded-lg overflow-hidden bg-slate-900 shadow-2xl">
        <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
          <Layer>
            {image && (
              <KonvaImage 
                image={image} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} 
                opacity={isPlaying || activeRoomIndex !== -1 ? 0.6 : 1} 
              />
            )}
            
            {rooms.map((room, index) => (
              <AnimatedZone
                key={room.id} room={room}
                isActive={index === activeRoomIndex}
                isPast={index < activeRoomIndex}
                progress={progress}
                stageWidth={CANVAS_WIDTH} stageHeight={CANVAS_HEIGHT}
              />
            ))}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};