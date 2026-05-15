import { Stage, Layer, Image as KonvaImage, Rect, Text, Group } from 'react-konva';
import useImage from 'use-image';
import { useStore, type Room } from '../store/useStore';
import { useAnimator } from '../hooks/useAnimator';

const AnimatedZone = ({ 
  room, isActive, isPast, progress, stageWidth, stageHeight 
}: { room: Room, isActive: boolean, isPast: boolean, progress: number, stageWidth: number, stageHeight: number }) => {
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
  // Read the new stroke width, fallback to 6
  const strokeWidth = room.strokeWidth || 6;

  return (
    <Group x={x} y={y}>
      <Rect width={width} height={height} fill={color} opacity={fillOpacity} />
      <Rect
        width={width} height={height} stroke={color} strokeWidth={strokeWidth}
        dash={[perimeter, perimeter]} dashOffset={dashOffset}
      />
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

  const CANVAS_WIDTH = 450;
  const CANVAS_HEIGHT = Math.floor(CANVAS_WIDTH * (16 / 9));

  if (!imageBase64) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full justify-center items-start mt-4">
      {/* LEFT VIEW: Canvas */}
      <div className="border-4 border-slate-700 rounded-lg overflow-hidden bg-slate-900 shadow-2xl shrink-0">
        <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT}>
          <Layer>
            {image && (
              <KonvaImage image={image} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} opacity={isPlaying || activeRoomIndex !== -1 ? 0.6 : 1} />
            )}
            {rooms.map((room, index) => (
              <AnimatedZone
                key={room.id} room={room} isActive={index === activeRoomIndex} isPast={index < activeRoomIndex}
                progress={progress} stageWidth={CANVAS_WIDTH} stageHeight={CANVAS_HEIGHT}
              />
            ))}
          </Layer>
        </Stage>
      </div>

      {/* RIGHT CONTROLLER: Animation Settings */}
      <div className="w-full lg:w-80 flex flex-col gap-4 bg-slate-800 p-6 rounded-lg border border-slate-700 shrink-0">
         <div>
          <h2 className="text-xl font-bold text-white mb-1">Animation Player</h2>
          <p className="text-slate-400 text-xs mb-4">Preview your sequential highlights.</p>
         </div>

         <button onClick={play} disabled={isPlaying || rooms.length === 0}
           className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 py-3 rounded font-bold transition-colors">
           ▶ Play Animation
         </button>

         <button onClick={stop} disabled={!isPlaying}
           className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-slate-700 py-3 rounded font-bold transition-colors">
           ⏹ Stop & Reset
         </button>
      </div>
    </div>
  );
};