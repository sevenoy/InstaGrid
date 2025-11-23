import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { PhotoCard } from './PhotoCard';
import { CollageItem, LayoutType } from '../types';

interface CollageGridProps {
  items: CollageItem[];
  layout: LayoutType;
  setItems: React.Dispatch<React.SetStateAction<CollageItem[]>>;
  gap: number;
  borderRadius: number;
}

export const CollageGrid: React.FC<CollageGridProps> = ({ 
  items, 
  layout, 
  setItems, 
  gap,
  borderRadius
}) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
        activationConstraint: {
            distance: 5 // Avoid triggering drag on simple clicks
        }
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setItems((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }

    setActiveId(null);
  };

  const handleReplace = (id: string, file: File) => {
    const url = URL.createObjectURL(file);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, url } : item))
    );
  };

  const gridClass = layout === LayoutType.GRID_2X2 ? 'grid-cols-2' : 'grid-cols-3';
  const activeItem = items.find(item => item.id === activeId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div 
        className={`grid ${gridClass} w-full h-full`}
        style={{ gap: `${gap}px` }}
      >
        <SortableContext items={items} strategy={rectSortingStrategy}>
          {items.map((item) => (
            <PhotoCard 
                key={item.id} 
                item={item} 
                onReplace={handleReplace}
                borderRadius={borderRadius}
            />
          ))}
        </SortableContext>
      </div>

      <DragOverlay adjustScale={true}>
        {activeItem ? (
          <PhotoCard 
            item={activeItem} 
            onReplace={() => {}} 
            isOverlay 
            borderRadius={borderRadius}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};