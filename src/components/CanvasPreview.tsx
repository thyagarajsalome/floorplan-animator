import { useRef, useEffect, useState } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text, Group } from 'react-konva';
import useImage from 'use-image';
import { useStore } from '../store/useStore';
import { useAnimator } from '../hooks/useAnimator';
import { getCanvasDimensions } from '../utils/canvasDimensions';
import { AnimationControls } from './AnimationControls';
import { RoomList } from './RoomList';

const AnimatedZone = ({
  room, isActive, isPast, progress, stageWidth, stageHeight,
}: {
  room: any; isActive: boolean; isPast: boolean; progress: number;
  stageWidth: number; stageHeight: number;
}) => {
  const [xmin, ymin, xmax, ymax] = room.boundingBox;
  const x = xmin * stageWidth; const y = ymin * stageHeight;
  const width = (xmax - xmin) * stageWidth;
  const height = (ymax - ymin) * stageHeight;
  const perimeter = 2 * (width + height);
  const color = room.color || '#10b981';

  const drawProgress = isPast ? 1 : isActive ? Math.min(progress * 2, 1) : 0;
  const dashOffset = perimeter * (1 - drawProgress);
  const fillOpacity = isPast ? 0.28 : isActive ? Math.max(0, (progress - 0.5) * 2) * 0.35 : 0;
  const textOpacity = isPast ? 1 : isActive && progress > 0.55 ? (progress - 0.55) * 2.2 : 0;

  if (!isActive && !isPast) return null;

  return (
    <Group x={x} y={y}>
      <Rect width={width} height={height} fill={color} opacity={fillOpacity} />
      <Rect
        width={width} height={height}
        stroke={color} strokeWidth={room.strokeWidth || 2}
        dash={[perimeter, perimeter]} dashOffset={dashOffset}
      />
      <Text
        x={0} y={0} width={width} height={height}
        align="center" verticalAlign="middle"
        text={room.label}
        fontSize={room.fontSize || 14}
        fontFamily="Inter, system-ui, sans-serif"
        fill={room.textColor || 'white'}
        fontStyle="bold"
        opacity={Math.min(textOpacity, 1)}
        shadowColor="black" shadowBlur={5}
        shadowOffset={{ x: 1, y: 1 }} shadowOpacity={0.9}
      />
    </Group>
  );
};

export const CanvasPreview = () => {
  const { imageBase64, imageDimensions, rooms, durationPerRoom, animationSpeed } = useStore();
  const [image] = useImage(imageBase64 || '');
  const { isPlaying, play, stop, activeRoomIndex, progress, totalProgress } = useAnimator();

  const stageRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunks = useRef<Blob[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [currentRoomLabel, setCurrentRoomLabel] = useState('');

  const { width: CANVAS_WIDTH, height: CANVAS_HEIGHT } = getCanvasDimensions(
    imageDimensions?.width ?? 0,
    imageDimensions?.height ?? 0,
  );

  // Track current room label for HUD
  useEffect(() => {
    if (activeRoomIndex >= 0 && activeRoomIndex < rooms.length) {
      setCurrentRoomLabel(rooms[activeRoomIndex].label);
    } else {
      setCurrentRoomLabel('');
    }
  }, [activeRoomIndex, rooms]);

  const handleExport = () => {
    if (!stageRef.current) return;
    const canvas = stageRef.current.container().querySelector('canvas');
    if (!canvas) return;

    const stream = canvas.captureStream(30);
    recordedChunks.current = [];

    let options = { mimeType: 'video/webm' };
    if (MediaRecorder.isTypeSupported('video/mp4')) {
      options = { mimeType: 'video/mp4' };
    } else if (MediaRecorder.isTypeSupported('video/webm;codecs=h264')) {
      options = { mimeType: 'video/webm;codecs=h264' };
    }

    const recorder = new MediaRecorder(stream, options);
    recorder.ondataavailable = (e) => { if (e.data.size > 0) recordedChunks.current.push(e.data); };
    recorder.onstop = () => {
      const ext = options.mimeType.includes('mp4') ? 'mp4' : 'webm';
      const blob = new Blob(recordedChunks.current, { type: options.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `floorplan-tour.${ext}`; a.click();
      URL.revokeObjectURL(url);
      setIsRecording(false);
    };

    mediaRecorderRef.current = recorder;
    recorder.start();
    setIsRecording(true);
    play();
  };

  // Stop recording when animation ends
  useEffect(() => {
    if (!isPlaying && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  }, [isPlaying]);

  // Compute voiceover timings
  const effectiveDuration = durationPerRoom / animationSpeed;
  const timings = rooms.map((r, i) => ({
    label: r.label,
    start: ((i * effectiveDuration) / 1000).toFixed(1),
    end: (((i + 1) * effectiveDuration) / 1000).toFixed(1),
  }));

  if (!imageBase64) return null;

  return (
    <div style={{ display: 'flex', gap: '24px', width: '100%', justifyContent: 'center', alignItems: 'flex-start', flexWrap: 'wrap' }}>

      {/* Canvas side */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div className="stage-wrapper">
          <Stage width={CANVAS_WIDTH} height={CANVAS_HEIGHT} ref={stageRef}>
            <Layer>
              {image && (
                <KonvaImage
                  image={image}
                  width={CANVAS_WIDTH}
                  height={CANVAS_HEIGHT}
                  opacity={isPlaying || activeRoomIndex !== -1 ? 0.55 : 1}
                />
              )}
              {rooms.map((room, index) => (
                <AnimatedZone
                  key={room.id}
                  room={room}
                  isActive={index === activeRoomIndex}
                  isPast={index < activeRoomIndex}
                  progress={progress}
                  stageWidth={CANVAS_WIDTH}
                  stageHeight={CANVAS_HEIGHT}
                />
              ))}
            </Layer>
          </Stage>
        </div>

        {/* Progress bar below canvas */}
        <div style={{ marginTop: '8px', padding: '0 4px' }}>
          <div className="progress-bar-track">
            <div
              className="progress-bar-fill"
              style={{ width: `${totalProgress * 100}%` }}
            />
          </div>
          {(isPlaying || activeRoomIndex !== -1) && currentRoomLabel && (
            <div style={{
              textAlign: 'center',
              marginTop: '6px',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              fontWeight: 500,
            }}>
              Now: <span style={{ color: rooms[activeRoomIndex]?.color || '#60a5fa' }}>{currentRoomLabel}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: '8px', fontFamily: 'monospace' }}>
                {rooms[activeRoomIndex] ? `${activeRoomIndex + 1}/${rooms.length}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Recording indicator */}
        {isRecording && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(239,68,68,0.15)',
            border: '1px solid rgba(239,68,68,0.4)',
            borderRadius: '8px',
            padding: '4px 10px',
            fontSize: '0.75rem',
            color: '#f87171',
            fontWeight: 600,
            backdropFilter: 'blur(6px)',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse-glow 1s infinite' }} />
            Recording
          </div>
        )}
      </div>

      {/* Right controls */}
      <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '16px', flexShrink: 0 }}>

        {/* Playback controls */}
        <div className="card" style={{ padding: '18px' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            ▶ Playback
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              id="preview-btn"
              onClick={play}
              disabled={isPlaying || rooms.length === 0}
              className="btn-primary"
            >
              {isPlaying ? '▶ Playing…' : '▶ Preview Animation'}
            </button>
            <button
              id="stop-btn"
              onClick={stop}
              disabled={!isPlaying}
              className="btn-ghost"
            >
              ⏹ Stop
            </button>
            <div className="divider" />
            <button
              id="record-btn"
              onClick={handleExport}
              disabled={isPlaying || rooms.length === 0 || isRecording}
              className="btn-emerald"
            >
              {isRecording ? '🔴 Recording…' : '🎥 Record & Download Video'}
            </button>
          </div>
        </div>

        {/* Animation controls */}
        <div className="card" style={{ padding: '18px' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            ⚙ Animation Settings
          </h2>
          <AnimationControls />
        </div>

        {/* Room order */}
        <div className="card" style={{ padding: '18px' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
            🗺 Room Order
          </h2>
          <RoomList />
        </div>

        {/* Voiceover timing guide */}
        <div className="card" style={{ padding: '18px' }}>
          <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            🎙 Voiceover Timing
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Use these timestamps when recording narration.
          </p>
          <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
            {timings.map((t, i) => (
              <li
                key={t.label + i}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.8125rem',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  background: activeRoomIndex === i && isPlaying ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${activeRoomIndex === i && isPlaying ? 'rgba(16,185,129,0.25)' : 'transparent'}`,
                  transition: 'all 0.2s ease',
                }}
              >
                <span style={{ color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: '8px' }}>
                  {i + 1}. {t.label}
                </span>
                <span style={{ color: '#34d399', fontFamily: 'monospace', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                  {t.start}s–{t.end}s
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};