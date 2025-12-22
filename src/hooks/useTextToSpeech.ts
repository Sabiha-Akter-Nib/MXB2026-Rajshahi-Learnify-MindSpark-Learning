import { useState, useCallback, useEffect, useRef } from "react";

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  speak: (text: string, language?: string) => void;
  stop: () => void;
  isSupported: boolean;
}

// Remove emojis and special symbols from text
const cleanTextForSpeech = (text: string): string => {
  return text
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '') // Most emojis
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[*_~`#]/g, '')                 // Markdown
    .replace(/\s+/g, ' ')
    .trim();
};

// Detect if text contains Bangla characters
const containsBangla = (text: string): boolean => {
  return /[\u0980-\u09FF]/.test(text);
};

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  const speak = useCallback((text: string, language?: string) => {
    if (!isSupported) return;

    window.speechSynthesis.cancel();

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    const detectedLang = language || (containsBangla(cleanedText) ? "bn" : "en");
    utterance.lang = detectedLang === "bn" ? "bn-BD" : "en-US";

    // Find female voice
    const voices = voicesRef.current;
    const langVoices = voices.filter(v => v.lang.startsWith(detectedLang === "bn" ? "bn" : "en"));
    const femaleVoice = langVoices.find(v => 
      /female|woman|zira|samantha|victoria|karen/i.test(v.name)
    );
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
    } else if (langVoices.length > 0) {
      utterance.voice = langVoices[0];
    }

    utterance.rate = 0.9;
    utterance.pitch = 1.1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { isSpeaking, speak, stop, isSupported };
};
