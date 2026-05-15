import { ApiKeyInput } from './components/ApiKeyInput';
import { UploadPanel } from './components/UploadPanel';
import { useStore } from './store/useStore';

function App() {
  const { rooms, status } = useStore();

  return (
    <div className="min-h-screen p-8 flex flex-col items-center">
      <header className="mb-8 text-center mt-10">
        <h1 className="text-3xl font-bold text-white mb-2">FloorPlan Animator</h1>
        <p className="text-slate-400">Upload a 9:16 plan to generate an animated tour.</p>
      </header>

      <ApiKeyInput />
      <UploadPanel />

      {/* Temporary output to verify the AI is working */}
      {status === 'ready' && rooms.length > 0 && (
        <div className="mt-8 p-4 bg-slate-800 border border-slate-700 rounded w-full max-w-md">
          <h3 className="text-lg font-bold mb-2 text-emerald-400">AI Detection Success!</h3>
          <pre className="text-xs text-slate-300 overflow-auto max-h-40">
            {JSON.stringify(rooms, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default App;