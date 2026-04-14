'use client';

import type { Note as NoteType, Viewport } from '@/lib/types';
import { useLocalStorage } from '@/hooks/use-local-storage';
import React, { useState, useRef, useCallback, MouseEvent, WheelEvent, TouchEvent, useEffect } from 'react';
import { Note } from '@/components/note';
import { CanvasControls } from '@/components/canvas-controls';
import { WelcomeDialog } from '@/components/welcome-dialog';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const NOTE_DEFAULT_WIDTH = 200;
const NOTE_DEFAULT_HEIGHT = 100;

export default function MindCanvas() {
  const [notes, setNotes] = useLocalStorage<NoteType[]>('mind-canvas-notes-v2', []);
  const [viewport, setViewport] = useLocalStorage<Viewport>('mind-canvas-viewport-v2', { x: 0, y: 0, scale: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const [showWelcome, setShowWelcome] = useLocalStorage('mind-canvas-welcome-v2', true);
  const [isClient, setIsClient] = useState(false);
  const lastTap = useRef(0);
  const canvasRef = useRef<HTMLDivElement>(null);
  const panStart = useRef({ x: 0, y: 0 });
  const pinchState = useRef<{ distance: number, midpoint: {x: number, y: number}, viewport: Viewport } | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleSave = () => {
    const dataStr = JSON.stringify(notes, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = 'mind-canvas.json';
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (clientX - rect.left - viewport.x) / viewport.scale;
    const y = (clientY - rect.top - viewport.y) / viewport.scale;
    return { x, y };
  }, [viewport]);
  
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    const { clientX, clientY, deltaY } = e;
    const { x: pointerX, y: pointerY } = getCanvasCoords(clientX, clientY);

    const scaleMultiplier = 1 - deltaY * 0.001;
    const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, viewport.scale * scaleMultiplier));

    const newX = viewport.x + (pointerX * viewport.scale - pointerX * newScale);
    const newY = viewport.y + (pointerY * viewport.scale - pointerY * newScale);
    
    setViewport({ x: newX, y: newY, scale: newScale });
  }, [viewport, setViewport, getCanvasCoords]);
  
  const startPan = useCallback((clientX: number, clientY: number) => {
    panStart.current = { x: clientX - viewport.x, y: clientY - viewport.y };
    setIsPanning(true);
  }, [viewport]);
  
  const handlePan = useCallback((clientX: number, clientY: number) => {
    if (!isPanning) return;
    setViewport(v => ({ ...v, x: clientX - panStart.current.x, y: clientY - panStart.current.y }));
  }, [isPanning, setViewport]);
  
  const endPan = useCallback(() => setIsPanning(false), []);
  
  const handleMouseDown = (e: MouseEvent) => {
    if (e.target !== canvasRef.current) return;
    startPan(e.clientX, e.clientY);
  };
  
  const handleMouseMove = (e: MouseEvent) => handlePan(e.clientX, e.clientY);

  const getDistance = (touches: TouchEvent['touches']) => {
    return Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
  };

  const getMidpoint = (touches: TouchEvent['touches']) => {
      return {
          x: (touches[0].clientX + touches[1].clientX) / 2,
          y: (touches[0].clientY + touches[1].clientY) / 2,
      };
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.target !== canvasRef.current) return;
    
    if (e.touches.length === 1) {
      handleDoubleTap(e);
      startPan(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2) {
      e.preventDefault();
      setIsPanning(false); 
      pinchState.current = {
          distance: getDistance(e.touches),
          midpoint: getMidpoint(e.touches),
          viewport: viewport,
      }
    }
  };
  
  const handleTouchMove = (e: TouchEvent) => {
    if (e.touches.length === 1) {
        handlePan(e.touches[0].clientX, e.touches[0].clientY);
    } else if (e.touches.length === 2 && pinchState.current) {
        e.preventDefault();
        const currentDistance = getDistance(e.touches);
        const currentMidpoint = getMidpoint(e.touches);
        
        const { distance: startDistance, viewport: startViewport } = pinchState.current;
        
        const scaleRatio = currentDistance / startDistance;
        const newScale = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, startViewport.scale * scaleRatio));
        
        if (canvasRef.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const anchorX = (pinchState.current.midpoint.x - rect.left - startViewport.x) / startViewport.scale;
            const anchorY = (pinchState.current.midpoint.y - rect.top - startViewport.y) / startViewport.scale;
            
            const newX = currentMidpoint.x - rect.left - anchorX * newScale;
            const newY = currentMidpoint.y - rect.top - anchorY * newScale;
            
            setViewport({ x: newX, y: newY, scale: newScale });
        }
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    endPan();
    if (e.touches.length < 2) {
        pinchState.current = null;
    }
  };

  const handleDoubleClick = (e: MouseEvent) => {
    addNote(getCanvasCoords(e.clientX, e.clientY));
  };

  const handleDoubleTap = (e: TouchEvent) => {
    const currentTime = new Date().getTime();
    const tapLength = currentTime - lastTap.current;
    if (tapLength < 300 && tapLength > 0) {
      e.preventDefault();
      addNote(getCanvasCoords(e.touches[0].clientX, e.touches[0].clientY));
    }
    lastTap.current = currentTime;
  }
  
  const addNote = useCallback(({ x, y }: { x: number; y: number }) => {
    setShowWelcome(false);
    const newNote: NoteType = {
      id: `note_${Date.now()}`,
      x: x - NOTE_DEFAULT_WIDTH / 2,
      y: y - NOTE_DEFAULT_HEIGHT / 2,
      content: '',
      width: NOTE_DEFAULT_WIDTH,
      height: NOTE_DEFAULT_HEIGHT,
      widthLocked: false
    };
    setNotes(prev => [...prev, newNote]);
  }, [setNotes, setShowWelcome]);

  const updateNote = useCallback((updatedNote: NoteType) => {
    setNotes(notes => notes.map(note => note.id === updatedNote.id ? updatedNote : note));
  }, [setNotes]);
  
  const deleteNote = useCallback((id: string) => {
    setNotes(notes => notes.filter(note => note.id !== id));
  }, [setNotes]);
  
  const transform = isClient ? `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})` : 'translate(0px, 0px) scale(1)';

  return (
    <>
      <WelcomeDialog open={showWelcome && isClient && notes.length === 0} onOpenChange={setShowWelcome} />
      <div
        ref={canvasRef}
        className="w-full h-full cursor-grab active:cursor-grabbing bg-white"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endPan}
        onMouseLeave={endPan}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onDoubleClick={handleDoubleClick}
      >
        <div
          style={{ transform: transform, transformOrigin: '0 0' }}
        >
          {isClient && notes.map(note => (
            <Note
              key={note.id}
              note={note}
              onUpdate={updateNote}
              onDelete={deleteNote}
              viewportScale={viewport.scale}
            />
          ))}
        </div>
      </div>
      {isClient && <CanvasControls onZoomChange={setViewport} scale={viewport.scale} onSave={handleSave} />}
    </>
  );
}
