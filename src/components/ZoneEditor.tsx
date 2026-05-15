import { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group } from 'react-konva';
import useImage from 'use-image';
import { useStore } from '../store/useStore';
import { getCanvasDimensions } from '../utils/canvasDimensions';
import { RoomList } from './RoomList';
import { useTTS } from '../hooks/useTTS';

const PRESET_COLORS = ['#EF4444', '#F97316', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#06B6D4'];
const TEXT_COLORS = ['#ffffff', '#000000', '#FDE047', '#ef4444'];

// Inline modal for naming a new zone (replaces window.prompt)
interface NameModalProps {
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

const NameModal = ({ onConfirm, onCancel }: NameModalProps) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleConfirm = () => {
    const trimmed = value.trim();
    if (trimmed) onConfirm(trimmed);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="animate-slide-up"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          padding: '28px',
          width: '340px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
        }}
      >
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
          Name this Zone
        </h3>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Give the room a descriptive label (e.g., Master Bedroom)
        </p>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleConfirm();
            if (e.key === 'Escape') onCancel();
          }}
          placeholder="Master Bedroom"
          className="input-field"
          style={{ marginBottom: '16px' }}
        />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onCancel} className="btn-ghost" style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!value.trim()}
            className="btn-primary"
            style={{ flex: 2 }}
          >
            Add Zone
          </button>
        </div>
      </div>
    </div>
  );
};

export const ZoneEditor = () => {
  const {
    imageBase64, imageDimensions, rooms,
    addRoom, removeRoom, clearRooms, updateRoom,
    selectedRoomId, setSelectedRoomId, undo, roomHistory,
    addToast, openaiApiKey
  } = useStore();

  const { generateVoiceover, generateAllMissing, isGenerating } = useTTS();

  const [image] = useImage(imageBase64 || '');
  const [isDrawing, setIsDrawing] = useState(false);
  const [newRect, setNewRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [pendingRect, setPendingRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [currentColor, setCurrentColor] = useState(PRESET_COLORS[3]);
  const [currentStrokeWidth, setCurrentStrokeWidth] = useState(2);

  // Auto aspect ratio from uploaded image
  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = getCanvasDimensions(
    imageDimensions?.width ?? 0,
    imageDimensions?.height ?? 0,
  );

  const selectedRoom = rooms.find((r) => r.id === selectedRoomId) ?? null;

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        undo();
        addToast('Undo.', 'info');
      }
      if (e.key === 'Escape') {
        setSelectedRoomId(null);
        setNewRect(null);
        setPendingRect(null);
        setIsDrawing(false);
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedRoomId && document.activeElement?.tagName !== 'INPUT') {
          removeRoom(selectedRoomId);
          addToast('Zone deleted.', 'info');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedRoomId, undo, removeRoom, addToast, setSelectedRoomId]);

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
      setNewRect(null);
      return;
    }
    setPendingRect(newRect);
    setNewRect(null);
  };

  const confirmZone = (name: string) => {
    if (!pendingRect) return;
    const { x, y, w, h } = pendingRect;
    const xmin = Math.min(x, x + w) / CANVAS_WIDTH;
    const xmax = Math.max(x, x + w) / CANVAS_WIDTH;
    const ymin = Math.min(y, y + h) / CANVAS_HEIGHT;
    const ymax = Math.max(y, y + h) / CANVAS_HEIGHT;
    addRoom({
      id: Math.random().toString(36).substring(7),
      label: name,
      boundingBox: [xmin, ymin, xmax, ymax],
      color: currentColor,
      strokeWidth: currentStrokeWidth,
      fontSize: 14,
      textColor: '#ffffff',
    });
    addToast(`"${name}" zone added!`, 'success');
    setPendingRect(null);
  };

  const cancelZone = () => setPendingRect(null);

  if (!imageBase64) return null;

  return (
    <>
      {pendingRect && <NameModal onConfirm={confirmZone} onCancel={cancelZone} />}

      <div style={{ display: 'flex', gap: '24px', width: '100%', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>

        {/* Canvas */}
        <div className="stage-wrapper">
          <Stage
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            style={{ cursor: 'crosshair', display: 'block' }}
          >
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
                      id={room.id}
                      name="existing-zone"
                      width={w} height={h}
                      fill={room.color}
                      opacity={isSelected ? 0.55 : 0.25}
                      stroke={isSelected ? '#ffffff' : room.color}
                      strokeWidth={room.strokeWidth || 2}
                      onMouseEnter={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = 'pointer'; }}
                      onMouseLeave={(e) => { const c = e.target.getStage()?.container(); if (c) c.style.cursor = 'crosshair'; }}
                    />
                    <Text
                      x={0} y={0} width={w} height={h}
                      align="center" verticalAlign="middle"
                      text={room.label}
                      fill={room.textColor || 'white'}
                      fontStyle="bold"
                      fontSize={room.fontSize || 14}
                      fontFamily="Inter, system-ui, sans-serif"
                      shadowColor="black" shadowBlur={4}
                    />
                    {isSelected && (
                      <>
                        {/* Corner handles */}
                        {[[0,0],[w,0],[0,h],[w,h]].map(([cx, cy], i) => (
                          <Rect key={i} x={cx - 4} y={cy - 4} width={8} height={8}
                            fill="#fff" stroke="#3b82f6" strokeWidth={1} cornerRadius={2} />
                        ))}
                      </>
                    )}
                  </Group>
                );
              })}

              {newRect && (
                <Rect
                  x={newRect.x} y={newRect.y} width={newRect.w} height={newRect.h}
                  fill={currentColor}
                  opacity={0.35}
                  stroke={currentColor}
                  strokeWidth={currentStrokeWidth}
                />
              )}
            </Layer>
          </Stage>
        </div>

        {/* Right Panel */}
        <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>

          {/* Zone Settings Card */}
          <div className="card" style={{ padding: '18px' }}>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '2px', color: 'var(--text-primary)' }}>
              {selectedRoom ? '✏️ Edit Zone' : '🖊 New Zone Settings'}
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              {selectedRoom ? `Editing: ${selectedRoom.label}` : 'Settings for next drawn zone'}
            </p>

            {selectedRoom && (
              <div style={{ marginBottom: '14px' }}>
                <label className="label" htmlFor="zone-label-input">Zone Name</label>
                <input
                  id="zone-label-input"
                  type="text"
                  value={selectedRoom.label}
                  onChange={(e) => updateRoom(selectedRoom.id, { label: e.target.value })}
                  className="input-field"
                  style={{ marginBottom: '14px' }}
                />

                <label className="label" htmlFor="zone-script-input">Voiceover Script</label>
                <textarea
                  id="zone-script-input"
                  value={selectedRoom.script || ''}
                  onChange={(e) => {
                    updateRoom(selectedRoom.id, { script: e.target.value });
                    // If they edit the script, clear the old audio so it prompts regeneration
                    if (selectedRoom.audioUrl) updateRoom(selectedRoom.id, { audioUrl: undefined, audioDuration: undefined });
                  }}
                  placeholder="e.g. Welcome to the spacious master bedroom..."
                  className="input-field"
                  style={{ minHeight: '80px', resize: 'vertical' }}
                />
                <button
                  onClick={() => generateVoiceover(selectedRoom.id, selectedRoom.script || '')}
                  disabled={!selectedRoom.script?.trim() || !!selectedRoom.audioUrl || !openaiApiKey}
                  className="btn-ghost"
                  style={{ marginTop: '8px', fontSize: '0.75rem', padding: '6px' }}
                >
                  {selectedRoom.audioUrl ? '✓ Audio Generated' : '🎙 Generate Audio'}
                </button>
              </div>
            )}

            {/* Highlight Color */}
            <div style={{ marginBottom: '14px' }}>
              <label className="label">Highlight Color</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {PRESET_COLORS.map((color) => {
                  const active = (selectedRoom ? selectedRoom.color : currentColor) === color;
                  return (
                    <button
                      key={color}
                      aria-label={color}
                      style={{
                        width: 28, height: 28,
                        borderRadius: '50%',
                        background: color,
                        border: active ? '2px solid #fff' : '2px solid transparent',
                        cursor: 'pointer',
                        transform: active ? 'scale(1.2)' : 'scale(1)',
                        boxShadow: active ? `0 0 8px ${color}` : 'none',
                        transition: 'all 0.18s ease',
                      }}
                      onClick={() => selectedRoom ? updateRoom(selectedRoom.id, { color }) : setCurrentColor(color)}
                    />
                  );
                })}
              </div>
            </div>

            {/* Stroke width */}
            <div style={{ marginBottom: '14px' }}>
              <label className="label" htmlFor="stroke-select">
                Border Thickness
              </label>
              <select
                id="stroke-select"
                value={selectedRoom ? (selectedRoom.strokeWidth || 2) : currentStrokeWidth}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (selectedRoom) updateRoom(selectedRoom.id, { strokeWidth: val });
                  else setCurrentStrokeWidth(val);
                }}
                className="input-field"
              >
                {[1, 2, 3, 4, 6, 8, 10, 12].map((v) => (
                  <option key={v} value={v}>{v}px{v === 2 ? ' (default)' : ''}</option>
                ))}
              </select>
            </div>

            {/* Text controls for selected room */}
            {selectedRoom && (
              <>
                <div style={{ display: 'flex', gap: '12px', marginBottom: '14px' }}>
                  <div style={{ flex: 1 }}>
                    <label className="label" htmlFor="font-size-select">Text Size</label>
                    <select
                      id="font-size-select"
                      value={selectedRoom.fontSize || 14}
                      onChange={(e) => updateRoom(selectedRoom.id, { fontSize: Number(e.target.value) })}
                      className="input-field"
                    >
                      {[10, 12, 14, 16, 18, 20, 24, 28, 32].map((s) => (
                        <option key={s} value={s}>{s}px</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label className="label">Text Color</label>
                    <div style={{ display: 'flex', gap: '6px', paddingTop: '8px' }}>
                      {TEXT_COLORS.map((c) => {
                        const active = (selectedRoom.textColor || '#ffffff') === c;
                        return (
                          <button
                            key={c}
                            aria-label={c}
                            onClick={() => updateRoom(selectedRoom.id, { textColor: c })}
                            style={{
                              width: 24, height: 24,
                              borderRadius: '50%',
                              background: c,
                              border: active ? '2px solid var(--accent-blue)' : '2px solid var(--border-light)',
                              cursor: 'pointer',
                              transform: active ? 'scale(1.18)' : 'scale(1)',
                              transition: 'all 0.15s ease',
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => { removeRoom(selectedRoom.id); addToast(`"${selectedRoom.label}" deleted.`, 'info'); }}
                    className="btn-danger"
                  >
                    🗑 Delete Zone
                  </button>
                </div>
              </>
            )}

            {!selectedRoom && rooms.length > 0 && (
              <button
                onClick={() => { if (window.confirm('Clear all zones?')) { clearRooms(); addToast('All zones cleared.', 'info'); } }}
                className="btn-ghost"
                style={{ marginTop: '4px' }}
              >
                Clear All Zones
              </button>
            )}
          </div>

          {/* Room List Card */}
          <div className="card" style={{ padding: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                🗺 Animation Order
              </h2>
              {roomHistory.length > 0 && (
                <button
                  id="undo-btn"
                  onClick={() => { undo(); addToast('Undo.', 'info'); }}
                  title="Undo (Ctrl+Z)"
                  style={{
                    fontSize: '0.75rem', color: '#60a5fa', background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.2)', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer',
                  }}
                >
                  ↩ Undo
                </button>
              )}
            </div>
            
            {rooms.length > 0 && (
              <button
                onClick={generateAllMissing}
                disabled={isGenerating || !openaiApiKey}
                className="btn-emerald"
                style={{ marginBottom: '16px', padding: '10px' }}
              >
                {isGenerating ? 'Generating...' : '🎙 Generate All Missing Voiceovers'}
              </button>
            )}

            <RoomList />
          </div>

          {/* Tips */}
          <div style={{
            padding: '12px 14px',
            background: 'rgba(139,92,246,0.06)',
            border: '1px solid rgba(139,92,246,0.15)',
            borderRadius: '10px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}>
            <strong style={{ color: '#a78bfa' }}>Tips:</strong> Draw boxes over rooms.
            Click a box to edit. Drag list items to reorder. Press <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px', fontSize: '0.7rem' }}>Del</kbd> to remove selected.
            <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '1px 5px', borderRadius: '3px', fontSize: '0.7rem', marginLeft: '4px' }}>Ctrl+Z</kbd> to undo.
          </div>
        </div>
      </div>
    </>
  );
};