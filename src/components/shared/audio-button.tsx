"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { speak, stopSpeaking, isSpeechSupported } from "@/lib/audio";
import type { VocabLanguage } from "@/types";

export interface AudioButtonProps extends Omit<ButtonProps, "onClick" | "title"> {
  text: string;
  language: VocabLanguage;
  label?: string;
}

export function AudioButton({ text, language, label = "Phát âm", size, variant, className, ...props }: AudioButtonProps) {
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  const onToggle = () => {
    if (playing) {
      stopSpeaking();
      setPlaying(false);
      return;
    }
    if (!isSpeechSupported()) {
      toast.error("Trình duyệt của bạn không hỗ trợ phát âm");
      return;
    }
    const ok = speak(text, language, {
      onEnd: () => setPlaying(false),
      onError: () => {
        setPlaying(false);
        toast.error("Không thể phát âm từ này");
      },
    });
    if (!ok) {
      toast.error("Không thể phát âm từ này");
      return;
    }
    setPlaying(true);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => setPlaying(false), Math.max(3000, text.length * 400));
  };

  return (
    <Button
      type="button"
      variant={playing ? "soft" : variant}
      size={size}
      onClick={onToggle}
      aria-label={playing ? `Dừng phát: ${text}` : label}
      className={className}
      {...props}
    >
      {playing ? <VolumeX /> : <Volume2 />}
    </Button>
  );
}