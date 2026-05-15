import { useRef, useState } from 'react';
import { useStore } from '../store/useStore';

export const RoomList = () => {
  const { rooms, selectedRoomId, setSelectedRoomId, removeRoom, reorderRooms, addToast } = useStore();
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLDivElement | null>(null);

  if (rooms.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '28px 16px',
          color: 'var(--text-muted)',
          background: 'rgba(255,255,255,0.02)',
          borderRadius: '10px',
          border: '1px dashed var(--border)',
          fontSize: '0.8125rem',
        }}
      >
        <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📦</div>
        No zones yet. Draw one on the canvas!
      </div>
    );
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    dragNodeRef.current = e.currentTarget as HTMLDivElement;
    e.dataTransfer.effectAllowed = 'move';
    // Small delay so the ghost image renders
    setTimeout(() => {
      if (dragNodeRef.current) dragNodeRef.current.style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== toIndex) {
      reorderRooms(draggedIndex, toIndex);
      addToast('Animation order updated.', 'info');
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    if (dragNodeRef.current) dragNodeRef.current.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragNodeRef.current = null;
  };

  const handleDelete = (e: React.MouseEvent, id: string, label: string) => {
    e.stopPropagation();
    removeRoom(id);
    addToast(`"${label}" removed.`, 'info');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
          {rooms.length} ZONE{rooms.length !== 1 ? 'S' : ''} · DRAG TO REORDER
        </span>
      </div>

      {rooms.map((room, index) => {
        const isSelected = selectedRoomId === room.id;
        const isDraggingOver = dragOverIndex === index && draggedIndex !== index;

        return (
          <div
            key={room.id}
            id={`room-item-${room.id}`}
            className={`room-item${isSelected ? ' selected' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnter={(e) => handleDragEnter(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            onClick={() => setSelectedRoomId(isSelected ? null : room.id)}
            style={{
              borderTop: isDraggingOver ? '2px solid var(--accent-blue)' : undefined,
              transform: isDraggingOver ? 'translateY(2px)' : undefined,
            }}
          >
            {/* Drag handle */}
            <div
              className="drag-handle"
              style={{ color: 'var(--text-muted)', fontSize: '0.8rem', lineHeight: 1, flexShrink: 0 }}
              title="Drag to reorder"
            >
              ⠿
            </div>

            {/* Order number */}
            <div
              className="badge"
              style={{
                background: isSelected ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)',
                color: isSelected ? '#60a5fa' : 'var(--text-muted)',
                flexShrink: 0,
              }}
            >
              {index + 1}
            </div>

            {/* Color dot */}
            <div
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: room.color,
                flexShrink: 0,
                boxShadow: `0 0 6px ${room.color}80`,
              }}
            />

            {/* Label */}
            <span
              style={{
                flex: 1,
                fontSize: '0.875rem',
                fontWeight: isSelected ? 600 : 400,
                color: isSelected ? 'var(--text-primary)' : 'var(--text-secondary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {room.label}
            </span>

            {/* Delete button */}
            <button
              id={`delete-room-${room.id}`}
              onClick={(e) => handleDelete(e, room.id, room.label)}
              title={`Delete ${room.label}`}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '2px 4px',
                borderRadius: '4px',
                fontSize: '0.75rem',
                lineHeight: 1,
                opacity: 0,
                transition: 'opacity 0.15s',
                flexShrink: 0,
              }}
              className="delete-room-btn"
            >
              ✕
            </button>
          </div>
        );
      })}

      {/* Show delete buttons on parent hover via global style */}
      <style>{`
        .room-item:hover .delete-room-btn { opacity: 1 !important; }
        .delete-room-btn:hover { color: #f87171 !important; background: rgba(239,68,68,0.1) !important; }
      `}</style>
    </div>
  );
};
