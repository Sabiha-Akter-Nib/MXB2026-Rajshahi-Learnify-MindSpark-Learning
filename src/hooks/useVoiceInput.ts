import { useState, useRef, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

// Extend Window for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  onstart: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

interface UseVoiceInputReturn {
  isRecording: boolean;
  isProcessing: boolean;
  isSupported: boolean;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => void;
}

export const useVoiceInput = (): UseVoiceInputReturn => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef<string>("");
  const resolveRef = useRef<((value: string | null) => void) | null>(null);
  const { toast } = useToast();

  const SpeechRecognitionAPI =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;

  const isSupported = !!SpeechRecognitionAPI;

  const startRecording = useCallback(async () => {
    if (!SpeechRecognitionAPI) {
      toast({
        title: "ব্রাউজার সাপোর্ট নেই",
        description: "এই ব্রাউজারে স্পিচ রিকগনিশন সাপোর্ট করে না। Chrome বা Edge ব্যবহার করুন।",
        variant: "destructive",
      });
      return;
    }

    try {
      // Request mic permission first
      await navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        stream.getTracks().forEach(t => t.stop());
      });

      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "bn-BD"; // Bengali (Bangladesh)

      transcriptRef.current = "";

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = "";
        let interimTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          transcriptRef.current += finalTranscript;
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        if (event.error === "not-allowed") {
          toast({
            title: "মাইক্রোফোন অনুমতি দিন",
            description: "ভয়েস ইনপুট ব্যবহার করতে মাইক্রোফোন অনুমতি দিন।",
            variant: "destructive",
          });
        } else if (event.error !== "aborted") {
          toast({
            title: "ভয়েস রিকগনিশন সমস্যা",
            description: "আবার চেষ্টা করুন।",
            variant: "destructive",
          });
        }
        setIsRecording(false);
        setIsProcessing(false);
        if (resolveRef.current) {
          resolveRef.current(transcriptRef.current || null);
          resolveRef.current = null;
        }
      };

      recognition.onend = () => {
        setIsRecording(false);
        setIsProcessing(false);
        if (resolveRef.current) {
          resolveRef.current(transcriptRef.current || null);
          resolveRef.current = null;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "মাইক্রোফোন অনুমতি দিন",
        description: "ভয়েস ইনপুট ব্যবহার করতে মাইক্রোফোন অ্যাক্সেস দিন।",
        variant: "destructive",
      });
    }
  }, [SpeechRecognitionAPI, toast]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!recognitionRef.current) {
        setIsRecording(false);
        resolve(null);
        return;
      }

      setIsProcessing(true);
      resolveRef.current = resolve;

      // Give a tiny delay so final results come in
      setTimeout(() => {
        recognitionRef.current?.stop();
      }, 300);
    });
  }, []);

  const cancelRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsRecording(false);
    setIsProcessing(false);
    transcriptRef.current = "";
    resolveRef.current = null;
  }, []);

  return {
    isRecording,
    isProcessing,
    isSupported,
    startRecording,
    stopRecording,
    cancelRecording,
  };
};
