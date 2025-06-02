"use client";

import { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import * as Tone from "tone";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function MinuteMinderPage() {
  const [elapsedTime, setElapsedTime] = useState(0); // in milliseconds
  const [isRunning, setIsRunning] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const lastBeepTimeRef = useRef<number | null>(null); // Stores the second mark of the last beep sequence

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      const startTime = Date.now() - elapsedTime;
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 10); // Update every 10ms for smooth display
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (!isRunning || !audioInitialized || elapsedTime === 0) {
      return;
    }

    const totalElapsedSeconds = Math.floor(elapsedTime / 1000);

    // Check if it's a new minute mark (e.g., 60s, 120s, 180s)
    if (totalElapsedSeconds > 0 && totalElapsedSeconds % 60 === 0) {
      // Check if we haven't beeped for this specific minute mark yet
      if (lastBeepTimeRef.current !== totalElapsedSeconds) {
        lastBeepTimeRef.current = totalElapsedSeconds; // Mark this minute as beeped

        const synth = new Tone.Synth().toDestination();
        const now = Tone.now();
        
        // Schedule three beeps, 1 second apart, starting on the minute mark
        synth.triggerAttackRelease("C5", "8n", now);
        synth.triggerAttackRelease("C5", "8n", now + 1);
        synth.triggerAttackRelease("C5", "8n", now + 2);
        
        // Optional: Dispose synth after use to free up resources
        setTimeout(() => {
          if (synth && !synth.disposed) {
            synth.dispose();
          }
        }, 3500); // Dispose after 3.5 seconds
      }
    }
  }, [elapsedTime, isRunning, audioInitialized]);

  const handleStartStop = async () => {
    if (!audioInitialized) {
      try {
        await Tone.start();
        setAudioInitialized(true);
      } catch (error) {
        console.error("Failed to start AudioContext:", error);
        // Optionally, show a toast message to the user
        return;
      }
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
    lastBeepTimeRef.current = null; // Reset beep tracking
  };

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0"
    )}`;
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md shadow-xl rounded-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-semibold text-primary">
            Minute Minder
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div
            className="font-mono text-6xl sm:text-7xl md:text-8xl text-foreground tabular-nums"
            aria-live="polite"
            aria-atomic="true"
          >
            {formatTime(elapsedTime)}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center gap-4 p-6">
          <Button
            onClick={handleStartStop}
            className={cn(
              "px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg rounded-lg transition-all duration-150 ease-in-out transform active:scale-95",
              "bg-accent hover:bg-accent/90 text-accent-foreground focus-visible:ring-accent"
            )}
            aria-label={isRunning ? "Pause stopwatch" : "Start stopwatch"}
          >
            {isRunning ? <Pause size={28} /> : <Play size={28} />}
            <span className="ml-2">{isRunning ? "Pause" : "Start"}</span>
          </Button>
          <Button
            onClick={handleReset}
            variant="outline"
            className={cn(
              "px-6 py-3 sm:px-8 sm:py-4 text-base sm:text-lg rounded-lg transition-all duration-150 ease-in-out transform active:scale-95",
              "border-primary text-primary hover:bg-primary/10 focus-visible:ring-primary"
            )}
            disabled={elapsedTime === 0 && !isRunning}
            aria-label="Reset stopwatch"
          >
            <RotateCcw size={28} />
            <span className="ml-2">Reset</span>
          </Button>
        </CardFooter>
      </Card>
    </main>
  );
}
