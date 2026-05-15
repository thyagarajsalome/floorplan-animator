import { useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group } from 'react-konva';
import useImage from 'use-image';
import { useStore } from '../store/useStore';

const PRESET_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#ffffff'];
const TEXT_COLORS = ['#ffffff', '#000000', '#FDE047', '#ef4444']; 

export const ZoneEditor = () => {
  const { imageBase64, rooms, addRoom, removeRoom, clearRooms, selectedRoomId, setSelectedRoomId, updateRoom } = useStore();
  const [image] = useImage(imageBase64 || '');
  const [isDrawing, setIsDrawing] = useState(false);
  const [newRect, setNewRect] = useState<{ x: number, y: number, w: number, h: number } | null>(null);
  
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);
  const [currentColor, setCurrentColor] = useState(PRESET_COLORS[3]);

  const CANVAS_WIDTH = 450;
  const CANVAS_HEIGHT = Math.floor(CANVAS_WIDTH * (16 / 9));
  const selectedRoom = rooms.find(r => r.id === selectedRoomId);

  const handleMouseDown = (e: any) => {
    if (e.target.name() === 'existing-zone') {
      setSelectedRoomId(e.target.id());
      return;
    }
    setSelectedRoomId(null); 
    const pos = e.target.getStage().getPointerPosition();
    setIsDrawing(true);
    setNewRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing || !newRect) return;
    const pos = e.target.getStage().getPointerPosition();
    setNewRect({ ...newRect, w: pos.x - newRect.x, h: pos.y - newRect.y });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !newRect) return;
    setIsDrawing(false);

    if (Math.abs(newRect.w) < 10 || Math.abs(newRect.h) < 10) {
      setNewRect(null); return;
    }

    const roomName = window.prompt("Enter room name (e.g., Master Bedroom):");
    if (roomName) {
      const xmin = Math.min(newRect.x, newRect.x + newRect.w) / CANVAS_WIDTH;
      const xmax = Math.max(newRect.x, newRect.x + newRect.w) / CANVAS_WIDTH;
      const ymin = Math.min(newRect.y, newRect.y + newRect.h) / CANVAS_HEIGHT;
      const ymax = Math.max(newRect.y, newRect.y + newRect.h) / CANVAS_HEIGHT;

      addRoom({
        id: Math.random().toString(36).substring(7),
        label: roomName,
        boundingBox: [xmin, ymin, xmax, ymax],
        color: currentColor,
        strokeWidth: currentStrokeWidth,
        fontSize: 14,
        textColor: '#ffffff'
      });
    }
    setNewRect(null);
  };

  if (!imageBase64) return null;

  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full justify-center items-start mt-4">
      
      {/* LEFT VIEW: The Canvas */}
      <div className="border-4 border-slate-700 rounded-lg overflow-hidden bg-slate-900 shadow-2xl shrink-0">
        <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT} onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp} className="cursor-crosshair">
          <Layer>
            {image && <KonvaImage image={image} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />}
            
            {rooms.map((room) => {
              const [xmin, ymin, xmax, ymax] = room.boundingBox;
              const x = xmin * CANVAS_WIDTH; const y = ymin * CANVAS_HEIGHT;
              const w = (xmax - xmin) * CANVAS_WIDTH; const h = (ymax - ymin) * CANVAS_HEIGHT;
              const isSelected = selectedRoomId === room.id;

              return (
                <Group key={room.id} x={x} y={y}>
                  <Rect
                    id={room.id} name="existing-zone" width={w} height={h}
                    fill={room.color} opacity={isSelected ? 0.6 : 0.3}
                    stroke={isSelected ? '#ffffff' : room.color} strokeWidth={room.strokeWidth || 2} 
                    onMouseEnter={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = 'pointer'; }}
                    onMouseLeave={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = 'crosshair'; }}
                  />
                  <Text 
                    x={0} y={0} width={w} height={h} align="center" verticalAlign="middle"
                    text={room.label} fill={room.textColor || 'white'} fontStyle="bold" fontSize={room.fontSize || 14} 
                    shadowColor="black" shadowBlur={3} 
                  />
                </Group>
              );
            })}
            {newRect && <Rect x={newRect.x} y={newRect.y} width={newRect.w} height={newRect.h} fill="rgba(255, 255, 255, 0.2)" stroke="white" strokeWidth={2} dash={[5, 5]} />}
          </Layer>
        </Stage>
      </div>

      {/* RIGHT CONTROLLER */}
      <div className="w-full lg:w-80 flex flex-col gap-6 bg-slate-800 p-6 rounded-lg border border-slate-700 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">{selectedRoom ? 'Edit Selected Zone' : 'New Zone Settings'}</h2>
          <p className="text-slate-400 text-xs">{selectedRoom ? `Modifying: ${selectedRoom.label}` : 'These settings apply to the next box you draw.'}</p>
        </div>

        {/* --- NEW TEXT CONTROLS IN SIDEBAR --- */}
        {selectedRoom && (
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <label className="block text-sm font-medium text-slate-300 mb-2">Zone Text & Label</label>
            <input 
              type="text" value={selectedRoom.label}
              onChange={(e) => updateRoom(selectedRoom.id, { label: e.target.value })}
              className="w-full bg-slate-800 text-white px-3 py-2 rounded border border-slate-600 focus:outline-none focus:border-blue-500 mb-3"
            />
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">Text Size</label>
                <select 
                  value={selectedRoom.fontSize || 14}
                  onChange={(e) => updateRoom(selectedRoom.id, { fontSize: Number(e.target.value) })}
                  className="w-full bg-slate-800 text-white rounded px-2 py-1.5 border border-slate-600 outline-none"
                >
                  {[10, 12, 14, 16, 18, 20, 24, 28, 32].map(s => <option key={s} value={s}>{s}px</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">Text Color</label>
                <div className="flex gap-1.5">
                  {TEXT_COLORS.map(c => (
                    <button 
                      key={c} onClick={() => updateRoom(selectedRoom.id, { textColor: c })}
                      className={`w-6 h-6 rounded-full border-2 ${(selectedRoom.textColor || '#ffffff') === c ? 'border-blue-500 scale-110' : 'border-slate-500'}`} 
                      style={{ backgroundColor: c }} 
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Line Thickness</label>
          <select 
            value={selectedRoom ? (selectedRoom.strokeWidth || 2) : currentStrokeWidth}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (selectedRoom) updateRoom(selectedRoom.id, { strokeWidth: val });
              else setCurrentStrokeWidth(val);
            }}
            className="w-full bg-slate-900 border border-slate-600 text-white rounded px-3 py-2 cursor-pointer focus:outline-none focus:border-blue-500"
          >
            {[2, 4, 6, 8, 10, 12, 14, 16].map(val => (
              <option key={val} value={val}>{val}px {val === 2 ? '(Default)' : ''}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Highlight Color</label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(color => (
              <button
                key={color} style={{ backgroundColor: color }}
                className={`w-8 h-8 rounded-full border-2 transition-transform hover:scale-110 ${(selectedRoom ? selectedRoom.color : currentColor) === color ? 'border-white scale-110' : 'border-transparent'}`}
                onClick={() => {
                  if (selectedRoom) updateRoom(selectedRoom.id, { color });
                  else setCurrentColor(color);
                }}
              />
            ))}
          </div>
        </div>

        <hr className="border-slate-700 my-2" />
        {selectedRoom ? (
          <button onClick={() => { if(window.confirm(`Delete ${selectedRoom.label}?`)) removeRoom(selectedRoom.id); }} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 rounded transition-colors">Delete Zone</button>
        ) : (
          <button onClick={() => { if(window.confirm('Clear all zones?')) clearRooms(); }} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 rounded transition-colors">Clear All Zones</button>
        )}
      </div>
    </div>
  );
};