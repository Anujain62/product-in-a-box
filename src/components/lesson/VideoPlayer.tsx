import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from 'lucide-react';
import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface VideoPlayerProps {
  videoUrl?: string | null;
  title: string;
  onComplete?: () => void;
}

export function VideoPlayer({ videoUrl, title, onComplete }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setCurrentTime(current);
      setProgress((current / total) * 100);
      
      // Mark complete when 90% watched
      if (current / total >= 0.9 && onComplete) {
        onComplete();
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      const newTime = (value[0] / 100) * duration;
      videoRef.current.currentTime = newTime;
      setProgress(value[0]);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  // Placeholder when no video
  if (!videoUrl) {
    return (
      <div className="relative aspect-video bg-secondary rounded-xl overflow-hidden">
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
            <Play className="w-8 h-8 text-primary ml-1" />
          </div>
          <div className="text-center">
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-muted-foreground text-sm">Video coming soon</p>
          </div>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>
    );
  }

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden group">
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        muted={isMuted}
        onClick={togglePlay}
      />
      
      {/* Controls overlay */}
      <div className={cn(
        "absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent",
        "opacity-0 group-hover:opacity-100 transition-opacity duration-300"
      )}>
        {/* Center play button */}
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center hover:bg-primary transition-colors">
            {isPlaying ? (
              <Pause className="w-6 h-6 text-primary-foreground" />
            ) : (
              <Play className="w-6 h-6 text-primary-foreground ml-1" />
            )}
          </div>
        </button>
        
        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
          <Slider
            value={[progress]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="cursor-pointer"
          />
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => skip(-10)} className="text-white hover:bg-white/20">
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={togglePlay} className="text-white hover:bg-white/20">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => skip(10)} className="text-white hover:bg-white/20">
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="text-white hover:bg-white/20">
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </Button>
              <span className="text-white text-sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => videoRef.current?.requestFullscreen()}
              className="text-white hover:bg-white/20"
            >
              <Maximize className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
