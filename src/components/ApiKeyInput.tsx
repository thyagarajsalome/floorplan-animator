import { useState } from 'react';
import { useStore } from '../store/useStore';

interface ApiKeyInputProps {
  compact?: boolean;
}

export const ApiKeyInput = ({ compact = false }: ApiKeyInputProps) => {
  const { apiKey, setApiKey, addToast } = useStore();
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(!!apiKey);

  const handleSave = () => {
    const trimmed = inputKey.trim();
    if (!trimmed) return;
    setApiKey(trimmed);
    setSaved(true);
    addToast('API key saved securely in your browser.', 'success');
  };

  const handleChange = (val: string) => {
    setInputKey(val);
    setSaved(false);
  };

  const handleClear = () => {
    setApiKey('');
    setInputKey('');
    setSaved(false);
    localStorage.removeItem('gemini_api_key');
    addToast('API key cleared.', 'info');
  };

  if (compact) {
    // Header compact mode: just a small indicator + popover trigger
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '8px',
            background: apiKey ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${apiKey ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            fontSize: '0.8rem',
            color: apiKey ? '#34d399' : '#f87171',
            fontWeight: 500,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: apiKey ? '#34d399' : '#f87171', display: 'inline-block' }} />
          {apiKey ? 'API Key Set' : 'No API Key'}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'rgba(13, 22, 38, 0.7)',
        border: '1px solid var(--border)',
        borderRadius: '14px',
        padding: '20px',
        width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
            🔑 Gemini API Key
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Stored locally only. Never sent to our servers.
          </p>
        </div>
        {apiKey && (
          <button
            onClick={handleClear}
            style={{
              fontSize: '0.75rem',
              color: '#f87171',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              borderRadius: '6px',
              padding: '4px 10px',
              cursor: 'pointer',
            }}
          >
            Clear
          </button>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <input
            id="gemini-api-key"
            type={visible ? 'text' : 'password'}
            value={inputKey}
            onChange={(e) => handleChange(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="AIzaSy..."
            className="input-field"
            style={{ paddingRight: '40px' }}
            autoComplete="off"
          />
          <button
            type="button"
            onClick={() => setVisible(!visible)}
            aria-label={visible ? 'Hide API key' : 'Show API key'}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {visible ? '🙈' : '👁️'}
          </button>
        </div>
        <button
          onClick={handleSave}
          disabled={!inputKey.trim() || saved}
          style={{
            padding: '10px 18px',
            borderRadius: '8px',
            border: 'none',
            cursor: inputKey.trim() && !saved ? 'pointer' : 'not-allowed',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: saved
              ? 'rgba(16,185,129,0.15)'
              : 'linear-gradient(135deg, #3b82f6, #2563eb)',
            color: saved ? '#34d399' : '#fff',
            boxShadow: saved ? 'none' : '0 2px 12px rgba(59,130,246,0.3)',
            transition: 'all 0.2s ease',
            whiteSpace: 'nowrap',
          }}
        >
          {saved ? '✓ Saved' : 'Save Key'}
        </button>
      </div>
    </div>
  );
};