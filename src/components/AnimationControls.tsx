import { useStore } from '../store/useStore';

export const AnimationControls = () => {
  const {
    animationSpeed,
    setAnimationSpeed,
    loopAnimation,
    setLoopAnimation,
    durationPerRoom,
    setDurationPerRoom,
    rooms,
  } = useStore();

  const totalDurationSec = ((durationPerRoom / animationSpeed) * rooms.length) / 1000;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

      {/* Duration per room */}
      <div>
        <label className="label" htmlFor="duration-slider">
          Duration per Room
          <span style={{ float: 'right', color: 'var(--text-primary)', fontWeight: 600 }}>
            {(durationPerRoom / 1000).toFixed(1)}s
          </span>
        </label>
        <input
          id="duration-slider"
          type="range"
          min={1000}
          max={6000}
          step={250}
          value={durationPerRoom}
          onChange={(e) => setDurationPerRoom(Number(e.target.value))}
          style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
          <span>1s (fast)</span>
          <span>6s (slow)</span>
        </div>
      </div>

      {/* Playback speed */}
      <div>
        <label className="label" htmlFor="speed-select">
          Playback Speed
        </label>
        <div style={{ display: 'flex', gap: '6px' }} id="speed-select">
          {[0.5, 1, 1.5, 2].map((s) => (
            <button
              key={s}
              id={`speed-${s}`}
              onClick={() => setAnimationSpeed(s)}
              style={{
                flex: 1,
                padding: '7px 0',
                borderRadius: '8px',
                border: animationSpeed === s ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
                background: animationSpeed === s ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.03)',
                color: animationSpeed === s ? '#60a5fa' : 'var(--text-secondary)',
                fontSize: '0.8125rem',
                fontWeight: animationSpeed === s ? 700 : 400,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
              }}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Loop toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)' }}>Loop Animation</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Replay automatically when done</div>
        </div>
        <button
          id="loop-toggle"
          onClick={() => setLoopAnimation(!loopAnimation)}
          aria-pressed={loopAnimation}
          aria-label="Toggle loop animation"
          style={{
            width: '44px',
            height: '24px',
            borderRadius: '12px',
            border: 'none',
            background: loopAnimation ? 'var(--accent-blue)' : 'var(--border-light)',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background 0.2s ease',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              position: 'absolute',
              top: '3px',
              left: loopAnimation ? '23px' : '3px',
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: '#fff',
              transition: 'left 0.2s ease',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
            }}
          />
        </button>
      </div>

      {/* Total duration summary */}
      {rooms.length > 0 && (
        <div
          style={{
            padding: '12px 14px',
            background: 'rgba(59,130,246,0.07)',
            border: '1px solid rgba(59,130,246,0.15)',
            borderRadius: '10px',
            fontSize: '0.8125rem',
            color: 'var(--text-secondary)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Total animation length</span>
            <span style={{ color: '#60a5fa', fontWeight: 700, fontFamily: 'monospace' }}>
              {totalDurationSec.toFixed(1)}s
            </span>
          </div>
          {loopAnimation && (
            <div style={{ marginTop: '4px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              🔁 Loops continuously
            </div>
          )}
        </div>
      )}
    </div>
  );
};
