'use client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Mouse, Move, ZoomIn } from 'lucide-react';

interface WelcomeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WelcomeDialog({ open, onOpenChange }: WelcomeDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-headline text-center">
            Welcome to Mind Canvas
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Your infinite space for ideas. Here are the basics to get you started:
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-start space-x-4">
            <Mouse className="h-6 w-6 text-primary mt-1" />
            <div>
              <h4 className="font-semibold">Create a Note</h4>
              <p className="text-sm text-muted-foreground">Double-click or double-tap anywhere on the canvas.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <Move className="h-6 w-6 text-primary mt-1" />
            <div>
              <h4 className="font-semibold">Move & Pan</h4>
              <p className="text-sm text-muted-foreground">Click and drag a note to move it. Click and drag the background to pan the canvas.</p>
            </div>
          </div>
          <div className="flex items-start space-x-4">
            <ZoomIn className="h-6 w-6 text-primary mt-1" />
            <div>
              <h4 className="font-semibold">Zoom</h4>
              <p className="text-sm text-muted-foreground">Use your mouse wheel or pinch with two fingers to zoom in and out.</p>
            </div>
          </div>
        </div>
        <Button onClick={() => onOpenChange(false)}>Got it, let's start!</Button>
      </DialogContent>
    </Dialog>
  );
}
