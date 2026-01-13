import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Image, FileText, Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFileProcessed: (content: string, type: "image" | "pdf", base64?: string, name?: string) => void;
}

export const FileUploadModal = ({
  isOpen,
  onClose,
  onFileProcessed,
}: FileUploadModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: "Please select a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setFileName(file.name);

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else if (file.type === "application/pdf") {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!fileInputRef.current?.files?.[0]) return;

    const file = fileInputRef.current.files[0];
    setIsProcessing(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Full = reader.result as string;
        const base64 = base64Full.split(",")[1];
        const isImage = file.type.startsWith("image/");

        // Pass the base64 data along with description
        const description = isImage
          ? `Please analyze this image and help me understand the content. If it's homework or a textbook page, explain the concepts shown.`
          : `Please help me understand the content of this PDF document.`;

        onFileProcessed(description, isImage ? "image" : "pdf", base64, file.name);
        onClose();
        resetState();
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: "Could not process the file. Please try again.",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const resetState = () => {
    setPreview(null);
    setFileName("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-card border border-border rounded-2xl shadow-xl max-w-md w-full p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-heading font-semibold">
              Upload Homework / Notes
            </h2>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          {!preview && !fileName ? (
            <div className="space-y-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full border-2 border-dashed border-border rounded-xl p-8 hover:border-primary/50 hover:bg-primary/5 transition-all group"
              >
                <div className="flex flex-col items-center gap-3 text-muted-foreground group-hover:text-primary">
                  <Upload className="w-10 h-10" />
                  <div className="text-center">
                    <p className="font-medium">Click to upload</p>
                    <p className="text-sm">or drag and drop</p>
                  </div>
                  <p className="text-xs">Images or PDF (max 10MB)</p>
                </div>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    const input = fileInputRef.current;
                    if (input) {
                      input.accept = "image/*";
                      input.capture = "environment";
                      input.click();
                    }
                  }}
                  className="flex items-center gap-2 p-3 rounded-xl border border-border hover:bg-muted transition-colors"
                >
                  <Camera className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">Take Photo</span>
                </button>
                <button
                  onClick={() => {
                    const input = fileInputRef.current;
                    if (input) {
                      input.accept = "application/pdf";
                      input.removeAttribute("capture");
                      input.click();
                    }
                  }}
                  className="flex items-center gap-2 p-3 rounded-xl border border-border hover:bg-muted transition-colors"
                >
                  <FileText className="w-5 h-5 text-accent" />
                  <span className="text-sm font-medium">Upload PDF</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {preview ? (
                <div className="relative rounded-xl overflow-hidden">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-48 object-cover"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
                  <FileText className="w-8 h-8 text-accent" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{fileName}</p>
                    <p className="text-sm text-muted-foreground">PDF Document</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={resetState}
                  disabled={isProcessing}
                >
                  Choose Different
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleUpload}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Ask About This"
                  )}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
