'use client';

import type { Note as NoteType } from '@/lib/types';
import React, { useState, useRef, useEffect, useCallback, MouseEvent, TouchEvent, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NoteProps {
  note: NoteType;
  onUpdate: (note: NoteType) => void;
  onDelete: (id: string) => void;
  viewportScale: number;
}

export function Note({ note, onUpdate, onDelete, viewportScale }: NoteProps) {
  const [isEditing, setIsEditing] = useState(note.content === '');
  const [isDragging, setIsDragging] = useState(false);
  const [widthLocked, setWidthLocked] = useState(() => note.content.includes('\n'));
  
  const noteRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dragStart = useRef({ x: 0, y: 0, noteX: 0, noteY: 0 });
  const lastTap = useRef(0);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing]);
  
  const handleStartDrag = (clientX: number, clientY: number) => {
    setIsDragging(true);
    dragStart.current = {
      x: clientX,
      y: clientY,
      noteX: note.x,
      noteY: note.y,
    };
  };

  const handleDrag = useCallback((clientX: number, clientY: number) => {
    if (!isDragging) return;
    const dx = (clientX - dragStart.current.x) / viewportScale;
    const dy = (clientY - dragStart.current.y) / viewportScale;
    onUpdate({ ...note, x: dragStart.current.noteX + dx, y: dragStart.current.noteY + dy });
  }, [isDragging, onUpdate, note, viewportScale]);

  const handleEndDrag = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  useEffect(() => {
    const handleGlobalMouseMove = (e: globalThis.MouseEvent) => handleDrag(e.clientX, e.clientY);
    const handleGlobalMouseUp = () => handleEndDrag();
    const handleGlobalTouchMove = (e: globalThis.TouchEvent) => e.touches.length === 1 && handleDrag(e.touches[0].clientX, e.touches[0].clientY);
    const handleGlobalTouchEnd = () => handleEndDrag();

    if (isDragging) {
      window.addEventListener('mousemove', handleGlobalMouseMove);
      window.addEventListener('mouseup', handleGlobalMouseUp);
      window.addEventListener('touchmove', handleGlobalTouchMove);
      window.addEventListener('touchend', handleGlobalTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalTouchMove);
      window.removeEventListener('touchend', handleGlobalTouchEnd);
    };
  }, [isDragging, handleDrag, handleEndDrag]);


  const handleMouseDown = (e: MouseEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    handleStartDrag(e.clientX, e.clientY);
  };
  
  const handleTouchStart = (e: TouchEvent) => {
    if (isEditing) return;
    e.stopPropagation();
    handleDoubleTap(e);
    if(e.touches.length === 1) handleStartDrag(e.touches[0].clientX, e.touches[0].clientY);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (!widthLocked) {
        e.preventDefault();
        setWidthLocked(true);
      }
    }
  };
  
  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    const newContent = textarea.value;
    let newWidth = note.width;

    if (!widthLocked && !newContent.includes('\n')) {
      // Temporarily change styles to measure unwrapped text width
      const originalWhiteSpace = textarea.style.whiteSpace;
      textarea.style.whiteSpace = 'pre';
      // Add a small buffer to prevent immediate re-wrapping
      newWidth = textarea.scrollWidth + 4;
      textarea.style.whiteSpace = originalWhiteSpace;
    } else if (newContent.includes('\n') && !widthLocked) {
      // Lock width if a newline is pasted
      setWidthLocked(true);
    }

    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;

    onUpdate({ ...note, content: newContent, width: Math.max(newWidth, 150), height: textarea.scrollHeight });
  };
  
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsEditing(false);
    if (e.target.value.trim() === '') {
      onDelete(note.id);
    } else {
        const newHeight = Math.max(50, e.target.scrollHeight);
        onUpdate({ ...note, height: newHeight, width: note.width });
    }
  };

  const handleDoubleClick = () => {
    if (isDragging) return;
    setIsEditing(true);
  };

  const handleDoubleTap = (e: TouchEvent) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap.current;
    if (tapLength < 300 && tapLength > 0) {
      e.preventDefault();
      handleDoubleClick();
    }
    lastTap.current = currentTime;
  }
  
  return (
    <div
      ref={noteRef}
      className={cn(
        'group absolute select-none cursor-grab transition-shadow duration-200',
        isDragging && 'shadow-xl z-10 cursor-grabbing',
        !isEditing && 'bg-transparent border-transparent',
        isEditing && 'bg-card rounded-lg shadow-md border'
      )}
      style={{
        left: note.x,
        top: note.y,
        width: note.width,
        height: note.height,
        minWidth: '150px'
      }}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClick}
      onTouchStart={handleTouchStart}
    >
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={note.content}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="absolute inset-0 w-full h-full p-4 bg-transparent resize-none rounded-lg focus:outline-none focus:ring-2 focus:ring-accent text-base leading-snug"
          placeholder="Write something..."
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <div className="w-full h-full p-4 overflow-hidden text-base whitespace-pre-wrap break-words leading-snug">
          {note.content}
        </div>
      )}
      <div className="absolute top-1.5 right-1.5 flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(note.id)}>
                <Trash2 className="h-4 w-4 text-destructive/80" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete Note</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
