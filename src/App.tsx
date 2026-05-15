import { useEffect, useState } from 'react';
import { UploadPanel } from './components/UploadPanel';
import { CanvasPreview } from './components/CanvasPreview';
import { ZoneEditor } from './components/ZoneEditor';
import { Toast } from './components/Toast';
import { ApiKeyInput } from './components/ApiKeyInput';
import { useStore } from './store/useStore';
import './App.css';

type Mode = 'upload' | 'edit' | 'preview';

function App() {
  const { imageBase64, rooms, status } = useStore();
  const [mode, setMode] = useState<Mode>('upload');

  // Auto-advance to edit when image is ready
  useEffect(() => {
    if (imageBase64 && mode === 'upload') {
      setMode('edit');
    }
  }, [imageBase64]);

  // Allow going back to upload when image is cleared
  useEffect(() => {
    if (!imageBase64) setMode('upload');
  }, [imageBase64]);

  return (
    <div className="app-shell">
      {/* ─── Header ─── */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '1.5rem' }}>🏠</span>
          <div>
            <div className="app-logo">FloorPlan Animator</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-2px' }}>
              Powered by Gemini AI
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Compact API key status */}
          <ApiKeyInput compact />

          {/* Navigation tabs — only when image loaded */}
          {imageBase64 && (
            <nav className="tab-bar" aria-label="App navigation">
              <button
                id="tab-upload"
                className={`tab-btn${mode === 'upload' ? ' active' : ''}`}
                onClick={() => setMode('upload')}
              >
                <span>📁</span> Upload
              </button>
              <button
                id="tab-edit"
                className={`tab-btn${mode === 'edit' ? ' active' : ''}`}
                onClick={() => setMode('edit')}
              >
                <span>✏️</span> Draw Zones
                {rooms.length > 0 && (
                  <span
                    style={{
                      background: 'rgba(255,255,255,0.2)',
                      borderRadius: '10px',
                      padding: '1px 7px',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                    }}
                  >
                    {rooms.length}
                  </span>
                )}
              </button>
              <button
                id="tab-preview"
                className={`tab-btn${mode === 'preview' ? ' active emerald' : ''}`}
                onClick={() => setMode('preview')}
                disabled={rooms.length === 0}
                title={rooms.length === 0 ? 'Draw at least one zone first' : undefined}
              >
                <span>🎬</span> Animate
              </button>
            </nav>
          )}
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="app-main">
        {/* Upload mode: show full panel */}
        {mode === 'upload' && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              paddingTop: '48px',
            }}
          >
            {/* Hero text */}
            {!imageBase64 && (
              <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                <h1
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
                    fontWeight: 800,
                    lineHeight: 1.15,
                    letterSpacing: '-0.03em',
                    background: 'linear-gradient(135deg, #f1f5f9 0%, #94a3b8 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginBottom: '14px',
                  }}
                >
                  Animate your floor plans<br />
                  <span
                    style={{
                      background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}
                  >
                    with AI
                  </span>
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: '420px', margin: '0 auto' }}>
                  Upload a floor plan → AI detects every room → Export a cinematic walkthrough video.
                </p>

                {/* Feature pills */}
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap', marginTop: '24px' }}>
                  {['🤖 Gemini AI Detection', '🎬 Video Export', '✏️ Manual Zones', '🔁 Loop & Speed Control'].map((f) => (
                    <span
                      key={f}
                      style={{
                        padding: '5px 14px',
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid var(--border)',
                        borderRadius: '20px',
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <UploadPanel />
          </div>
        )}

        {/* Edit mode */}
        {mode === 'edit' && imageBase64 && (
          <div className="animate-fade-in">
            {status === 'analyzing' && (
              <div
                style={{
                  textAlign: 'center',
                  padding: '14px',
                  background: 'rgba(59,130,246,0.08)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  color: '#60a5fa',
                  fontSize: '0.875rem',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                }}
              >
                <span className="animate-spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(96,165,250,0.3)', borderTopColor: '#60a5fa', borderRadius: '50%' }} />
                Gemini AI is analyzing your floor plan…
              </div>
            )}
            <ZoneEditor />
          </div>
        )}

        {/* Preview mode */}
        {mode === 'preview' && imageBase64 && rooms.length > 0 && (
          <div className="animate-fade-in">
            <CanvasPreview />
          </div>
        )}

        {/* Edge case: preview with no rooms */}
        {mode === 'preview' && rooms.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 24px', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🗺</div>
            <p>Draw some zones first, then come back to preview the animation.</p>
            <button
              onClick={() => setMode('edit')}
              className="btn-primary"
              style={{ marginTop: '20px', width: 'auto', padding: '10px 24px', display: 'inline-flex' }}
            >
              ✏️ Go to Zone Editor
            </button>
          </div>
        )}
      </main>

      {/* Global toast notifications */}
      <Toast />
    </div>
  );
}

export default App;