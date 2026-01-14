import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, Loader2, Check, X, Sparkles, User } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
  userId: string;
  userName?: string;
  size?: "sm" | "md" | "lg";
  showUploadButton?: boolean;
  className?: string;
  onAvatarChange?: (url: string) => void;
}

const sizeClasses = {
  sm: "w-12 h-12",
  md: "w-20 h-20",
  lg: "w-32 h-32",
};

const iconSizes = {
  sm: "w-5 h-5",
  md: "w-8 h-8",
  lg: "w-12 h-12",
};

const AvatarUpload = ({
  userId,
  userName = "",
  size = "md",
  showUploadButton = true,
  className,
  onAvatarChange,
}: AvatarUploadProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch current avatar
  useEffect(() => {
    const fetchAvatar = async () => {
      if (!userId) return;

      const { data } = await supabase
        .from("user_avatars")
        .select("avatar_url")
        .eq("user_id", userId)
        .maybeSingle();

      if (data?.avatar_url) {
        setAvatarUrl(data.avatar_url);
      }
    };

    fetchAvatar();
  }, [userId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image under 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Create unique file name
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;

      // Upload to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("avatars")
        .getPublicUrl(fileName);

      const publicUrl = urlData.publicUrl;

      // Upsert avatar record
      const { error: dbError } = await supabase
        .from("user_avatars")
        .upsert(
          { user_id: userId, avatar_url: publicUrl },
          { onConflict: "user_id" }
        );

      if (dbError) throw dbError;

      setAvatarUrl(publicUrl);
      setUploadSuccess(true);
      onAvatarChange?.(publicUrl);

      toast({
        title: "Avatar updated!",
        description: "Your profile picture has been updated successfully.",
      });

      setTimeout(() => setUploadSuccess(false), 2000);
    } catch (error) {
      console.error("Error uploading avatar:", error);
      toast({
        title: "Upload failed",
        description: "Failed to upload avatar. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <motion.div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {/* Glow effect */}
        <motion.div
          className={cn(
            "absolute inset-0 rounded-full bg-gradient-to-r from-primary via-accent to-primary-light opacity-0",
            sizeClasses[size]
          )}
          animate={{
            opacity: isHovered ? 0.6 : 0,
            scale: isHovered ? 1.15 : 1,
          }}
          style={{ filter: "blur(12px)" }}
        />

        {/* Avatar container */}
        <Avatar
          className={cn(
            "border-4 border-white shadow-xl cursor-pointer relative z-10 transition-all duration-300",
            sizeClasses[size],
            isHovered && "border-accent"
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <AvatarImage src={avatarUrl || undefined} alt={userName} />
          <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-semibold text-lg">
            {initials || <User className={iconSizes[size]} />}
          </AvatarFallback>
        </Avatar>

        {/* Upload overlay */}
        <AnimatePresence>
          {(isHovered || isUploading) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={cn(
                "absolute inset-0 rounded-full bg-black/50 flex items-center justify-center cursor-pointer z-20",
                sizeClasses[size]
              )}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : uploadSuccess ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring" }}
                >
                  <Check className="w-6 h-6 text-green-400" />
                </motion.div>
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Sparkle decorations */}
        {uploadSuccess && (
          <>
            <motion.div
              className="absolute -top-2 -right-2 z-30"
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: [0, 1.2, 1], rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Sparkles className="w-5 h-5 text-yellow-400" />
            </motion.div>
            <motion.div
              className="absolute -bottom-1 -left-1 z-30"
              initial={{ scale: 0, rotate: 0 }}
              animate={{ scale: [0, 1.2, 1], rotate: -360 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <Sparkles className="w-4 h-4 text-accent" />
            </motion.div>
          </>
        )}
      </motion.div>

      {showUploadButton && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="gap-2 rounded-full hover:bg-accent/10 hover:border-accent transition-all"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Change Avatar
              </>
            )}
          </Button>
        </motion.div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};

export default AvatarUpload;
