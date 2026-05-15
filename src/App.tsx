import { useState } from 'react';
import { UploadPanel } from './components/UploadPanel';
import { CanvasPreview } from './components/CanvasPreview';
import { ZoneEditor } from './components/ZoneEditor';
import { useStore } from './store/useStore';

function App() {
  const { imageBase64 } = useStore();
  const [mode, setMode] = useState<'upload' | 'edit' | 'preview'>('upload');

  // Automatically switch to edit mode when an image is uploaded
  if (imageBase64 && mode === 'upload') {
    setMode('edit');
  }

  return (
    <div className="min-h-screen p-8 flex flex-col items-center pb-20">
      <header className="mb-8 text-center mt-4">
        <h1 className="text-3xl font-bold text-white mb-2">Auto-Zoner Pro</h1>
        <p className="text-slate-400">Map your 9:16 floor plans and animate them.</p>
      </header>

      {/* Navigation Tabs */}
      {imageBase64 && (
        <div className="flex gap-4 mb-8 bg-slate-800 p-2 rounded-lg">
          <button 
            onClick={() => setMode('edit')}
            className={`px-6 py-2 rounded font-bold transition-colors ${mode === 'edit' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            1. Draw Zones
          </button>
          <button 
            onClick={() => setMode('preview')}
            className={`px-6 py-2 rounded font-bold transition-colors ${mode === 'preview' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            2. Play Animation
          </button>
        </div>
      )}

      {mode === 'upload' && <UploadPanel />}
      {mode === 'edit' && imageBase64 && <ZoneEditor />}
      {mode === 'preview' && imageBase64 && <CanvasPreview />}
      
    </div>
  );
}

export default App;