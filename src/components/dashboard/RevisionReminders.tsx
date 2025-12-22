import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
      // Get due today
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

      // Get all scheduled
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
      <Card>
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Revision Schedule
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={generateSchedule}
            disabled={isGenerating}
          >
            <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Due Today */}
        {dueRevisions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertTriangle className="w-4 h-4" />
              Due Today ({dueRevisions.length})
            </div>
            {dueRevisions.map((revision) => (
              <motion.div
                key={revision.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-destructive/10 border border-destructive/20 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-destructive/20 rounded-lg flex items-center justify-center">
                    <Brain className="w-4 h-4 text-destructive" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{revision.topic_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {revision.subjects?.name || "General"}
                    </p>
                  </div>
                </div>
                <Button size="sm" asChild>
                  <Link to={`/assessment?topic=${encodeURIComponent(revision.topic_name)}`}>
                    Review
                  </Link>
                </Button>
              </motion.div>
            ))}
          </div>
        )}

        {/* Upcoming */}
        {upcomingRevisions.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Clock className="w-4 h-4" />
              Upcoming
            </div>
            {upcomingRevisions.map((revision, i) => {
              const daysUntil = getDaysUntil(revision.next_review_date);
              return (
                <motion.div
                  key={revision.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
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
          </div>
        )}

        {dueRevisions.length === 0 && upcomingRevisions.length === 0 && (
          <div className="text-center py-6">
            <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground text-sm">
              No revisions scheduled. Practice more topics to build your schedule!
            </p>
          </div>
        )}

        <Button variant="outline" className="w-full" asChild>
          <Link to="/learning-plan">
            View Full Schedule
            <ChevronRight className="w-4 h-4 ml-1" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default RevisionReminders;
