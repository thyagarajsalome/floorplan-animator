import { useState } from 'react';
import { useStore } from '../store/useStore';

export const ApiKeyInput = () => {
  const { apiKey, setApiKey } = useStore();
  const [inputKey, setInputKey] = useState(apiKey || '');

  const handleSave = () => {
    if (inputKey.trim()) {
      setApiKey(inputKey.trim());
    }
  };

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 w-full max-w-md mb-6">
      <h2 className="text-lg font-semibold mb-2">Gemini API Key</h2>
      <p className="text-sm text-slate-400 mb-4">
        Stored locally in your browser. Required to detect rooms automatically.
      </p>
      <div className="flex gap-2">
        <input
          type="password"
          value={inputKey}
          onChange={(e) => setInputKey(e.target.value)}
          placeholder="AIzaSy..."
          className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSave}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors font-medium"
        >
          {apiKey ? 'Saved' : 'Save'}
        </button>
      </div>
    </div>
  );
};