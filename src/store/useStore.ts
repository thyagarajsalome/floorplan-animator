import { create } from 'zustand';

export interface Room {
  id: string;
  label: string;
  boundingBox: [number, number, number, number];
  color: string;
  strokeWidth: number;
  fontSize?: number;
  textColor?: string;
}

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppState {
  // API Key
  apiKey: string | null;
  setApiKey: (key: string) => void;

  // Image
  imageBase64: string | null;
  setImageBase64: (base64: string) => void;
  imageDimensions: { width: number; height: number } | null;
  setImageDimensions: (dims: { width: number; height: number } | null) => void;

  // Rooms
  rooms: Room[];
  setRooms: (rooms: Room[]) => void;
  addRoom: (room: Room) => void;
  removeRoom: (id: string) => void;
  clearRooms: () => void;
  updateRoom: (id: string, updates: Partial<Room>) => void;
  reorderRooms: (fromIndex: number, toIndex: number) => void;

  // Selection
  selectedRoomId: string | null;
  setSelectedRoomId: (id: string | null) => void;

  // Status
  status: 'idle' | 'analyzing' | 'ready' | 'error';
  setStatus: (status: 'idle' | 'analyzing' | 'ready' | 'error') => void;

  // Animation Settings
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  loopAnimation: boolean;
  setLoopAnimation: (loop: boolean) => void;
  durationPerRoom: number;
  setDurationPerRoom: (ms: number) => void;

  // Toast Notifications
  toasts: Toast[];
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;

  // Undo History
  roomHistory: Room[][];
  pushHistory: () => void;
  undo: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // API Key
  apiKey: localStorage.getItem('gemini_api_key'),
  setApiKey: (key) => {
    localStorage.setItem('gemini_api_key', key);
    set({ apiKey: key });
  },

  // Image
  imageBase64: null,
  setImageBase64: (base64) => set({ imageBase64: base64 }),
  imageDimensions: null,
  setImageDimensions: (dims) => set({ imageDimensions: dims }),

  // Rooms
  rooms: [],
  setRooms: (rooms) => set({ rooms }),
  addRoom: (room) => {
    get().pushHistory();
    set((state) => ({ rooms: [...state.rooms, room] }));
  },
  removeRoom: (id) => {
    get().pushHistory();
    set((state) => ({
      rooms: state.rooms.filter((r) => r.id !== id),
      selectedRoomId: state.selectedRoomId === id ? null : state.selectedRoomId,
    }));
  },
  clearRooms: () => {
    get().pushHistory();
    set({ rooms: [], selectedRoomId: null });
  },
  updateRoom: (id, updates) =>
    set((state) => ({
      rooms: state.rooms.map((room) => (room.id === id ? { ...room, ...updates } : room)),
    })),
  reorderRooms: (fromIndex, toIndex) =>
    set((state) => {
      const rooms = [...state.rooms];
      const [moved] = rooms.splice(fromIndex, 1);
      rooms.splice(toIndex, 0, moved);
      return { rooms };
    }),

  // Selection
  selectedRoomId: null,
  setSelectedRoomId: (id) => set({ selectedRoomId: id }),

  // Status
  status: 'idle',
  setStatus: (status) => set({ status }),

  // Animation Settings
  animationSpeed: 1,
  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
  loopAnimation: false,
  setLoopAnimation: (loop) => set({ loopAnimation: loop }),
  durationPerRoom: 2500,
  setDurationPerRoom: (ms) => set({ durationPerRoom: ms }),

  // Toast Notifications
  toasts: [],
  addToast: (message, type) => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
    setTimeout(() => get().removeToast(id), 4000);
  },
  removeToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),

  // Undo History
  roomHistory: [],
  pushHistory: () =>
    set((state) => ({
      roomHistory: [...state.roomHistory.slice(-19), [...state.rooms]],
    })),
  undo: () =>
    set((state) => {
      if (state.roomHistory.length === 0) return {};
      const history = [...state.roomHistory];
      const previous = history.pop()!;
      return { rooms: previous, roomHistory: history, selectedRoomId: null };
    }),
}));