'use client';
import MindCanvas from '@/components/mind-canvas';
import { Toaster } from '@/components/ui/toaster';

export default function Home() {
  return (
    <main className="h-dvh w-screen overflow-hidden bg-background font-body">
      <MindCanvas />
      <Toaster />
    </main>
  );
}
