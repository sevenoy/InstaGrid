import React, { useRef } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Move, RefreshCw } from 'lucide-react';
import { CollageItem } from '../types';

interface PhotoCardProps {
  item: CollageItem;
  onReplace: (id: string, file: File) => void;
  isOverlay?: boolean;
  borderRadius: number;
}

export const PhotoCard: React.FC<PhotoCardProps> = ({ item, onReplace, isOverlay = false, borderRadius }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 'auto',
    opacity: isDragging ? 0.3 : 1,
    borderRadius: `${borderRadius}px`, // Dynamic border radius
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onReplace(item.id, e.target.files[0]);
    }
  };

  const triggerUpload = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent drag start
    fileInputRef.current?.click();
  };

  // FIX: Removed 'border-2' which takes up physical space. 
  // Used 'ring-2 ring-inset' instead, which is visual only and doesn't affect layout dimensions.
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group w-full h-full overflow-hidden bg-gray-100 ${
        isDragging ? 'ring-2 ring-inset ring-primary shadow-2xl' : 'ring-0 hover:ring-2 hover:ring-inset hover:ring-indigo-300/50'
      } transition-all duration-200`}
      {...attributes}
      {...listeners}
    >
      <img
        src={item.url}
        alt="Collage fragment"
        className="w-full h-full object-cover pointer-events-none select-none"
      />
      
      {/* Overlay Controls */}
      {!isOverlay && (
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
          <div className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full mb-2 flex items-center gap-1">
             <Move size={12} /> 拖动排序
          </div>
          
          <button
            onClick={triggerUpload}
            className="flex items-center gap-2 px-4 py-2 bg-white text-slate-900 rounded-full font-semibold text-sm hover:bg-indigo-50 active:scale-95 transition-transform shadow-lg cursor-pointer"
            onPointerDown={(e) => e.stopPropagation()} 
          >
            <RefreshCw size={14} />
            替换图片
          </button>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />
    </div>
  );
};