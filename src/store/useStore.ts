import { create } from 'zustand';

export interface Room {
  id: string;
  label: string;
  boundingBox: [number, number, number, number]; 
  color: string;
  strokeWidth: number; // <-- Property for line thickness
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
  
  addRoom: (room: Room) => void;
  removeRoom: (id: string) => void;
  clearRooms: () => void;
  updateRoom: (id: string, updates: Partial<Room>) => void; // <-- Update action
  
  selectedRoomId: string | null; // <-- Selection state
  setSelectedRoomId: (id: string | null) => void;

  // --- NEW: Audio State for MP3 Voiceovers ---
  audioUrl: string | null;
  setAudioUrl: (url: string | null) => void;
}

export const useStore = create<AppState>((set) => ({
  apiKey: localStorage.getItem('gemini_api_key'), 
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

  addRoom: (room) => set((state) => ({ rooms: [...state.rooms, room] })),
  removeRoom: (id) => set((state) => ({ 
    rooms: state.rooms.filter(r => r.id !== id),
    selectedRoomId: state.selectedRoomId === id ? null : state.selectedRoomId
  })),
  clearRooms: () => set({ rooms: [], selectedRoomId: null }),
  updateRoom: (id, updates) => set((state) => ({
    rooms: state.rooms.map(room => room.id === id ? { ...room, ...updates } : room)
  })),
  
  selectedRoomId: null,
  setSelectedRoomId: (id) => set({ selectedRoomId: id }),

  // --- NEW: Audio Initializer ---
  audioUrl: null,
  setAudioUrl: (url) => set({ audioUrl: url })
}));