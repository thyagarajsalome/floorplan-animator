import { useState, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group } from 'react-konva';
import useImage from 'use-image';
import { useStore } from '../store/useStore';

const COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

export const ZoneEditor = () => {
  const { imageBase64, rooms, addRoom, removeRoom, clearRooms } = useStore();
  const [image] = useImage(imageBase64 || '');
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [newRect, setNewRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);

  // Keep these dimensions matched to your preview!
  const CANVAS_WIDTH = 450;
  const CANVAS_HEIGHT = Math.floor(CANVAS_WIDTH * (16 / 9));

  const handleMouseDown = (e: any) => {
    // If clicking on an existing room to delete it, don't start drawing
    if (e.target.name() === 'existing-zone') return;

    const pos = e.target.getStage().getPointerPosition();
    setIsDrawing(true);
    setNewRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !newRect) return;
    const pos = e.target.getStage().getPointerPosition();
    setNewRect({
      ...newRect,
      w: pos.x - newRect.x,
      h: pos.y - newRect.y,
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !newRect) return;
    setIsDrawing(false);

    // Ignore tiny accidental clicks
    if (Math.abs(newRect.w) < 10 || Math.abs(newRect.h) < 10) {
      setNewRect(null);
      return;
    }

    const roomName = window.prompt("Enter room name (e.g., Living Room):");
    
    if (roomName) {
      // Calculate min and max X/Y (handling drawing from bottom-right to top-left)
      const startX = newRect.x;
      const startY = newRect.y;
      const endX = newRect.x + newRect.w;
      const endY = newRect.y + newRect.h;

      const xmin = Math.min(startX, endX) / CANVAS_WIDTH;
      const xmax = Math.max(startX, endX) / CANVAS_WIDTH;
      const ymin = Math.min(startY, endY) / CANVAS_HEIGHT;
      const ymax = Math.max(startY, endY) / CANVAS_HEIGHT;

      addRoom({
        id: Math.random().toString(36).substring(7),
        label: roomName,
        boundingBox: [xmin, ymin, xmax, ymax],
        color: COLORS[rooms.length % COLORS.length] // Cycle through colors
      });
    }
    setNewRect(null);
  };

  if (!imageBase64) return null;

  return (
    <div className="flex flex-col items-center gap-4 w-full mt-8">
      <div className="flex gap-4 mb-2 items-center">
        <h2 className="text-xl font-bold text-white">Manual Zoning Mode</h2>
        <button onClick={clearRooms} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-1 rounded text-sm transition-colors">
          Clear All Zones
        </button>
      </div>
      
      <p className="text-slate-400 text-sm mb-2">
        Click and drag to draw a zone. Click an existing zone to delete it.
      </p>

      <div className="border-4 border-slate-700 rounded-lg overflow-hidden bg-slate-900 cursor-crosshair shadow-2xl">
        <Stage 
          width={CANVAS_WIDTH} height={CANVAS_HEIGHT}
          onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
        >
          <Layer>
            {image && <KonvaImage image={image} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />}
            
            {/* Draw previously saved rooms */}
            {rooms.map((room) => {
              const [xmin, ymin, xmax, ymax] = room.boundingBox;
              const x = xmin * CANVAS_WIDTH;
              const y = ymin * CANVAS_HEIGHT;
              const w = (xmax - xmin) * CANVAS_WIDTH;
              const h = (ymax - ymin) * CANVAS_HEIGHT;

              return (
                <Group key={room.id} x={x} y={y}>
                  <Rect
                    name="existing-zone" // Used to prevent drawing when clicking to delete
                    width={w} height={h}
                    fill={room.color} opacity={0.4}
                    stroke={room.color} strokeWidth={2}
                    onClick={() => {
                      if(window.confirm(`Delete ${room.label}?`)) removeRoom(room.id);
                    }}
                    onMouseEnter={(e) => {
                      const container = e.target.getStage()?.container();
                      if (container) container.style.cursor = 'pointer';
                    }}
                    onMouseLeave={(e) => {
                      const container = e.target.getStage()?.container();
                      if (container) container.style.cursor = 'crosshair';
                    }}
                  />
                  <Text y={-20} text={room.label} fill="white" fontStyle="bold" shadowColor="black" shadowBlur={2} />
                </Group>
              );
            })}

            {/* Draw the rectangle currently being dragged */}
            {newRect && (
              <Rect
                x={newRect.x} y={newRect.y} width={newRect.w} height={newRect.h}
                fill="rgba(255, 255, 255, 0.2)" stroke="white" strokeWidth={2} dash={[5, 5]}
              />
            )}
          </Layer>
        </Stage>
      </div>
    </div>
  );
};