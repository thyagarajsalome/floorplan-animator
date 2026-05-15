import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useStore } from '../store/useStore';
import { fileToBase64 } from '../utils/imageToBase64';
import { useGeminiVision } from '../hooks/useGeminiVision';

export const UploadPanel = () => {
  const { imageBase64, setImageBase64, status } = useStore();
  const { analyzeImage } = useGeminiVision();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      try {
        const base64 = await fileToBase64(file);
        setImageBase64(base64);
      } catch (error) {
        console.error("Failed to convert image", error);
      }
    }
  }, [setImageBase64]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/png': ['.png'], 'image/jpeg': ['.jpg', '.jpeg'] },
    maxFiles: 1
  });

  const handleAnalyze = () => {
    if (imageBase64) {
      analyzeImage(imageBase64);
    }
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      {/* Dropzone Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 bg-slate-800 hover:border-slate-500'}`}
      >
        <input {...getInputProps()} />
        {imageBase64 ? (
          <img src={imageBase64} alt="Floorplan preview" className="max-h-64 mx-auto object-contain rounded" />
        ) : (
          <p className="text-slate-400">Drag & drop your 9:16 floor plan here, or click to select files</p>
        )}
      </div>

      {/* Action Button */}
      {imageBase64 && (
        <button
          onClick={handleAnalyze}
          disabled={status === 'analyzing'}
          className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-600 text-white font-bold py-3 px-4 rounded transition-colors"
        >
          {status === 'analyzing' ? 'Analyzing Plan with AI...' : 'Detect Rooms'}
        </button>
      )}
    </div>
  );
};