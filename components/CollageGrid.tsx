import React, { useState, useCallback, useMemo } from 'react';
import { useAutoAnimate } from '@formkit/auto-animate/react';
import { PhotoCard } from './PhotoCard';
import { CollageItem, LayoutType } from '../types';
import { compressImage } from '../utils/imageCompressor';

interface CollageGridProps {
  items: CollageItem[];
  layout: LayoutType;
  setItems: React.Dispatch<React.SetStateAction<CollageItem[]>>;
  gap: number;
  borderRadius: number;
}

const MemoizedGrid = React.memo(({ items, gridClass, gap, borderRadius, handleReplace, movingId, handleStartMove, handleCompleteMove, handleCancelMove }: any) => {
  const [parent] = useAutoAnimate<HTMLDivElement>({ duration: 300, easing: 'ease-in-out' });

  return (
    <div 
      ref={parent}
      className={`grid ${gridClass} w-full h-full`}
      style={{ gap: `${gap}px` }}
    >
      {items.map((item: any) => (
        <PhotoCard 
            key={item.id} 
            item={item} 
            onReplace={handleReplace}
            borderRadius={borderRadius}
            movingId={movingId}
            onStartMove={handleStartMove}
            onCompleteMove={handleCompleteMove}
            onCancelMove={handleCancelMove}
        />
      ))}
    </div>
  );
});

export const CollageGrid: React.FC<CollageGridProps> = ({ 
  items, 
  layout, 
  setItems, 
  gap,
  borderRadius
}) => {
  const [movingId, setMovingId] = useState<string | null>(null);

  const handleStartMove = useCallback((id: string) => {
    setMovingId(id);
  }, []);

  const handleCompleteMove = useCallback((targetId: string) => {
    if (movingId && movingId !== targetId) {
      setItems((prevItems) => {
        const oldIndex = prevItems.findIndex((item) => item.id === movingId);
        const newIndex = prevItems.findIndex((item) => item.id === targetId);
        
        if (oldIndex === -1 || newIndex === -1) return prevItems;

        const newArray = [...prevItems];
        const [movedItem] = newArray.splice(oldIndex, 1);
        newArray.splice(newIndex, 0, movedItem);
        return newArray;
      });
    }
    setMovingId(null);
  }, [movingId, setItems]);

  const handleCancelMove = useCallback(() => {
    setMovingId(null);
  }, []);

  const handleReplace = useCallback(async (id: string, file: File) => {
    try {
      const compressedFile = await compressImage(file);
      const url = URL.createObjectURL(compressedFile);
      setItems((prev) => {
        // Find the old item and revoke its URL if it's a blob to prevent memory leaks
        const oldItem = prev.find(item => item.id === id);
        if (oldItem && oldItem.url.startsWith('blob:')) {
          URL.revokeObjectURL(oldItem.url);
        }
        return prev.map((item) => (item.id === id ? { ...item, url } : item));
      });
    } catch (e) {
      console.error("Replacement failed", e);
    }
  }, [setItems]);

  const gridClass = useMemo(() => layout === LayoutType.GRID_2X2 ? 'grid-cols-2 grid-rows-2' : 'grid-cols-3 grid-rows-3', [layout]);

  return (
    <MemoizedGrid 
      items={items} 
      gridClass={gridClass} 
      gap={gap} 
      borderRadius={borderRadius} 
      handleReplace={handleReplace}
      movingId={movingId}
      handleStartMove={handleStartMove}
      handleCompleteMove={handleCompleteMove}
      handleCancelMove={handleCancelMove}
    />
  );
};