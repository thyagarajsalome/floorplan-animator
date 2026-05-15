import { ApiKeyInput } from './components/ApiKeyInput';
import { UploadPanel } from './components/UploadPanel';
import { CanvasPreview } from './components/CanvasPreview';
import { useStore } from './store/useStore';

function App() {
  const { status } = useStore();

  return (
    <div className="min-h-screen p-8 flex flex-col items-center pb-20">
      <header className="mb-8 text-center mt-4">
        <h1 className="text-3xl font-bold text-white mb-2">Auto-Zoner</h1>
        <p className="text-slate-400">Automate your 9:16 floor plan highlighting.</p>
      </header>

      {status !== 'ready' && <ApiKeyInput />}
      {status !== 'ready' && <UploadPanel />}
      
      {/* Show the canvas once the image is uploaded and analyzed */}
      <CanvasPreview />
      
    </div>
  );
}

export default App;