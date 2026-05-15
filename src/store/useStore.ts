import { create } from 'zustand';

export interface Room {
  id: string;
  label: string;
  boundingBox: [number, number, number, number]; // [xmin, ymin, xmax, ymax]
  color?: string;
}

interface AppState {
  apiKey: string | null;
  setApiKey: (key: string) => void;
  imageBase64: string | null;
  setImageBase64: (base64: string) => void;
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  status: 'idle' | 'analyzing' | 'ready';
  setStatus: (status: 'idle' | 'analyzing' | 'ready') => void;
}

export const useStore = create<AppState>((set) => ({
  apiKey: localStorage.getItem('gemini_api_key'), // Load from browser storage immediately
  setApiKey: (key) => {
    localStorage.setItem('gemini_api_key', key);
    set({ apiKey: key });
  },
  imageBase64: null,
  setImageBase64: (base64) => set({ imageBase64: base64 }),
  rooms: [],
  setRooms: (rooms) => set({ rooms }),
  status: 'idle',
  setStatus: (status) => set({ status }),
}));