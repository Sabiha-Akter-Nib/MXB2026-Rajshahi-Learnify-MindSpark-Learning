import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Trash2,
  Cloud,
  CloudOff,
  HardDrive,
  Loader2,
  CheckCircle,
  BookOpen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useOfflineLessons } from "@/hooks/useOfflineLessons";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface Subject {
  id: string;
  name: string;
  name_bn: string | null;
  icon: string;
  color: string;
  total_chapters: number;
}

export const OfflineLessonManager = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const {
    downloadedPacks,
    isDownloading,
    downloadProgress,
    downloadPack,
    removePack,
    isPackDownloaded,
    getTotalOfflineSize,
  } = useOfflineLessons();

  const { toast } = useToast();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fetch subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      const { data, error } = await supabase
        .from("subjects")
        .select("id, name, name_bn, icon, color, total_chapters")
        .order("name");

      if (!error && data) {
        setSubjects(data);
      }
      setLoading(false);
    };

    fetchSubjects();
  }, []);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleDownload = async (subject: Subject) => {
    if (!isOnline) {
      toast({
        title: "Offline",
        description: "You need an internet connection to download lesson packs.",
        variant: "destructive",
      });
      return;
    }

    const success = await downloadPack(subject.id, subject.name);
    if (success) {
      toast({
        title: "Download Complete!",
        description: `${subject.name} lessons are now available offline.`,
      });
    } else {
      toast({
        title: "Download Failed",
        description: "Please try again later.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = async (subjectId: string, subjectName: string) => {
    const success = await removePack(subjectId);
    if (success) {
      toast({
        title: "Removed",
        description: `${subjectName} offline lessons have been removed.`,
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-primary" />
          Offline Lesson Packs
        </CardTitle>
        <CardDescription>
          Download lessons to study without internet connection
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Online Status */}
        <div className={cn(
          "flex items-center gap-3 p-3 rounded-lg",
          isOnline ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
        )}>
          {isOnline ? (
            <Cloud className="w-5 h-5" />
          ) : (
            <CloudOff className="w-5 h-5" />
          )}
          <span className="font-medium">
            {isOnline ? "Online - You can download new packs" : "Offline - Using downloaded content"}
          </span>
        </div>

        {/* Storage Usage */}
        <div className="p-4 bg-muted/50 rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Offline Storage Used</span>
            <span className="text-sm text-muted-foreground">
              {formatBytes(getTotalOfflineSize())}
            </span>
          </div>
          <Progress value={Math.min((getTotalOfflineSize() / (50 * 1024 * 1024)) * 100, 100)} />
          <p className="text-xs text-muted-foreground mt-1">
            {downloadedPacks.length} subject(s) downloaded
          </p>
        </div>

        {/* Download Progress */}
        <AnimatePresence>
          {isDownloading && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-4 bg-primary/10 rounded-xl"
            >
              <div className="flex items-center gap-3 mb-2">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="font-medium">Downloading...</span>
              </div>
              <Progress value={downloadProgress} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Subject List */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Available Subjects
          </p>

          {loading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {subjects.map((subject) => {
                const isDownloaded = isPackDownloaded(subject.id);
                const pack = downloadedPacks.find(p => p.subjectId === subject.id);

                return (
                  <motion.div
                    key={subject.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border transition-colors",
                      isDownloaded 
                        ? "bg-success/5 border-success/30" 
                        : "bg-card border-border hover:border-primary/30"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {subject.name}
                        {subject.name_bn && ` (${subject.name_bn})`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {subject.total_chapters} chapters
                        {isDownloaded && pack && (
                          <span className="ml-2 text-success">
                            • Downloaded ({formatBytes(pack.sizeBytes)})
                          </span>
                        )}
                      </p>
                    </div>

                    {isDownloaded ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-success" />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemove(subject.id, subject.name)}
                          disabled={isDownloading}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(subject)}
                        disabled={isDownloading || !isOnline}
                      >
                        {isDownloading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        <span className="ml-2">Download</span>
                      </Button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};