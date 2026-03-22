import React, { useRef, memo } from 'react';
import { Move, RefreshCw, Check, X } from 'lucide-react';
import { CollageItem } from '../types';

interface PhotoCardProps {
  item: CollageItem;
  onReplace: (id: string, file: File) => void;
  borderRadius: number;
  movingId?: string | null;
  onStartMove?: (id: string) => void;
  onCompleteMove?: (id: string) => void;
  onCancelMove?: () => void;
}

export const PhotoCard: React.FC<PhotoCardProps> = memo(({ 
  item, 
  onReplace, 
  borderRadius,
  movingId = null,
  onStartMove = (_id: string) => {},
  onCompleteMove = (_id: string) => {},
  onCancelMove = () => {}
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isMovingThis = movingId === item.id;
  const isMoveTargetMode = movingId !== null && !isMovingThis;

  const style: React.CSSProperties = {
    borderRadius: `${borderRadius}px`,
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onReplace(item.id, e.target.files[0]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleCardClick = () => {
    if (isMoveTargetMode) {
      onCompleteMove(item.id);
    }
  };

  return (
    <div
      style={style}
      onClick={handleCardClick}
      className={`relative group/card w-full h-full min-h-0 min-w-0 overflow-hidden bg-gray-100 ${
        isMovingThis ? 'ring-4 ring-indigo-500 rounded-3xl z-10 scale-[1.02] shadow-xl transition-all' :
        isMoveTargetMode ? 'cursor-pointer ring-2 ring-transparent hover:ring-indigo-300 hover:scale-[1.01] transition-all' : 
        'ring-0 transition-shadow transition-colors duration-200'
      }`}
    >
      <img
        src={item.url}
        alt="Collage fragment"
        className={`w-full h-full object-cover select-none transition-opacity duration-300 ${isMoveTargetMode ? 'opacity-70 group-hover/card:opacity-100' : ''}`}
      />
      
      {/* Overlay Controls */}
      {movingId === null && (
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); onStartMove(item.id); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600/95 text-white rounded-full font-bold text-sm hover:bg-indigo-500 hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
          >
            <Move size={16} />
            移动位置
          </button>
          <button
            onClick={triggerUpload}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/95 text-slate-800 rounded-full font-bold text-sm hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
          >
            <RefreshCw size={16} className="text-indigo-600" />
            替换图片
          </button>
        </div>
      )}

      {isMoveTargetMode && (
        <div className="absolute inset-0 flex items-center justify-center bg-indigo-500/20 opacity-0 group-hover/card:opacity-100 transition-opacity">
          <div className="px-4 py-2 bg-indigo-600 text-white rounded-full font-bold text-sm shadow-xl flex items-center gap-2">
            <Check size={16} />
            移动到此
          </div>
        </div>
      )}

      {isMovingThis && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-opacity z-20">
          <button
            onClick={(e) => { e.stopPropagation(); onCancelMove(); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-500/95 text-white rounded-full font-bold text-sm hover:bg-rose-400 hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer"
          >
            <X size={16} />
            取消移动
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
}, (prevProps, nextProps) => {
  return (
    prevProps.item.id === nextProps.item.id &&
    prevProps.item.url === nextProps.item.url &&
    prevProps.borderRadius === nextProps.borderRadius &&
    prevProps.movingId === nextProps.movingId
  );
});

PhotoCard.displayName = 'PhotoCard';