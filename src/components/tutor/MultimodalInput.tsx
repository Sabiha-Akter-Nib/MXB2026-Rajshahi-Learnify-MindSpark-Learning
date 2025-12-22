import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Image, FileText, Camera, Loader2, Mic, MicOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface MultimodalInputProps {
  onContentReady: (content: string, imageData?: string) => void;
  disabled?: boolean;
  isBangla?: boolean;
}

export const MultimodalInput = ({
  onContentReady,
  disabled = false,
  isBangla = false,
}: MultimodalInputProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [mode, setMode] = useState<"text" | "image" | "voice">("text");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [textInput, setTextInput] = useState("");
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: isBangla ? "ফাইল অনেক বড়" : "File Too Large",
        description: isBangla 
          ? "১০ MB এর ছোট ফাইল নির্বাচন করুন।" 
          : "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    // Read and preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
      setMode("image");
      setIsExpanded(true);
    };
    reader.readAsDataURL(file);
  };

  const handleImageSubmit = async () => {
    if (!preview) return;

    setIsProcessing(true);
    try {
      // Extract base64 data
      const base64Data = preview.split(",")[1];
      
      // Create a message that includes the image context
      const prompt = textInput.trim() 
        ? textInput 
        : isBangla 
          ? "এই ছবিটি বিশ্লেষণ করো এবং বিষয়বস্তু ব্যাখ্যা করো।"
          : "Analyze this image and explain the content.";

      // Pass both text and image data to parent
      onContentReady(prompt, preview);
      
      // Reset state
      setPreview(null);
      setTextInput("");
      setIsExpanded(false);
    } catch (error) {
      console.error("Image processing error:", error);
      toast({
        title: isBangla ? "ত্রুটি" : "Error",
        description: isBangla 
          ? "ছবি প্রসেস করতে সমস্যা হয়েছে।" 
          : "Failed to process image.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach(track => track.stop());
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setMode("voice");
      setIsExpanded(true);
    } catch (error) {
      console.error("Microphone error:", error);
      toast({
        title: isBangla ? "মাইক্রোফোন অ্যাক্সেস প্রয়োজন" : "Microphone Access Required",
        description: isBangla 
          ? "ভয়েস ইনপুট ব্যবহার করতে মাইক্রোফোন অনুমতি দিন।"
          : "Please allow microphone access to use voice input.",
        variant: "destructive",
      });
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Audio = (reader.result as string).split(",")[1];
        
        // Call voice-to-text function
        const { data, error } = await supabase.functions.invoke("voice-to-text", {
          body: { audio: base64Audio },
        });

        if (error) throw error;

        if (data?.text) {
          onContentReady(data.text);
          setIsExpanded(false);
          toast({
            title: isBangla ? "ভয়েস রূপান্তরিত" : "Voice Converted",
            description: data.text.substring(0, 50) + "...",
          });
        }
      };
      reader.readAsDataURL(audioBlob);
    } catch (error) {
      console.error("Voice processing error:", error);
      toast({
        title: isBangla ? "ত্রুটি" : "Error",
        description: isBangla 
          ? "ভয়েস প্রসেস করতে সমস্যা হয়েছে।"
          : "Failed to process voice input.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelAction = () => {
    if (isRecording) {
      stopVoiceRecording();
    }
    setPreview(null);
    setTextInput("");
    setIsExpanded(false);
    setMode("text");
  };

  return (
    <div className="space-y-3">
      {/* Quick Action Buttons */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isProcessing}
          className="flex-1"
        >
          <Image className="w-4 h-4 mr-2" />
          {isBangla ? "ছবি" : "Image"}
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const input = fileInputRef.current;
            if (input) {
              input.accept = "image/*";
              input.setAttribute("capture", "environment");
              input.click();
            }
          }}
          disabled={disabled || isProcessing}
          className="flex-1"
        >
          <Camera className="w-4 h-4 mr-2" />
          {isBangla ? "ক্যামেরা" : "Camera"}
        </Button>

        <Button
          variant={isRecording ? "destructive" : "outline"}
          size="sm"
          onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
          disabled={disabled || isProcessing}
          className="flex-1"
        >
          {isRecording ? (
            <>
              <MicOff className="w-4 h-4 mr-2" />
              {isBangla ? "বন্ধ" : "Stop"}
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              {isBangla ? "ভয়েস" : "Voice"}
            </>
          )}
        </Button>
      </div>

      {/* Expanded Content Area */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="border border-border rounded-xl p-4 bg-card"
          >
            {/* Recording State */}
            {mode === "voice" && isRecording && (
              <div className="flex flex-col items-center py-6">
                <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
                  <Mic className="w-8 h-8 text-destructive" />
                </div>
                <p className="text-center font-medium">
                  {isBangla ? "শুনছি..." : "Listening..."}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isBangla ? "বলা শেষ হলে বন্ধ করুন" : "Click stop when done speaking"}
                </p>
              </div>
            )}

            {/* Processing State */}
            {isProcessing && (
              <div className="flex flex-col items-center py-6">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-center">
                  {isBangla ? "প্রসেস করা হচ্ছে..." : "Processing..."}
                </p>
              </div>
            )}

            {/* Image Preview */}
            {mode === "image" && preview && !isProcessing && (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full max-h-64 object-contain bg-muted"
                  />
                </div>
                
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder={isBangla 
                    ? "এই ছবি সম্পর্কে জিজ্ঞাসা করুন... (ঐচ্ছিক)"
                    : "Ask about this image... (optional)"}
                  className="resize-none"
                  rows={2}
                />

                <div className="flex gap-2">
                  <Button variant="outline" onClick={cancelAction} className="flex-1">
                    {isBangla ? "বাতিল" : "Cancel"}
                  </Button>
                  <Button onClick={handleImageSubmit} className="flex-1">
                    <Sparkles className="w-4 h-4 mr-2" />
                    {isBangla ? "বিশ্লেষণ করুন" : "Analyze"}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};