import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStore } from '../store/useStore';
import { fileToBase64 } from '../utils/imageToBase64';
import { useGeminiVision } from '../hooks/useGeminiVision';
import { ApiKeyInput } from './ApiKeyInput';

export const UploadPanel = () => {
  const { imageBase64, setImageBase64, setImageDimensions, status, apiKey, clearRooms } = useStore();
  const { analyzeImage } = useGeminiVision();
  const [previewDimensions, setPreviewDimensions] = useState<{ w: number; h: number } | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    try {
      const base64 = await fileToBase64(file);
      setImageBase64(base64);

      // Auto-detect natural image dimensions
      const img = new Image();
      img.onload = () => {
        setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        setPreviewDimensions({ w: img.naturalWidth, h: img.naturalHeight });
      };
      img.src = base64;
    } catch (error) {
      console.error('Failed to convert image', error);
    }
  }, [setImageBase64, setImageDimensions]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'], 'image/webp': ['.webp'] },
    maxFiles: 1,
  });

  const handleAnalyze = () => {
    if (imageBase64) analyzeImage(imageBase64);
  };

  const handleReset = () => {
    setImageBase64(null as any);
    setImageDimensions(null);
    clearRooms();
    setPreviewDimensions(null);
  };

  const isAnalyzing = status === 'analyzing';

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '480px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        animation: 'slide-in-up 0.4s ease both',
      }}
      className="animate-slide-up"
    >
      {/* API Key section */}
      <ApiKeyInput compact={false} />

      {/* Drop zone */}
      <div
        {...getRootProps()}
        id="upload-dropzone"
        style={{
          border: `2px dashed ${isDragActive ? '#3b82f6' : imageBase64 ? 'rgba(16,185,129,0.4)' : 'var(--border-light)'}`,
          borderRadius: '14px',
          padding: imageBase64 ? '12px' : '48px 24px',
          textAlign: 'center',
          cursor: 'pointer',
          background: isDragActive
            ? 'rgba(59,130,246,0.07)'
            : imageBase64
              ? 'rgba(16,185,129,0.04)'
              : 'rgba(13,22,38,0.5)',
          transition: 'all 0.2s ease',
          position: 'relative',
        }}
      >
        <input {...getInputProps()} id="upload-file-input" />

        {imageBase64 ? (
          <div style={{ position: 'relative' }}>
            <img
              src={imageBase64}
              alt="Floorplan preview"
              style={{ maxHeight: '280px', width: '100%', objectFit: 'contain', borderRadius: '8px', display: 'block' }}
            />
            {previewDimensions && (
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '8px',
                  background: 'rgba(0,0,0,0.7)',
                  backdropFilter: 'blur(8px)',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                  fontFamily: 'monospace',
                }}
              >
                {previewDimensions.w} × {previewDimensions.h}
              </div>
            )}
            <div
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
                borderRadius: '6px',
                padding: '3px 8px',
                fontSize: '0.7rem',
                color: '#94a3b8',
              }}
            >
              Click to replace
            </div>
          </div>
        ) : (
          <div style={{ pointerEvents: 'none' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>
              {isDragActive ? '🎯' : '📐'}
            </div>
            <p style={{ color: isDragActive ? '#60a5fa' : 'var(--text-secondary)', fontWeight: 500, marginBottom: '6px', fontSize: '0.9375rem' }}>
              {isDragActive ? 'Drop your floor plan here!' : 'Drag & drop your floor plan'}
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
              PNG, JPG, or WebP — any aspect ratio
            </p>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {imageBase64 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button
            id="analyze-btn"
            onClick={handleAnalyze}
            disabled={isAnalyzing || !apiKey}
            className="btn-emerald"
            style={{ padding: '12px', fontSize: '0.9375rem' }}
          >
            {isAnalyzing ? (
              <>
                <span className="animate-spin" style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%' }} />
                Analyzing with Gemini AI…
              </>
            ) : (
              <>🤖 Auto-Detect Rooms with AI</>
            )}
          </button>

          {!apiKey && (
            <p style={{ fontSize: '0.75rem', color: '#f87171', textAlign: 'center' }}>
              ↑ Enter your Gemini API key above to enable AI detection
            </p>
          )}

          <button
            id="reset-btn"
            onClick={handleReset}
            className="btn-ghost"
            style={{ fontSize: '0.8125rem' }}
          >
            🗑 Remove Image & Start Over
          </button>
        </div>
      )}
    </div>
  );
};