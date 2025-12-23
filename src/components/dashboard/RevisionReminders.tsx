import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Calendar,
  Target,
  Brain,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Revision {
  id: string;
  topic_name: string;
  next_review_date: string;
  review_interval_days: number;
  subjects?: { name: string; name_bn: string } | null;
}

const RevisionReminders = () => {
  const [dueRevisions, setDueRevisions] = useState<Revision[]>([]);
  const [upcomingRevisions, setUpcomingRevisions] = useState<Revision[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchRevisions();
    }
  }, [user]);

  const fetchRevisions = async () => {
    setIsLoading(true);
    try {
      const dueResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/revision-scheduler`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: "getDueToday",
            userId: user?.id,
          }),
        }
      );

      const dueData = await dueResponse.json();
      setDueRevisions(dueData.revisions || []);

      const allResponse = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/revision-scheduler`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: "generate",
            userId: user?.id,
          }),
        }
      );

      const allData = await allResponse.json();
      const today = new Date().toISOString().split("T")[0];
      const upcoming = (allData.revisions || []).filter(
        (r: Revision) => r.next_review_date > today
      );
      setUpcomingRevisions(upcoming.slice(0, 5));
    } catch (error) {
      console.error("Error fetching revisions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateSchedule = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/revision-scheduler`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action: "generate",
            userId: user?.id,
          }),
        }
      );

      const data = await response.json();
      if (data.newCount > 0) {
        toast({
          title: "Revisions Scheduled!",
          description: `${data.newCount} new revision${data.newCount > 1 ? "s" : ""} added to your schedule.`,
        });
      }
      await fetchRevisions();
    } catch (error) {
      console.error("Error generating schedule:", error);
      toast({
        title: "Error",
        description: "Failed to generate revision schedule.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (dateStr === today.toISOString().split("T")[0]) {
      return "Today";
    } else if (dateStr === tomorrow.toISOString().split("T")[0]) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en", { weekday: "short", month: "short", day: "numeric" });
    }
  };

  const getDaysUntil = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50 p-6"
      >
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="relative overflow-hidden bg-card/60 backdrop-blur-sm rounded-2xl border border-border/50"
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-50" />
      
      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <motion.div
              className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Calendar className="w-5 h-5 text-primary" />
            </motion.div>
            <h3 className="font-heading font-semibold text-lg">Revision Schedule</h3>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={generateSchedule}
            disabled={isGenerating}
            className="hover:bg-primary/10"
          >
            <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Due Today */}
          <AnimatePresence mode="popLayout">
            {dueRevisions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  Due Today ({dueRevisions.length})
                </div>
                {dueRevisions.map((revision, index) => (
                  <motion.div
                    key={revision.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    whileHover={{ scale: 1.02, x: 4 }}
                    className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-xl backdrop-blur-sm"
                  >
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className="w-9 h-9 bg-destructive/20 rounded-lg flex items-center justify-center"
                        animate={{ 
                          boxShadow: ["0 0 0 0 rgba(239,68,68,0)", "0 0 0 8px rgba(239,68,68,0)"]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <Brain className="w-4 h-4 text-destructive" />
                      </motion.div>
                      <div>
                        <p className="font-medium text-sm">{revision.topic_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {revision.subjects?.name || "General"}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" className="shadow-lg" asChild>
                      <Link to={`/assessment?topic=${encodeURIComponent(revision.topic_name)}`}>
                        Review
                      </Link>
                    </Button>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Upcoming */}
          <AnimatePresence mode="popLayout">
            {upcomingRevisions.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-2"
              >
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  Upcoming
                </div>
                {upcomingRevisions.map((revision, i) => {
                  const daysUntil = getDaysUntil(revision.next_review_date);
                  return (
                    <motion.div
                      key={revision.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50 backdrop-blur-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Target className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{revision.topic_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {revision.subjects?.name || "General"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{formatDate(revision.next_review_date)}</p>
                        <p className="text-xs text-muted-foreground">
                          in {daysUntil} day{daysUntil !== 1 ? "s" : ""}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {dueRevisions.length === 0 && upcomingRevisions.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <CheckCircle2 className="w-14 h-14 text-success mx-auto mb-3 opacity-60" />
              </motion.div>
              <p className="text-muted-foreground text-sm">
                No revisions scheduled. Practice more topics to build your schedule!
              </p>
            </motion.div>
          )}

          <Button 
            variant="outline" 
            className="w-full group hover:bg-primary/5 hover:border-primary/30" 
            asChild
          >
            <Link to="/learning-plan">
              View Full Schedule
              <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default RevisionReminders;
