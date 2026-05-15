import { useState } from 'react';
import { useStore } from '../store/useStore';

interface ApiKeyInputProps {
  compact?: boolean;
}

export const ApiKeyInput = ({ compact = false }: ApiKeyInputProps) => {
  const { apiKey, setApiKey, openaiApiKey, setOpenaiApiKey, addToast } = useStore();
  
  // Gemini State
  const [inputKey, setInputKey] = useState(apiKey || '');
  const [visible, setVisible] = useState(false);
  const [saved, setSaved] = useState(!!apiKey);

  // OpenAI State
  const [inputOpenai, setInputOpenai] = useState(openaiApiKey || '');
  const [visibleOpenai, setVisibleOpenai] = useState(false);
  const [savedOpenai, setSavedOpenai] = useState(!!openaiApiKey);

  const handleSaveGemini = () => {
    const trimmed = inputKey.trim();
    if (!trimmed) return;
    setApiKey(trimmed);
    setSaved(true);
    addToast('Gemini API key saved.', 'success');
  };

  const handleClearGemini = () => {
    setApiKey('');
    setInputKey('');
    setSaved(false);
    localStorage.removeItem('gemini_api_key');
    addToast('Gemini API key cleared.', 'info');
  };

  const handleSaveOpenai = () => {
    const trimmed = inputOpenai.trim();
    if (!trimmed) return;
    setOpenaiApiKey(trimmed);
    setSavedOpenai(true);
    addToast('OpenAI API key saved.', 'success');
  };

  const handleClearOpenai = () => {
    setOpenaiApiKey('');
    setInputOpenai('');
    setSavedOpenai(false);
    localStorage.removeItem('openai_api_key');
    addToast('OpenAI API key cleared.', 'info');
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '8px',
            background: apiKey ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${apiKey ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            fontSize: '0.75rem', color: apiKey ? '#34d399' : '#f87171', fontWeight: 500,
          }}
          title="Gemini Vision API"
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: apiKey ? '#34d399' : '#f87171' }} />
          Gemini
        </div>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '5px 12px', borderRadius: '8px',
            background: openaiApiKey ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
            border: `1px solid ${openaiApiKey ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
            fontSize: '0.75rem', color: openaiApiKey ? '#34d399' : '#f87171', fontWeight: 500,
          }}
          title="OpenAI TTS API"
        >
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: openaiApiKey ? '#34d399' : '#f87171' }} />
          OpenAI
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Gemini API Key */}
      <div style={{ background: 'rgba(13, 22, 38, 0.7)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
              🤖 Gemini API Key
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required for Auto-Zoning. Stored locally.</p>
          </div>
          {apiKey && (
            <button onClick={handleClearGemini} className="btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem', width: 'auto', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}>Clear</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type={visible ? 'text' : 'password'}
              value={inputKey}
              onChange={(e) => { setInputKey(e.target.value); setSaved(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveGemini()}
              placeholder="AIzaSy..."
              className="input-field"
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setVisible(!visible)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              {visible ? '🙈' : '👁️'}
            </button>
          </div>
          <button
            onClick={handleSaveGemini}
            disabled={!inputKey.trim() || saved}
            className="btn-primary"
            style={{ width: 'auto', background: saved ? 'rgba(16,185,129,0.15)' : '', color: saved ? '#34d399' : '', boxShadow: saved ? 'none' : '' }}
          >
            {saved ? '✓ Saved' : 'Save Key'}
          </button>
        </div>
      </div>

      {/* OpenAI API Key */}
      <div style={{ background: 'rgba(13, 22, 38, 0.7)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>
              🎙 OpenAI API Key
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Required for Automated Voiceovers. Stored locally.</p>
          </div>
          {openaiApiKey && (
            <button onClick={handleClearOpenai} className="btn-ghost" style={{ padding: '4px 10px', fontSize: '0.75rem', width: 'auto', color: '#f87171', borderColor: 'rgba(239,68,68,0.3)' }}>Clear</button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type={visibleOpenai ? 'text' : 'password'}
              value={inputOpenai}
              onChange={(e) => { setInputOpenai(e.target.value); setSavedOpenai(false); }}
              onKeyDown={(e) => e.key === 'Enter' && handleSaveOpenai()}
              placeholder="sk-..."
              className="input-field"
              style={{ paddingRight: '40px' }}
            />
            <button
              type="button"
              onClick={() => setVisibleOpenai(!visibleOpenai)}
              style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              {visibleOpenai ? '🙈' : '👁️'}
            </button>
          </div>
          <button
            onClick={handleSaveOpenai}
            disabled={!inputOpenai.trim() || savedOpenai}
            className="btn-primary"
            style={{ width: 'auto', background: savedOpenai ? 'rgba(16,185,129,0.15)' : '', color: savedOpenai ? '#34d399' : '', boxShadow: savedOpenai ? 'none' : '' }}
          >
            {savedOpenai ? '✓ Saved' : 'Save Key'}
          </button>
        </div>
      </div>
    </div>
  );
};