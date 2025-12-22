import { useState, useCallback, useRef, useEffect } from "react";

interface UseTextToSpeechReturn {
  isSpeaking: boolean;
  speak: (text: string, language?: string) => void;
  stop: () => void;
  isSupported: boolean;
}

// Remove emojis and special symbols from text
const cleanTextForSpeech = (text: string): string => {
  return text
    // Remove emojis
    .replace(/[\u{1F600}-\u{1F64F}]/gu, '') // Emoticons
    .replace(/[\u{1F300}-\u{1F5FF}]/gu, '') // Misc Symbols and Pictographs
    .replace(/[\u{1F680}-\u{1F6FF}]/gu, '') // Transport and Map
    .replace(/[\u{1F1E0}-\u{1F1FF}]/gu, '') // Flags
    .replace(/[\u{2600}-\u{26FF}]/gu, '')   // Misc symbols
    .replace(/[\u{2700}-\u{27BF}]/gu, '')   // Dingbats
    .replace(/[\u{FE00}-\u{FE0F}]/gu, '')   // Variation Selectors
    .replace(/[\u{1F900}-\u{1F9FF}]/gu, '') // Supplemental Symbols
    .replace(/[\u{1FA00}-\u{1FA6F}]/gu, '') // Chess Symbols
    .replace(/[\u{1FA70}-\u{1FAFF}]/gu, '') // Symbols and Pictographs Extended-A
    .replace(/[\u{231A}-\u{231B}]/gu, '')   // Watch, Hourglass
    .replace(/[\u{23E9}-\u{23F3}]/gu, '')   // Various symbols
    .replace(/[\u{23F8}-\u{23FA}]/gu, '')   // Various symbols
    .replace(/[\u{25AA}-\u{25AB}]/gu, '')   // Squares
    .replace(/[\u{25B6}]/gu, '')            // Play button
    .replace(/[\u{25C0}]/gu, '')            // Reverse button
    .replace(/[\u{25FB}-\u{25FE}]/gu, '')   // Squares
    .replace(/[\u{2934}-\u{2935}]/gu, '')   // Arrows
    .replace(/[\u{2B05}-\u{2B07}]/gu, '')   // Arrows
    .replace(/[\u{2B1B}-\u{2B1C}]/gu, '')   // Squares
    .replace(/[\u{2B50}]/gu, '')            // Star
    .replace(/[\u{2B55}]/gu, '')            // Circle
    .replace(/[\u{3030}]/gu, '')            // Wavy dash
    .replace(/[\u{303D}]/gu, '')            // Part alternation mark
    .replace(/[\u{3297}]/gu, '')            // Circled Ideograph Congratulation
    .replace(/[\u{3299}]/gu, '')            // Circled Ideograph Secret
    // Remove markdown symbols
    .replace(/[*_~`#]/g, '')
    // Clean up extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
};

// Detect if text contains Bangla characters
const containsBangla = (text: string): boolean => {
  return /[\u0980-\u09FF]/.test(text);
};

export const useTextToSpeech = (): UseTextToSpeechReturn => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  const speak = useCallback((text: string, language?: string) => {
    if (!isSupported) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const cleanedText = cleanTextForSpeech(text);
    if (!cleanedText) return;

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utteranceRef.current = utterance;

    // Auto-detect language if not provided
    const detectedLang = language || (containsBangla(cleanedText) ? "bn" : "en");
    utterance.lang = detectedLang === "bn" ? "bn-BD" : "en-US";

    // Find a female voice for the detected language
    const findFemaleVoice = (langCode: string): SpeechSynthesisVoice | undefined => {
      const langVoices = voices.filter(v => v.lang.startsWith(langCode));
      
      // Try to find female voice (common patterns in voice names)
      const femaleVoice = langVoices.find(v => 
        v.name.toLowerCase().includes('female') ||
        v.name.toLowerCase().includes('woman') ||
        v.name.toLowerCase().includes('girl') ||
        v.name.toLowerCase().includes('zira') ||    // Windows female
        v.name.toLowerCase().includes('samantha') || // macOS female
        v.name.toLowerCase().includes('victoria') || // macOS female
        v.name.toLowerCase().includes('karen') ||    // macOS female
        v.name.toLowerCase().includes('moira') ||    // macOS female
        v.name.toLowerCase().includes('tessa') ||    // macOS female
        v.name.toLowerCase().includes('fiona') ||    // macOS female
        v.name.includes('Google') && v.name.includes('Female')
      );

      return femaleVoice || langVoices[0];
    };

    // Set voice based on language
    if (detectedLang === "bn") {
      const bnVoice = findFemaleVoice("bn");
      if (bnVoice) {
        utterance.voice = bnVoice;
      }
    } else {
      const enVoice = findFemaleVoice("en");
      if (enVoice) {
        utterance.voice = enVoice;
      }
    }

    utterance.rate = 0.9;
    utterance.pitch = 1.1; // Slightly higher pitch for more natural female sound

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  }, [isSupported, voices]);

  const stop = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [isSupported]);

  return { isSpeaking, speak, stop, isSupported };
};
