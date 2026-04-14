'use client';
import type { Viewport } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Plus, Minus, Maximize, Download } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface CanvasControlsProps {
  onZoomChange: (viewport: Viewport | ((v: Viewport) => Viewport)) => void;
  scale: number;
  onSave: () => void;
}

export function CanvasControls({ onZoomChange, scale, onSave }: CanvasControlsProps) {
  const zoomIn = () => {
    onZoomChange(v => ({...v, scale: Math.min(3, v.scale * 1.2)}));
  };

  const zoomOut = () => {
    onZoomChange(v => ({...v, scale: Math.max(0.1, v.scale / 1.2)}));
  };
  
  const resetZoom = () => {
    onZoomChange({ x: 0, y: 0, scale: 1 });
  }

  return (
    <div className="fixed bottom-4 right-4 flex flex-col items-center space-y-2">
      <div className="bg-card/80 backdrop-blur-sm rounded-lg border shadow-md flex flex-col">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={zoomIn}><Plus className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent side="left"><p>Zoom In</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={zoomOut}><Minus className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent side="left"><p>Zoom Out</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={resetZoom}><Maximize className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent side="left"><p>Reset View</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onSave}><Download className="h-4 w-4" /></Button>
            </TooltipTrigger>
            <TooltipContent side="left"><p>Save to device</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      <div className="bg-card/80 text-muted-foreground text-xs font-mono rounded-md px-2 py-0.5 border shadow-md">
        {Math.round(scale * 100)}%
      </div>
    </div>
  );
}
